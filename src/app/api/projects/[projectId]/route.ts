import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";
import { hasPermission } from "@/lib/authorization";
import { updateProject } from "@/lib/projects";
import { projectFieldsSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = projectFieldsSchema.partial().extend({
  status: z.enum(["DRAFT", "BUDGETING", "APPROVED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
}).superRefine((data, ctx) => {
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "A data de conclusão não pode anteceder a data de início." });
  }
});
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const context = await getAuthenticatedContext();
  if (!context) return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  if (!hasPermission(context.role, "projects:read")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const { projectId } = await params;
  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId: context.companyId },
    select: {
      id: true, code: true, name: true, clientName: true, location: true, currency: true,
      status: true, startDate: true, endDate: true, createdAt: true, updatedAt: true,
      items: { orderBy: [{ sortOrder: "asc" }, { code: "asc" }], select: { id: true, parentId: true, code: true, name: true, unit: true, quantity: true, sortOrder: true } },
      revisions: { orderBy: { revisionNumber: "desc" }, select: { id: true, revisionNumber: true, status: true, sellingPrice: true, createdAt: true } },
    },
  });
  if (!project) return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });
  return NextResponse.json({ data: project });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  const context = await getAuthenticatedContext();
  if (!context) return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  if (!hasPermission(context.role, "projects:write")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.success ? parsed.data : {}).length === 0) {
    return NextResponse.json({ error: "Dados inválidos ou nenhuma alteração fornecida.", details: parsed.success ? undefined : parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { projectId } = await params;
  try {
    const project = await updateProject(context.companyId, context.userId, projectId, parsed.data);
    if (!project) return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });
    return NextResponse.json({ data: project });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Já existe uma obra com este código nesta empresa." }, { status: 409 });
    }
    console.error("Project update failed", error);
    return NextResponse.json({ error: "Não foi possível actualizar a obra." }, { status: 500 });
  }
}
