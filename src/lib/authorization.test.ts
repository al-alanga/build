import { describe, expect, it } from "vitest";
import { assertPermission, hasPermission } from "./authorization";

describe("company role permissions", () => {
  it("allows an owner to manage members and approve budgets", () => {
    expect(hasPermission("OWNER", "members:manage")).toBe(true);
    expect(hasPermission("OWNER", "budget:approve")).toBe(true);
  });

  it("does not allow an engineer to approve budgets or manage members", () => {
    expect(hasPermission("ENGINEER", "budget:approve")).toBe(false);
    expect(hasPermission("ENGINEER", "members:manage")).toBe(false);
  });

  it("keeps viewer access read-only", () => {
    expect(hasPermission("VIEWER", "projects:read")).toBe(true);
    expect(hasPermission("VIEWER", "projects:write")).toBe(false);
    expect(hasPermission("VIEWER", "budget:write")).toBe(false);
  });

  it("throws a stable forbidden error for denied permissions", () => {
    expect(() => assertPermission("VIEWER", "projects:write")).toThrow("FORBIDDEN");
  });
});
