import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/auth-validation";

export const runtime = "nodejs";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    return NextResponse.json({ error: "O servidor ainda não está configurado para criar sessões." }, { status: 503 });
  }
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, email, password, companyName, nuit } = parsed.data;
  try {
    const passwordHash = await hash(password, 12);
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name, email, passwordHash } });
      const company = await tx.company.create({ data: { name: companyName, nuit: nuit || null } });
      await tx.membership.create({
        data: { userId: user.id, companyId: company.id, role: "OWNER" },
      });
      return { user, company };
    });

    await createSession(created.user.id, created.company.id);
    return NextResponse.json({
      user: { id: created.user.id, name: created.user.name, email: created.user.email },
      company: { id: created.company.id, name: created.company.name, baseCurrency: created.company.baseCurrency },
    }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Não foi possível criar a conta com estes dados. Verifique se o email já está registado." }, { status: 409 });
    }
    console.error("Registration failed", error);
    return NextResponse.json({ error: "Não foi possível concluir o registo. Verifique a configuração do servidor." }, { status: 500 });
  }
}
