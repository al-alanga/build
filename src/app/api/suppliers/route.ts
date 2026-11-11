import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";
import { hasPermission } from "@/lib/authorization";
import { createSupplierSchema } from "@/lib/resource-validation";
import { createSupplier, listSuppliers } from "@/lib/resources";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export async function GET(request: Request) {
  const context = await getAuthenticatedContext();
  if (!context) return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  if (!hasPermission(context.role, "resources:read")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const search = new URL(request.url).searchParams.get("q") ?? undefined;
  return NextResponse.json({ data: await listSuppliers(context.companyId, search) });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  const context = await getAuthenticatedContext();
  if (!context) return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  if (!hasPermission(context.role, "resources:write")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }
  const parsed = createSupplierSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    const supplier = await createSupplier(context.companyId, context.userId, parsed.data);
    return NextResponse.json({ data: supplier }, { status: 201 });
  } catch (error) {
    console.error("Supplier creation failed", error);
    return NextResponse.json({ error: "Não foi possível registar o fornecedor." }, { status: 500 });
  }
}
