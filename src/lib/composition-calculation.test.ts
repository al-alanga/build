import { describe, expect, it } from "vitest";

type Line = { coefficient: number; unitPriceAtSave: number };
function directUnitCost(lines: Line[]) {
  return lines.reduce((total, line) => total + line.coefficient * line.unitPriceAtSave, 0);
}

describe("direct unit cost arithmetic", () => {
  it("multiplies resource coefficients by the saved landed unit price", () => {
    expect(directUnitCost([
      { coefficient: 2, unitPriceAtSave: 125 },
      { coefficient: 0.5, unitPriceAtSave: 800 },
      { coefficient: 0.1, unitPriceAtSave: 1000 },
    ])).toBe(750);
  });

  it("returns zero for an empty list", () => {
    expect(directUnitCost([])).toBe(0);
  });
});
