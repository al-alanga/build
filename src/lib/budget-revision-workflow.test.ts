import { describe, expect, it } from "vitest";
import { getNextBudgetRevisionStatus } from "./budget-revision-workflow";

describe("budget revision workflow", () => {
  it("allows draft submission and submission approval/rejection", () => {
    expect(getNextBudgetRevisionStatus("DRAFT", "submit")).toBe("SUBMITTED");
    expect(getNextBudgetRevisionStatus("SUBMITTED", "approve")).toBe("APPROVED");
    expect(getNextBudgetRevisionStatus("SUBMITTED", "reject")).toBe("REJECTED");
  });

  it("does not allow approval before submission", () => {
    expect(() => getNextBudgetRevisionStatus("DRAFT", "approve")).toThrow("INVALID_REVISION_TRANSITION");
  });

  it("does not allow re-submitting or changing terminal revisions", () => {
    expect(() => getNextBudgetRevisionStatus("APPROVED", "submit")).toThrow("INVALID_REVISION_TRANSITION");
    expect(() => getNextBudgetRevisionStatus("REJECTED", "approve")).toThrow("INVALID_REVISION_TRANSITION");
    expect(() => getNextBudgetRevisionStatus("SUPERSEDED", "reject")).toThrow("INVALID_REVISION_TRANSITION");
  });
});
