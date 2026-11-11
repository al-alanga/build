import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";
import { hasPermission } from "@/lib/authorization";
import { createProjectSchema } from "@/lib/validation";
import { createProject, listProjects } from "@/lib/projects";

export const runtime = "nodejs";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export async function GET(request: Request) {
  const context = await getAuthenticatedContext();
  if (!context) return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  if (!hasPermission(context.role, "projects:read")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? 25);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 100) : 25;
  const projects = await listProjects(context.companyId, {
    search: url.searchParams.get("q") ?? undefined,
    status: undefined,
    limit,
    cursor: url.searchParams.get("cursor") ?? undefined,
  });
  return NextResponse.json({ data: projects });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  const context = await getAuthenticatedContext();
  if (!context) return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  if (!hasPermission(context.role, "projects:write")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const project = await createProject(context.companyId, context.userId, parsed.data);
    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Já existe uma obra com este código nesta empresa." }, { status: 409 });
    }
    console.error("Project creation failed", error);
    return NextResponse.json({ error: "Não foi possível criar a obra." }, { status: 500 });
  }
}
