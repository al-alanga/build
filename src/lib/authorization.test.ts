import { describe, expect, it } from "vitest";
import { assertPermission, hasPermission, type Permission } from "./authorization";
import type { MembershipRole } from "@prisma/client";

const permissions: Permission[] = [
  "company:manage", "members:manage", "projects:read", "projects:write",
  "budget:read", "budget:write", "budget:approve", "resources:read",
  "resources:write", "reports:read", "audit:read",
];

const expected: Record<MembershipRole, Permission[]> = {
  OWNER: permissions,
  ADMIN: permissions,
  BUDGET_MANAGER: ["projects:read", "projects:write", "budget:read", "budget:write", "resources:read", "resources:write", "reports:read"],
  ENGINEER: ["projects:read", "projects:write", "budget:read", "resources:read"],
  FINANCE: ["projects:read", "budget:read", "budget:write", "reports:read"],
  VIEWER: ["projects:read", "budget:read", "resources:read", "reports:read"],
};

describe("company role permissions", () => {
  it.each(Object.entries(expected) as [MembershipRole, Permission[]][])(
    "%s has exactly its documented permissions",
    (role, allowed) => {
      for (const permission of permissions) {
        expect(hasPermission(role, permission), `${role} / ${permission}`).toBe(allowed.includes(permission));
      }
    },
  );

  it("keeps approval restricted to owner and admin roles", () => {
    for (const role of ["OWNER", "ADMIN"] as const) {
      expect(hasPermission(role, "budget:approve")).toBe(true);
    }
    for (const role of ["BUDGET_MANAGER", "ENGINEER", "FINANCE", "VIEWER"] as const) {
      expect(hasPermission(role, "budget:approve")).toBe(false);
    }
  });

  it("keeps company and membership administration restricted", () => {
    for (const role of ["OWNER", "ADMIN"] as const) {
      expect(hasPermission(role, "company:manage")).toBe(true);
      expect(hasPermission(role, "members:manage")).toBe(true);
    }
    for (const role of ["BUDGET_MANAGER", "ENGINEER", "FINANCE", "VIEWER"] as const) {
      expect(hasPermission(role, "company:manage")).toBe(false);
      expect(hasPermission(role, "members:manage")).toBe(false);
    }
  });

  it("keeps viewer access read-only", () => {
    expect(hasPermission("VIEWER", "projects:read")).toBe(true);
    expect(hasPermission("VIEWER", "projects:write")).toBe(false);
    expect(hasPermission("VIEWER", "budget:write")).toBe(false);
    expect(hasPermission("VIEWER", "budget:approve")).toBe(false);
    expect(hasPermission("VIEWER", "audit:read")).toBe(false);
  });

  it("throws a stable forbidden error for denied permissions", () => {
    expect(() => assertPermission("VIEWER", "projects:write")).toThrow("FORBIDDEN");
  });
});
