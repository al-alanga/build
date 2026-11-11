import { Prisma, type Project, type ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreateProjectInput } from "@/lib/validation";

export type ProjectListFilters = {
  status?: ProjectStatus;
  search?: string;
  limit?: number;
  cursor?: string;
};

/**
 * Business layer for projects. Callers must pass companyId/userId resolved
 * from the authenticated server session, never directly from request input.
 */
export async function listProjects(companyId: string, filters: ProjectListFilters = {}) {
  const limit = Math.min(Math.max(filters.limit ?? 25, 1), 100);
  const search = filters.search?.trim();

  return prisma.project.findMany({
    where: {
      companyId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(search ? {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { clientName: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: limit,
    ...(filters.cursor ? { skip: 1, cursor: { id: filters.cursor } } : {}),
    select: {
      id: true, code: true, name: true, clientName: true, location: true,
      currency: true, status: true, startDate: true, endDate: true,
      createdAt: true, updatedAt: true,
      _count: { select: { items: true, revisions: true } },
    },
  });
}

export async function createProject(
  companyId: string,
  userId: string,
  input: CreateProjectInput,
): Promise<Project> {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        companyId,
        code: input.code,
        name: input.name,
        clientName: input.clientName || null,
        location: input.location || null,
        currency: input.currency.toUpperCase(),
        startDate: input.startDate,
        endDate: input.endDate,
      },
    });

    await tx.auditLog.create({
      data: {
        companyId,
        userId,
        action: "PROJECT_CREATED",
        entityType: "Project",
        entityId: project.id,
        afterData: {
          code: project.code,
          name: project.name,
          currency: project.currency,
        } satisfies Prisma.InputJsonValue,
      },
    });

    return project;
  });
}

export async function updateProject(
  companyId: string,
  userId: string,
  projectId: string,
  input: Partial<CreateProjectInput> & { status?: ProjectStatus },
): Promise<Project | null> {
  return prisma.$transaction(async (tx) => {
    const before = await tx.project.findFirst({
      where: { id: projectId, companyId },
    });
    if (!before) return null;

    const updated = await tx.project.update({
      where: { id: before.id },
      data: {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.clientName !== undefined ? { clientName: input.clientName || null } : {}),
        ...(input.location !== undefined ? { location: input.location || null } : {}),
        ...(input.currency !== undefined ? { currency: input.currency.toUpperCase() } : {}),
        ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
        ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });

    await tx.auditLog.create({
      data: {
        companyId,
        userId,
        action: "PROJECT_UPDATED",
        entityType: "Project",
        entityId: updated.id,
        beforeData: {
          code: before.code, name: before.name, status: before.status,
          currency: before.currency,
        } satisfies Prisma.InputJsonValue,
        afterData: {
          code: updated.code, name: updated.name, status: updated.status,
          currency: updated.currency,
        } satisfies Prisma.InputJsonValue,
      },
    });

    return updated;
  });
}
