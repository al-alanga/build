import { describe, expect, it } from "vitest";
import { getNextMeasurementStatus } from "./measurement-workflow";

describe("measurement workflow", () => {
  it("supports draft submission followed by approval or rejection", () => {
    expect(getNextMeasurementStatus("DRAFT", "submit")).toBe("SUBMITTED");
    expect(getNextMeasurementStatus("SUBMITTED", "approve")).toBe("APPROVED");
    expect(getNextMeasurementStatus("SUBMITTED", "reject")).toBe("REJECTED");
  });
  it("rejects transitions from the wrong state", () => {
    expect(() => getNextMeasurementStatus("DRAFT", "approve")).toThrow("INVALID_MEASUREMENT_TRANSITION");
    expect(() => getNextMeasurementStatus("APPROVED", "reject")).toThrow("INVALID_MEASUREMENT_TRANSITION");
    expect(() => getNextMeasurementStatus("REJECTED", "submit")).toThrow("INVALID_MEASUREMENT_TRANSITION");
  });
});
