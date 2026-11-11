import { Prisma, type WorkItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreateWorkItemInput } from "@/lib/validation";

export class WorkItemServiceError extends Error {
  constructor(public readonly code: "PROJECT_NOT_FOUND" | "PARENT_NOT_FOUND" | "PARENT_CYCLE") {
    super(code);
    this.name = "WorkItemServiceError";
  }
}

/**
 * All project and parent lookups are scoped to the requested project.
 * The caller must derive companyId from a verified membership on the server.
 */
export async function listWorkItems(companyId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId },
    select: { id: true },
  });
  if (!project) throw new WorkItemServiceError("PROJECT_NOT_FOUND");

  return prisma.workItem.findMany({
    where: { projectId },
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    select: {
      id: true, projectId: true, parentId: true, code: true, name: true,
      description: true, unit: true, quantity: true, sortOrder: true,
    },
  });
}

export async function createWorkItem(
  companyId: string,
  userId: string,
  input: CreateWorkItemInput,
): Promise<WorkItem> {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findFirst({
      where: { id: input.projectId, companyId },
      select: { id: true },
    });
    if (!project) throw new WorkItemServiceError("PROJECT_NOT_FOUND");

    if (input.parentId) {
      const parent = await tx.workItem.findFirst({
        where: { id: input.parentId, projectId: input.projectId },
        select: { id: true },
      });
      if (!parent) throw new WorkItemServiceError("PARENT_NOT_FOUND");
    }

    const item = await tx.workItem.create({
      data: {
        projectId: input.projectId,
        parentId: input.parentId,
        code: input.code,
        name: input.name,
        description: input.description,
        unit: input.unit,
        quantity: new Prisma.Decimal(input.quantity),
        sortOrder: input.sortOrder,
      },
    });

    await tx.auditLog.create({
      data: {
        companyId,
        userId,
        action: "WORK_ITEM_CREATED",
        entityType: "WorkItem",
        entityId: item.id,
        afterData: {
          projectId: item.projectId, parentId: item.parentId, code: item.code,
          name: item.name, quantity: item.quantity.toString(), unit: item.unit,
        } satisfies Prisma.InputJsonValue,
      },
    });

    return item;
  });
}
