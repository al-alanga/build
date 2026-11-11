import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(max).optional(),
  );

const currency = z.string().trim().length(3).transform((value) => value.toUpperCase());

export const createSupplierSchema = z.object({
  name: z.string().trim().min(2).max(180),
  nuit: optionalText(30),
  contactName: optionalText(120),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).optional().transform((v) => v || undefined),
  phone: optionalText(40),
  address: optionalText(240),
  notes: optionalText(2000),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const createResourceSchema = z.object({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(2).max(180),
  type: z.enum(["MATERIAL", "LABOUR", "EQUIPMENT", "SUBCONTRACT", "OTHER"]),
  unit: z.string().trim().min(1).max(24),
  unitPrice: z.number().finite().nonnegative(),
  currency: currency.default("MZN"),
  supplierId: optionalText(100),
  productivity: z.number().finite().positive().optional(),
  importCost: z.number().finite().nonnegative().default(0),
  transportCost: z.number().finite().nonnegative().default(0),
  otherCost: z.number().finite().nonnegative().default(0),
});

export const updateResourceSchema = createResourceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
