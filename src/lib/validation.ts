import { z } from "zod";

const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal("").transform(() => undefined));

export const projectFieldsSchema = z.object({
  code: z.string().trim().min(1, "O código da obra é obrigatório.").max(40),
  name: z.string().trim().min(3, "O nome deve ter pelo menos 3 caracteres.").max(160),
  clientName: optionalTrimmed(160),
  location: optionalTrimmed(160),
  currency: z.string().trim().length(3).default("MZN"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const createProjectSchema = projectFieldsSchema.superRefine((data, ctx) => {
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    ctx.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "A data de conclusão não pode anteceder a data de início.",
    });
  }
});

export const createWorkItemSchema = z.object({
  projectId: z.string().trim().min(1),
  parentId: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(2).max(200),
  description: optionalTrimmed(2000),
  unit: z.string().trim().min(1).max(24).optional(),
  quantity: z.number().finite().nonnegative().default(0),
  sortOrder: z.number().int().nonnegative().default(0),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateWorkItemInput = z.infer<typeof createWorkItemSchema>;
