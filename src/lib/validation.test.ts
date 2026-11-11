import { describe, expect, it } from "vitest";
import { createProjectSchema, createWorkItemSchema } from "./validation";

describe("createProjectSchema", () => {
  it("trims strings and defaults the currency to MZN", () => {
    const parsed = createProjectSchema.parse({ code: " OB-01 ", name: " Reabilitação da escola " });
    expect(parsed.code).toBe("OB-01");
    expect(parsed.name).toBe("Reabilitação da escola");
    expect(parsed.currency).toBe("MZN");
  });

  it("rejects an end date earlier than the start date", () => {
    const parsed = createProjectSchema.safeParse({
      code: "OB-02", name: "Obra de teste",
      startDate: "2026-09-20", endDate: "2026-09-10",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a missing code and unsupported currency length", () => {
    expect(createProjectSchema.safeParse({ name: "Obra de teste" }).success).toBe(false);
    expect(createProjectSchema.safeParse({ code: "OB-03", name: "Obra válida", currency: "MZNX" }).success).toBe(false);
  });

  it("accepts optional text fields as empty and normalizes them", () => {
    const parsed = createProjectSchema.parse({
      code: "OB-04", name: "Obra válida", clientName: "", location: "",
    });
    expect(parsed.clientName).toBeUndefined();
    expect(parsed.location).toBeUndefined();
  });
});

describe("createWorkItemSchema", () => {
  it("rejects negative quantities and fractional sort order", () => {
    expect(createWorkItemSchema.safeParse({
      projectId: "project-1", code: "1.1", name: "Escavação", quantity: -5,
    }).success).toBe(false);
    expect(createWorkItemSchema.safeParse({
      projectId: "project-1", code: "1.1", name: "Escavação", sortOrder: 1.5,
    }).success).toBe(false);
  });

  it("accepts a valid work item and defaults quantity to zero", () => {
    const parsed = createWorkItemSchema.parse({
      projectId: "project-1", code: "1.1", name: "Escavação",
    });
    expect(parsed.quantity).toBe(0);
  });

  it("rejects a missing project and blank work item name", () => {
    expect(createWorkItemSchema.safeParse({ code: "1.1", name: "Escavação" }).success).toBe(false);
    expect(createWorkItemSchema.safeParse({
      projectId: "project-1", code: "1.1", name: " ",
    }).success).toBe(false);
  });
});
