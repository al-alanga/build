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


export async function updateResource(companyId: string, userId: string, resourceId: string, input: import("@/lib/resource-validation").UpdateResourceInput) {
 return prisma.$transaction(async tx => {
  const before=await tx.resource.findFirst({where:{id:resourceId,companyId}});
  if(!before)throw new Error("RESOURCE_NOT_FOUND");
  if(input.supplierId){const supplier=await tx.supplier.findFirst({where:{id:input.supplierId,companyId},select:{id:true}});if(!supplier)throw new Error("SUPPLIER_NOT_FOUND");}
  const data: Prisma.ResourceUpdateInput={
   ...(input.code!==undefined?{code:input.code}:{}),...(input.name!==undefined?{name:input.name}:{}),
   ...(input.type!==undefined?{type:input.type}:{}),...(input.unit!==undefined?{unit:input.unit}:{}),
   ...(input.unitPrice!==undefined?{unitPrice:new Prisma.Decimal(input.unitPrice)}:{}),
   ...(input.currency!==undefined?{currency:input.currency}:{}),
   ...(input.productivity!==undefined?{productivity:new Prisma.Decimal(input.productivity)}:{}),
   ...(input.importCost!==undefined?{importCost:new Prisma.Decimal(input.importCost)}:{}),
   ...(input.transportCost!==undefined?{transportCost:new Prisma.Decimal(input.transportCost)}:{}),
   ...(input.otherCost!==undefined?{otherCost:new Prisma.Decimal(input.otherCost)}:{}),
   ...(input.isActive!==undefined?{isActive:input.isActive}:{}),
   ...(input.supplierId!==undefined?{supplier:input.supplierId?{connect:{id:input.supplierId}}:{disconnect:true}:{})
  };
  const updated=await tx.resource.update({where:{id:before.id},data});
  await tx.auditLog.create({data:{companyId,userId,action:input.isActive===false?"RESOURCE_DEACTIVATED":input.isActive===true?"RESOURCE_REACTIVATED":"RESOURCE_UPDATED",entityType:"Resource",entityId:updated.id,beforeData:{code:before.code,name:before.name,unitPrice:before.unitPrice.toString(),isActive:before.isActive} satisfies Prisma.InputJsonValue,afterData:{code:updated.code,name:updated.name,unitPrice:updated.unitPrice.toString(),isActive:updated.isActive} satisfies Prisma.InputJsonValue}});
  return updated;
 });
}
export async function updateSupplier(companyId:string,userId:string,supplierId:string,input:import("@/lib/resource-validation").UpdateSupplierInput){
 return prisma.$transaction(async tx=>{
  const before=await tx.supplier.findFirst({where:{id:supplierId,companyId}});
  if(!before)throw new Error("SUPPLIER_NOT_FOUND");
  const updated=await tx.supplier.update({where:{id:before.id},data:input});
  await tx.auditLog.create({data:{companyId,userId,action:"SUPPLIER_UPDATED",entityType:"Supplier",entityId:updated.id,beforeData:{name:before.name,nuit:before.nuit,email:before.email} satisfies Prisma.InputJsonValue,afterData:{name:updated.name,nuit:updated.nuit,email:updated.email} satisfies Prisma.InputJsonValue}});
  return updated;
 });
}
