import { describe, expect, it } from "vitest";
import { calculateBudgetPricing, calculateProfitMargin } from "./budget-calculator";

describe("calculateBudgetPricing", () => {
  it("calculates overhead, profit, tax and K transparently", () => {
    const result = calculateBudgetPricing({
      directCost: 100_000,
      indirectCost: 10_000,
      overheadRate: 0.1,
      profitRate: 0.2,
      taxRate: 0.16,
    });
    expect(result.costBase).toBe(110_000);
    expect(result.overheadAmount).toBe(11_000);
    expect(result.costAfterOverhead).toBe(121_000);
    expect(result.profitAmount).toBe(24_200);
    expect(result.sellingPriceBeforeTax).toBe(145_200);
    expect(result.taxAmount).toBe(23_232);
    expect(result.sellingPrice).toBe(168_432);
    expect(result.kCoefficient).toBeCloseTo(1.452);
  });

  it("does not treat profit markup as profit margin", () => {
    const result = calculateBudgetPricing({
      directCost: 80, indirectCost: 20, overheadRate: 0, profitRate: 0.25, taxRate: 0,
    });
    expect(result.sellingPriceBeforeTax).toBe(125);
    expect(calculateProfitMargin(result.sellingPriceBeforeTax, 100)).toBeCloseTo(0.2);
  });

  it("rejects negative costs and rates outside 0-100%", () => {
    expect(() => calculateBudgetPricing({
      directCost: -1, indirectCost: 0, overheadRate: 0, profitRate: 0, taxRate: 0,
    })).toThrow();
    expect(() => calculateBudgetPricing({
      directCost: 1, indirectCost: 0, overheadRate: 1.1, profitRate: 0, taxRate: 0,
    })).toThrow();
  });
});
