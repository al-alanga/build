import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";
import { hasPermission } from "@/lib/authorization";
import { createWorkItemSchema } from "@/lib/validation";
import { createWorkItem, listWorkItems, WorkItemServiceError } from "@/lib/work-items";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const context = await getAuthenticatedContext();
  if (!context) return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  if (!hasPermission(context.role, "projects:read")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const { projectId } = await params;
  try {
    return NextResponse.json({ data: await listWorkItems(context.companyId, projectId) });
  } catch (error) {
    if (error instanceof WorkItemServiceError && error.code === "PROJECT_NOT_FOUND") {
      return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });
    }
    console.error("Work item listing failed", error);
    return NextResponse.json({ error: "Não foi possível carregar a EAP." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  const context = await getAuthenticatedContext();
  if (!context) return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  if (!hasPermission(context.role, "projects:write")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }
  const { projectId } = await params;
  const parsed = createWorkItemSchema.safeParse({ ...(body && typeof body === "object" ? body : {}), projectId });
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten().fieldErrors }, { status: 400 });

  try {
    const item = await createWorkItem(context.companyId, context.userId, parsed.data);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkItemServiceError) {
      const status = error.code === "PROJECT_NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: error.code === "PROJECT_NOT_FOUND" ? "Obra não encontrada." : "O capítulo superior não pertence a esta obra." }, { status });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Já existe um item com este código nesta obra." }, { status: 409 });
    }
    console.error("Work item creation failed", error);
    return NextResponse.json({ error: "Não foi possível criar o item." }, { status: 500 });
  }
}
