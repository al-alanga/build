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
      code: "OB-02",
      name: "Obra de teste",
      startDate: "2026-09-20",
      endDate: "2026-09-10",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a missing code", () => {
    expect(createProjectSchema.safeParse({ name: "Obra de teste" }).success).toBe(false);
  });
});

describe("createWorkItemSchema", () => {
  it("rejects negative quantities", () => {
    expect(createWorkItemSchema.safeParse({
      projectId: "project-1",
      code: "1.1",
      name: "Escavação",
      quantity: -5,
    }).success).toBe(false);
  });

  it("accepts a valid work item and defaults quantity to zero", () => {
    const parsed = createWorkItemSchema.parse({
      projectId: "project-1",
      code: "1.1",
      name: "Escavação",
    });
    expect(parsed.quantity).toBe(0);
  });
});
