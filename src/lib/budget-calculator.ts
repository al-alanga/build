export type BudgetPricingInput = {
  directCost: number;
  indirectCost: number;
  overheadRate: number;
  profitRate: number;
  taxRate: number;
};

export type BudgetPricingResult = {
  directCost: number;
  indirectCost: number;
  costBase: number;
  overheadAmount: number;
  costAfterOverhead: number;
  profitAmount: number;
  sellingPriceBeforeTax: number;
  taxAmount: number;
  sellingPrice: number;
  kCoefficient: number;
};

/**
 * Rates are decimals: 0.10 means 10%.
 * Calculation sequence:
 * 1) cost base = direct + indirect cost
 * 2) overhead = cost base * overhead rate
 * 3) profit = (cost base + overhead) * profit rate
 * 4) tax = (pre-tax selling price) * tax rate
 * K coefficient = pre-tax selling price / direct cost.
 *
 * The tax rate is a configurable assumption, not legal/tax advice. Confirm
 * which tax base applies to each contract before using a production budget.
 */
export function calculateBudgetPricing(input: BudgetPricingInput): BudgetPricingResult {
  const values = [input.directCost, input.indirectCost, input.overheadRate, input.profitRate, input.taxRate];
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("Todos os parâmetros devem ser números finitos.");
  }
  if (input.directCost < 0 || input.indirectCost < 0) {
    throw new Error("Os custos não podem ser negativos.");
  }
  if ([input.overheadRate, input.profitRate, input.taxRate].some((rate) => rate < 0 || rate > 1)) {
    throw new Error("As taxas devem estar entre 0 e 1 (0% a 100%).");
  }

  const costBase = input.directCost + input.indirectCost;
  const overheadAmount = costBase * input.overheadRate;
  const costAfterOverhead = costBase + overheadAmount;
  const profitAmount = costAfterOverhead * input.profitRate;
  const sellingPriceBeforeTax = costAfterOverhead + profitAmount;
  const taxAmount = sellingPriceBeforeTax * input.taxRate;
  const sellingPrice = sellingPriceBeforeTax + taxAmount;

  return {
    directCost: input.directCost,
    indirectCost: input.indirectCost,
    costBase,
    overheadAmount,
    costAfterOverhead,
    profitAmount,
    sellingPriceBeforeTax,
    taxAmount,
    sellingPrice,
    kCoefficient: input.directCost > 0 ? sellingPriceBeforeTax / input.directCost : 0,
  };
}

export function calculateProfitMargin(sellingPriceBeforeTax: number, costBaseWithOverhead: number) {
  if (![sellingPriceBeforeTax, costBaseWithOverhead].every(Number.isFinite) ||
      sellingPriceBeforeTax < 0 || costBaseWithOverhead < 0) {
    throw new Error("Os valores devem ser números finitos não negativos.");
  }
  if (sellingPriceBeforeTax === 0) return 0;
  return (sellingPriceBeforeTax - costBaseWithOverhead) / sellingPriceBeforeTax;
}
