import { Prisma, type CostComposition } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CompositionLineInput = {
  resourceId: string;
  coefficient: number;
};

export class CompositionServiceError extends Error {
  constructor(public readonly code: "PROJECT_NOT_FOUND" | "ITEM_NOT_FOUND" | "RESOURCE_NOT_FOUND" | "CURRENCY_MISMATCH") {
    super(code);
    this.name = "CompositionServiceError";
  }
}

/**
 * Creates an immutable price snapshot for a new composition version.
 * Resource prices are company-owned; foreign currency conversion is deliberately
 * not guessed here and must be supplied through a future exchange-rate workflow.
 */
export async function createCompositionVersion(
  companyId: string,
  userId: string,
  projectId: string,
  workItemId: string,
  lines: CompositionLineInput[],
  notes?: string,
): Promise<CostComposition> {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findFirst({
      where: { id: projectId, companyId },
      select: { id: true, currency: true },
    });
    if (!project) throw new CompositionServiceError("PROJECT_NOT_FOUND");

    const item = await tx.workItem.findFirst({
      where: { id: workItemId, projectId },
      select: { id: true, code: true, name: true },
    });
    if (!item) throw new CompositionServiceError("ITEM_NOT_FOUND");

    const resourceIds = [...new Set(lines.map((line) => line.resourceId))];
    const resources = await tx.resource.findMany({
      where: { id: { in: resourceIds }, companyId, isActive: true },
      select: {
        id: true, code: true, name: true, unitPrice: true, currency: true,
        importCost: true, transportCost: true, otherCost: true,
      },
    });
    if (resources.length !== resourceIds.length) {
      throw new CompositionServiceError("RESOURCE_NOT_FOUND");
    }
    if (resources.some((resource) => resource.currency !== project.currency)) {
      throw new CompositionServiceError("CURRENCY_MISMATCH");
    }

    const latest = await tx.costComposition.aggregate({
      where: { workItemId },
      _max: { version: true },
    });
    const version = (latest._max.version ?? 0) + 1;

    const composition = await tx.costComposition.create({
      data: {
        workItemId,
        version,
        notes: notes?.trim() || null,
        lines: {
          create: lines.map((line) => {
            const resource = resources.find((entry) => entry.id === line.resourceId)!;
            const landedPrice = resource.unitPrice
              .plus(resource.importCost)
              .plus(resource.transportCost)
              .plus(resource.otherCost);
            return {
              resourceId: resource.id,
              coefficient: new Prisma.Decimal(line.coefficient),
              unitPriceAtSave: landedPrice,
            };
          }),
        },
      },
      include: { lines: true },
    });

    const directUnitCost = composition.lines.reduce(
      (total, line) => total.plus(line.coefficient.mul(line.unitPriceAtSave)),
      new Prisma.Decimal(0),
    );
    await tx.auditLog.create({
      data: {
        companyId,
        userId,
        action: "COMPOSITION_VERSION_CREATED",
        entityType: "CostComposition",
        entityId: composition.id,
        afterData: {
          projectId, workItemId, version, lineCount: composition.lines.length,
          directUnitCost: directUnitCost.toString(),
          currency: project.currency,
        } satisfies Prisma.InputJsonValue,
      },
    });
    return composition;
  });
}

export async function listCompositionVersions(
  companyId: string,
  projectId: string,
  workItemId: string,
) {
  const item = await prisma.workItem.findFirst({
    where: { id: workItemId, projectId, project: { companyId } },
    select: { id: true },
  });
  if (!item) throw new CompositionServiceError("ITEM_NOT_FOUND");

  return prisma.costComposition.findMany({
    where: { workItemId },
    orderBy: { version: "desc" },
    include: {
      lines: {
        include: {
          resource: { select: { id: true, code: true, name: true, type: true, unit: true, currency: true } },
        },
      },
    },
  });
}
