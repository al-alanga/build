import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";
import { hasPermission } from "@/lib/authorization";
import { createResourceSchema } from "@/lib/resource-validation";
import { createResource, listResources } from "@/lib/resources";
import type { ResourceType } from "@prisma/client";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export async function GET(request: Request) {
  const context = await getAuthenticatedContext();
  if (!context) return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  if (!hasPermission(context.role, "resources:read")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const url = new URL(request.url);
  const typeRaw = url.searchParams.get("type");
  const allowed = ["MATERIAL", "LABOUR", "EQUIPMENT", "SUBCONTRACT", "OTHER"];
  if (typeRaw && !allowed.includes(typeRaw)) return NextResponse.json({ error: "Tipo de recurso inválido." }, { status: 400 });
  const data = await listResources(context.companyId, {
    search: url.searchParams.get("q") ?? undefined,
    type: typeRaw ? (typeRaw as ResourceType) : undefined,
    activeOnly: url.searchParams.get("active") === "true",
  });
  return NextResponse.json({ data });
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
  const parsed = createResourceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    const resource = await createResource(context.companyId, context.userId, parsed.data);
    return NextResponse.json({ data: resource }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "SUPPLIER_NOT_FOUND") {
      return NextResponse.json({ error: "O fornecedor seleccionado não pertence à sua empresa." }, { status: 400 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Já existe um recurso com este código na empresa." }, { status: 409 });
    }
    console.error("Resource creation failed", error);
    return NextResponse.json({ error: "Não foi possível registar o recurso." }, { status: 500 });
  }
}
