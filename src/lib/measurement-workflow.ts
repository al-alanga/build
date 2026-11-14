export type MeasurementStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type MeasurementAction = "submit" | "approve" | "reject";

/** Explicit state machine: only submitted measurements may be approved or rejected. */
export function getNextMeasurementStatus(status: MeasurementStatus, action: MeasurementAction): MeasurementStatus {
  if (status === "DRAFT" && action === "submit") return "SUBMITTED";
  if (status === "SUBMITTED" && action === "approve") return "APPROVED";
  if (status === "SUBMITTED" && action === "reject") return "REJECTED";
  throw new Error("INVALID_MEASUREMENT_TRANSITION");
}
