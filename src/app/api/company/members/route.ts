import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedContext } from "@/lib/auth";
import { hasPermission } from "@/lib/authorization";

export const runtime = "nodejs";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

const roleSchema = z.enum(["ADMIN", "BUDGET_MANAGER", "ENGINEER", "FINANCE", "VIEWER"]);
const addSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  role: roleSchema,
});
const updateSchema = z.object({
  userId: z.string().min(1).max(128),
  role: roleSchema,
});
const removeSchema = z.object({ userId: z.string().min(1).max(128) });

async function authorised(request: Request) {
  const context = await getAuthenticatedContext();
  if (!context) return { error: NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 }) } as const;
  if (!hasPermission(context.role, "members:manage")) {
    return { error: NextResponse.json({ error: "Não tem permissão para gerir utilizadores." }, { status: 403 }) } as const;
  }
  return { context } as const;
}

export async function GET(request: Request) {
  const auth = await authorised(request);
  if ("error" in auth) return auth.error;
  try {
    const members = await prisma.membership.findMany({
      where: { companyId: auth.context.companyId },
      orderBy: [{ createdAt: "asc" }],
      select: {
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json({
      data: members.map((m) => ({ ...m.user, role: m.role, joinedAt: m.createdAt })),
      currentUserId: auth.context.userId,
      currentRole: auth.context.role,
    });
  } catch (error) {
    console.error("List members failed", error);
    return NextResponse.json({ error: "Não foi possível carregar os utilizadores." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorised(request);
  if ("error" in auth) return auth.error;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Indique um email válido e um perfil permitido." }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, email: true } });
    if (!user) return NextResponse.json({ error: "Este email ainda não tem conta no ObraCerta. O utilizador deve criar a conta antes de ser associado à empresa." }, { status: 404 });
    const existing = await prisma.membership.findUnique({ where: { userId_companyId: { userId: user.id, companyId: auth.context.companyId } } });
    if (existing) return NextResponse.json({ error: "Este utilizador já pertence à empresa." }, { status: 409 });

    const membership = await prisma.membership.create({
      data: { userId: user.id, companyId: auth.context.companyId, role: parsed.data.role },
      select: { role: true, createdAt: true, user: { select: { id: true, name: true, email: true } } },
    });
    await prisma.auditLog.create({
      data: { companyId: auth.context.companyId, userId: auth.context.userId, action: "MEMBER_ADDED", entityType: "Membership", entityId: membership.user.id, afterData: { email: membership.user.email, role: membership.role } },
    });
    return NextResponse.json({ data: { ...membership.user, role: membership.role, joinedAt: membership.createdAt } }, { status: 201 });
  } catch (error) {
    console.error("Add member failed", error);
    return NextResponse.json({ error: "Não foi possível associar o utilizador à empresa." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorised(request);
  if ("error" in auth) return auth.error;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Utilizador ou perfil inválido." }, { status: 400 });
  if (parsed.data.userId === auth.context.userId) return NextResponse.json({ error: "Não pode alterar o seu próprio perfil de acesso." }, { status: 400 });

  try {
    const target = await prisma.membership.findUnique({
      where: { userId_companyId: { userId: parsed.data.userId, companyId: auth.context.companyId } },
      select: { role: true, user: { select: { id: true, email: true } } },
    });
    if (!target) return NextResponse.json({ error: "Utilizador não encontrado nesta empresa." }, { status: 404 });
    if (target.role === "OWNER" || target.role === "ADMIN") return NextResponse.json({ error: "O perfil de proprietário/administrador não pode ser alterado por esta operação." }, { status: 403 });
    const updated = await prisma.membership.update({
      where: { userId_companyId: { userId: parsed.data.userId, companyId: auth.context.companyId } },
      data: { role: parsed.data.role },
      select: { role: true, user: { select: { id: true, email: true } } },
    });
    await prisma.auditLog.create({
      data: { companyId: auth.context.companyId, userId: auth.context.userId, action: "MEMBER_ROLE_CHANGED", entityType: "Membership", entityId: parsed.data.userId, beforeData: { role: target.role }, afterData: { role: updated.role, email: updated.user.email } },
    });
    return NextResponse.json({ data: { userId: parsed.data.userId, role: updated.role } });
  } catch (error) {
    console.error("Update member failed", error);
    return NextResponse.json({ error: "Não foi possível actualizar o perfil." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  const auth = await authorised(request);
  if ("error" in auth) return auth.error;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  const parsed = removeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Utilizador inválido." }, { status: 400 });
  if (parsed.data.userId === auth.context.userId) return NextResponse.json({ error: "Não pode remover a sua própria associação." }, { status: 400 });

  try {
    const target = await prisma.membership.findUnique({
      where: { userId_companyId: { userId: parsed.data.userId, companyId: auth.context.companyId } },
      select: { role: true, user: { select: { email: true } } },
    });
    if (!target) return NextResponse.json({ error: "Utilizador não encontrado nesta empresa." }, { status: 404 });
    if (target.role === "OWNER" || target.role === "ADMIN") return NextResponse.json({ error: "Não é permitido remover o proprietário/administrador por esta operação." }, { status: 403 });
    await prisma.membership.delete({ where: { userId_companyId: { userId: parsed.data.userId, companyId: auth.context.companyId } } });
    await prisma.auditLog.create({
      data: { companyId: auth.context.companyId, userId: auth.context.userId, action: "MEMBER_REMOVED", entityType: "Membership", entityId: parsed.data.userId, beforeData: { email: target.user.email, role: target.role } },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Remove member failed", error);
    return NextResponse.json({ error: "Não foi possível remover o utilizador." }, { status: 500 });
  }
}
