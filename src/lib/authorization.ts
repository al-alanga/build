import type { MembershipRole } from "@prisma/client";

export type Permission =
  | "company:manage"
  | "members:manage"
  | "projects:read"
  | "projects:write"
  | "budget:read"
  | "budget:write"
  | "budget:approve"
  | "resources:read"
  | "resources:write"
  | "reports:read"
  | "audit:read";

const ROLE_PERMISSIONS: Record<MembershipRole, readonly Permission[]> = {
  OWNER: [
    "company:manage", "members:manage", "projects:read", "projects:write",
    "budget:read", "budget:write", "budget:approve", "resources:read",
    "resources:write", "reports:read", "audit:read",
  ],
  ADMIN: [
    "company:manage", "members:manage", "projects:read", "projects:write",
    "budget:read", "budget:write", "budget:approve", "resources:read",
    "resources:write", "reports:read", "audit:read",
  ],
  BUDGET_MANAGER: [
    "projects:read", "projects:write", "budget:read", "budget:write",
    "resources:read", "resources:write", "reports:read",
  ],
  ENGINEER: [
    "projects:read", "projects:write", "budget:read", "resources:read",
  ],
  FINANCE: [
    "projects:read", "budget:read", "budget:write", "reports:read",
  ],
  VIEWER: [
    "projects:read", "budget:read", "resources:read", "reports:read",
  ],
};

/**
 * Checks a permission for a role already resolved from the authenticated
 * user's membership in the active company. Never trust a role supplied by
 * the browser or a request body.
 */
export function hasPermission(role: MembershipRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function assertPermission(role: MembershipRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error("FORBIDDEN");
  }
}
