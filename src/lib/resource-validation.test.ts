import { describe, expect, it } from "vitest";
import { createResourceSchema, createSupplierSchema } from "./resource-validation";
import { calculateLandedUnitPrice } from "./resources";

describe("createSupplierSchema", () => {
  it("normalizes supplier contact details", () => {
    const supplier = createSupplierSchema.parse({
      name: "  Cimentos do Sul  ", email: "compras@example.co.mz", phone: "",
    });
    expect(supplier.name).toBe("Cimentos do Sul");
    expect(supplier.email).toBe("compras@example.co.mz");
    expect(supplier.phone).toBeUndefined();
  });

  it("rejects malformed supplier emails", () => {
    expect(createSupplierSchema.safeParse({ name: "Fornecedor", email: "invalid" }).success).toBe(false);
  });
});

describe("createResourceSchema", () => {
  it("defaults currency and logistics costs", () => {
    const resource = createResourceSchema.parse({
      code: "MAT-001", name: "Cimento 32.5", type: "MATERIAL", unit: "saco", unitPrice: 450,
    });
    expect(resource.currency).toBe("MZN");
    expect(resource.importCost).toBe(0);
    expect(resource.transportCost).toBe(0);
    expect(resource.otherCost).toBe(0);
  });

  it("rejects negative prices and unknown resource types", () => {
    expect(createResourceSchema.safeParse({
      code: "MAT-002", name: "Areia", type: "MATERIAL", unit: "m3", unitPrice: -1,
    }).success).toBe(false);
    expect(createResourceSchema.safeParse({
      code: "MAT-003", name: "Recurso", type: "UNKNOWN", unit: "un", unitPrice: 1,
    }).success).toBe(false);
  });
});

describe("calculateLandedUnitPrice", () => {
  it("adds purchase, import, transport and other per-unit costs", () => {
    const result = calculateLandedUnitPrice({
      unitPrice: 100, importCost: 15, transportCost: 8, otherCost: 2,
    });
    expect(result.toString()).toBe("125");
  });
});
