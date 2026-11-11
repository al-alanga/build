import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/auth-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Credenciais inválidas." }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, name: true, email: true, passwordHash: true, memberships: {
        orderBy: { createdAt: "asc" }, take: 1, select: { companyId: true, company: { select: { id: true, name: true, baseCurrency: true } } },
      } },
    });
    if (!user?.passwordHash || !(await compare(parsed.data.password, user.passwordHash)) || !user.memberships[0]) {
      return NextResponse.json({ error: "Email ou palavra-passe incorrectos." }, { status: 401 });
    }

    const membership = user.memberships[0];
    await createSession(user.id, membership.companyId);
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
      company: membership.company,
    });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Não foi possível iniciar sessão. Verifique a configuração do servidor." }, { status: 500 });
  }
}
