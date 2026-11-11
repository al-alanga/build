import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const context = await getAuthenticatedContext();
  if (!context) return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });

  const [user, company] = await Promise.all([
    prisma.user.findUnique({ where: { id: context.userId }, select: { id: true, name: true, email: true } }),
    prisma.company.findUnique({ where: { id: context.companyId }, select: { id: true, name: true, baseCurrency: true } }),
  ]);
  if (!user || !company) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  return NextResponse.json({ user, company, role: context.role });
}
