export type BudgetRevisionStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "SUPERSEDED";
export type BudgetRevisionAction = "submit" | "approve" | "reject";

/**
 * Defines the only supported budget revision state transitions.
 * A rejected or superseded revision is terminal; create a new revision for changes.
 */
export function getNextBudgetRevisionStatus(
  status: BudgetRevisionStatus,
  action: BudgetRevisionAction,
): BudgetRevisionStatus {
  if (status === "DRAFT" && action === "submit") return "SUBMITTED";
  if (status === "SUBMITTED" && action === "approve") return "APPROVED";
  if (status === "SUBMITTED" && action === "reject") return "REJECTED";
  throw new Error("INVALID_REVISION_TRANSITION");
}
