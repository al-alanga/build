import { Prisma, type Resource, type ResourceType, type Supplier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreateResourceInput, CreateSupplierInput } from "@/lib/resource-validation";

export async function listSuppliers(companyId: string, search?: string) {
  const term = search?.trim();
  return prisma.supplier.findMany({
    where: {
      companyId,
      ...(term ? { OR: [
        { name: { contains: term, mode: "insensitive" } },
        { nuit: { contains: term, mode: "insensitive" } },
      ] } : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, nuit: true, contactName: true, email: true,
      phone: true, address: true, notes: true, createdAt: true, updatedAt: true,
      _count: { select: { resources: true } },
    },
  });
}

export async function createSupplier(
  companyId: string, userId: string, input: CreateSupplierInput,
): Promise<Supplier> {
  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.create({
      data: { companyId, ...input },
    });
    await tx.auditLog.create({
      data: {
        companyId, userId, action: "SUPPLIER_CREATED",
        entityType: "Supplier", entityId: supplier.id,
        afterData: {
          name: supplier.name, nuit: supplier.nuit, email: supplier.email,
        } satisfies Prisma.InputJsonValue,
      },
    });
    return supplier;
  });
}

export async function listResources(
  companyId: string,
  filters: { search?: string; type?: ResourceType; activeOnly?: boolean } = {},
) {
  const term = filters.search?.trim();
  return prisma.resource.findMany({
    where: {
      companyId,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.activeOnly ? { isActive: true } : {}),
      ...(term ? { OR: [
        { code: { contains: term, mode: "insensitive" } },
        { name: { contains: term, mode: "insensitive" } },
      ] } : {}),
    },
    orderBy: [{ isActive: "desc" }, { type: "asc" }, { name: "asc" }],
    select: {
      id: true, code: true, name: true, type: true, unit: true,
      unitPrice: true, currency: true, productivity: true, importCost: true,
      transportCost: true, otherCost: true, isActive: true, supplierId: true,
      createdAt: true, updatedAt: true,
      supplier: { select: { id: true, name: true } },
    },
  });
}

/** The effective price includes purchase price plus per-unit logistics/other costs. */
export function calculateLandedUnitPrice(input: Pick<CreateResourceInput, "unitPrice" | "importCost" | "transportCost" | "otherCost">) {
  return new Prisma.Decimal(input.unitPrice)
    .plus(input.importCost)
    .plus(input.transportCost)
    .plus(input.otherCost);
}

export async function createResource(
  companyId: string, userId: string, input: CreateResourceInput,
): Promise<Resource> {
  return prisma.$transaction(async (tx) => {
    if (input.supplierId) {
      const supplier = await tx.supplier.findFirst({
        where: { id: input.supplierId, companyId },
        select: { id: true },
      });
      if (!supplier) throw new Error("SUPPLIER_NOT_FOUND");
    }

    const resource = await tx.resource.create({
      data: {
        companyId,
        supplierId: input.supplierId,
        code: input.code,
        name: input.name,
        type: input.type,
        unit: input.unit,
        unitPrice: new Prisma.Decimal(input.unitPrice),
        currency: input.currency,
        productivity: input.productivity === undefined ? null : new Prisma.Decimal(input.productivity),
        importCost: new Prisma.Decimal(input.importCost),
        transportCost: new Prisma.Decimal(input.transportCost),
        otherCost: new Prisma.Decimal(input.otherCost),
      },
    });
    await tx.auditLog.create({
      data: {
        companyId, userId, action: "RESOURCE_CREATED",
        entityType: "Resource", entityId: resource.id,
        afterData: {
          code: resource.code, name: resource.name, type: resource.type,
          unit: resource.unit, unitPrice: resource.unitPrice.toString(),
          currency: resource.currency,
          landedUnitPrice: calculateLandedUnitPrice(input).toString(),
        } satisfies Prisma.InputJsonValue,
      },
    });
    return resource;
  });
}
