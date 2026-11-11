import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedContext } from "@/lib/auth";
import { hasPermission } from "@/lib/authorization";
import { createCompositionVersion, listCompositionVersions, CompositionServiceError } from "@/lib/compositions";

const createSchema = z.object({
  notes: z.string().trim().max(2000).optional(),
  lines: z.array(z.object({
    resourceId: z.string().trim().min(1),
    coefficient: z.number().finite().positive(),
  })).min(1).max(500).refine(
    (lines) => new Set(lines.map((line) => line.resourceId)).size === lines.length,
    "Cada recurso só pode aparecer uma vez por composição.",
  ),
});

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

type RouteContext = { params: Promise<{ projectId: string; itemId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedContext();
  if (!context) return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  if (!hasPermission(context.role, "budget:read")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const { projectId, itemId } = await params;
  try {
    const data = await listCompositionVersions(context.companyId, projectId, itemId);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof CompositionServiceError) return NextResponse.json({ error: "Item de obra não encontrado." }, { status: 404 });
    console.error("Composition listing failed", error);
    return NextResponse.json({ error: "Não foi possível carregar as composições." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  const context = await getAuthenticatedContext();
  if (!context) return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  if (!hasPermission(context.role, "budget:write")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { projectId, itemId } = await params;
  try {
    const data = await createCompositionVersion(
      context.companyId, context.userId, projectId, itemId,
      parsed.data.lines, parsed.data.notes,
    );
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof CompositionServiceError) {
      if (error.code === "PROJECT_NOT_FOUND") return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });
      if (error.code === "ITEM_NOT_FOUND") return NextResponse.json({ error: "Item não encontrado nesta obra." }, { status: 404 });
      if (error.code === "RESOURCE_NOT_FOUND") return NextResponse.json({ error: "Um ou mais recursos não pertencem à empresa ou estão inactivos." }, { status: 400 });
      if (error.code === "CURRENCY_MISMATCH") return NextResponse.json({ error: "A moeda dos recursos deve coincidir com a moeda da obra. A conversão cambial ainda não está disponível." }, { status: 400 });
    }
    console.error("Composition creation failed", error);
    return NextResponse.json({ error: "Não foi possível criar a composição." }, { status: 500 });
  }
}
