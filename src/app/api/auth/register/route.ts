import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/auth-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
