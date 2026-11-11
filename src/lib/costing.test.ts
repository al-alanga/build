import { describe, expect, it } from "vitest";
import { calculateBudget, calculateUnitCost, calculateVariance } from "./costing";

describe("calculateUnitCost", () => {
  it("sums resource coefficients multiplied by unit prices", () => {
    expect(calculateUnitCost([
      { coefficient: 2, unitPrice: 100 },
      { coefficient: 0.5, unitPrice: 40 },
    ])).toBe(220);
  });

  it("returns zero for an empty composition", () => {
    expect(calculateUnitCost([])).toBe(0);
  });

  it("rejects negative values", () => {
    expect(() => calculateUnitCost([{ coefficient: -1, unitPrice: 10 }])).toThrow(RangeError);
  });
});

describe("calculateBudget", () => {
  it("shows each component and computes K transparently", () => {
    const result = calculateBudget({
      directCost: 1000,
      indirectCost: 200,
      overheadRate: 0.1,
      profitRate: 0.2,
      taxRate: 0.16,
    });

    expect(result.baseCost).toBe(1200);
    expect(result.overheadAmount).toBe(120);
    expect(result.profitAmount).toBe(264);
    expect(result.preTaxPrice).toBe(1584);
    expect(result.taxAmount).toBe(253.44);
    expect(result.sellingPrice).toBe(1837.44);
    expect(result.kCoefficient).toBe(1.5312);
  });

  it("does not hardcode a tax rate", () => {
    expect(calculateBudget({
      directCost: 100,
      indirectCost: 0,
      overheadRate: 0,
      profitRate: 0,
      taxRate: 0,
    }).sellingPrice).toBe(100);
  });

  it("rejects rates outside the supported range", () => {
    expect(() => calculateBudget({
      directCost: 100,
      indirectCost: 0,
      overheadRate: 1.2,
      profitRate: 0,
      taxRate: 0,
    })).toThrow(RangeError);
  });
});

describe("calculateVariance", () => {
  it("returns budget minus actual and percentage variance", () => {
    expect(calculateVariance(100, 80)).toEqual({ amount: 20, percentage: 20 });
  });

  it("avoids division by zero", () => {
    expect(calculateVariance(0, 10).percentage).toBeNull();
  });
});
