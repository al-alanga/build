/**
 * Pure calculation functions for construction budgets.
 * Rates are decimal fractions: 10% is 0.10, not 10.
 * No tax or statutory rate is assumed by the engine.
 */

export interface CompositionInput {
  coefficient: number;
  unitPrice: number;
}

export interface BudgetInput {
  directCost: number;
  indirectCost: number;
  overheadRate: number;
  profitRate: number;
  taxRate: number;
}

export interface BudgetResult {
  directCost: number;
  indirectCost: number;
  baseCost: number;
  overheadAmount: number;
  profitAmount: number;
  preTaxPrice: number;
  taxAmount: number;
  sellingPrice: number;
  kCoefficient: number;
}

/** Cost per unit of service, based on resource coefficients and current prices. */
export function calculateUnitCost(lines: CompositionInput[]): number {
  return roundMoney(lines.reduce((sum, line) => {
    assertFiniteNonNegative(line.coefficient, "coefficient");
    assertFiniteNonNegative(line.unitPrice, "unitPrice");
    return sum + line.coefficient * line.unitPrice;
  }, 0));
}

/**
 * Builds a selling price transparently.
 * Overhead and profit are applied to direct + indirect cost.
 * Tax is applied to the pre-tax selling price.
 * This is a documented initial convention, not a statement of Mozambique tax law.
 */
export function calculateBudget(input: BudgetInput): BudgetResult {
  assertFiniteNonNegative(input.directCost, "directCost");
  assertFiniteNonNegative(input.indirectCost, "indirectCost");
  assertRate(input.overheadRate, "overheadRate");
  assertRate(input.profitRate, "profitRate");
  assertRate(input.taxRate, "taxRate");

  const baseCost = input.directCost + input.indirectCost;
  const overheadAmount = baseCost * input.overheadRate;
  const costWithOverhead = baseCost + overheadAmount;
  const profitAmount = costWithOverhead * input.profitRate;
  const preTaxPrice = costWithOverhead + profitAmount;
  const taxAmount = preTaxPrice * input.taxRate;
  const sellingPrice = preTaxPrice + taxAmount;

  return {
    directCost: roundMoney(input.directCost),
    indirectCost: roundMoney(input.indirectCost),
    baseCost: roundMoney(baseCost),
    overheadAmount: roundMoney(overheadAmount),
    profitAmount: roundMoney(profitAmount),
    preTaxPrice: roundMoney(preTaxPrice),
    taxAmount: roundMoney(taxAmount),
    sellingPrice: roundMoney(sellingPrice),
    kCoefficient: baseCost === 0 ? 0 : roundRatio(sellingPrice / baseCost),
  };
}

/** Returns the difference between budgeted and actual amounts. */
export function calculateVariance(budgeted: number, actual: number): {
  amount: number;
  percentage: number | null;
} {
  assertFiniteNonNegative(budgeted, "budgeted");
  assertFiniteNonNegative(actual, "actual");
  return {
    amount: roundMoney(budgeted - actual),
    percentage: budgeted === 0 ? null : roundRatio(((budgeted - actual) / budgeted) * 100),
  };
}

function assertFiniteNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite, non-negative number`);
  }
}

function assertRate(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${name} must be between 0 and 1`);
  }
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundRatio(value: number): number {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}
