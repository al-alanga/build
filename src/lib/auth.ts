import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "obracerta_session";
const SESSION_SECONDS = 60 * 60 * 12;

function getSessionSecret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET deve ter pelo menos 32 caracteres.");
  }
  return new TextEncoder().encode(value);
}

export type AuthenticatedContext = {
  userId: string;
  companyId: string;
  role: "OWNER" | "ADMIN" | "BUDGET_MANAGER" | "ENGINEER" | "FINANCE" | "VIEWER";
};

export async function createSession(userId: string, companyId: string) {
  const membership = await prisma.membership.findUnique({
    where: { userId_companyId: { userId, companyId } },
    select: { role: true },
  });
  if (!membership) throw new Error("MEMBERSHIP_NOT_FOUND");

  const token = await new SignJWT({ companyId, role: membership.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .setIssuer("obracerta")
    .setAudience("obracerta-web")
    .sign(getSessionSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Validates the signed cookie and re-resolves current membership/role from DB.
 * This ensures a removed membership or changed role takes effect immediately.
 */
export async function getAuthenticatedContext(): Promise<AuthenticatedContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      issuer: "obracerta",
      audience: "obracerta-web",
      algorithms: ["HS256"],
    });
    if (!payload.sub || typeof payload.companyId !== "string") return null;

    const membership = await prisma.membership.findUnique({
      where: { userId_companyId: { userId: payload.sub, companyId: payload.companyId } },
      select: { userId: true, companyId: true, role: true },
    });
    if (!membership) return null;

    return {
      userId: membership.userId,
      companyId: membership.companyId,
      role: membership.role,
    };
  } catch {
    return null;
  }
}
