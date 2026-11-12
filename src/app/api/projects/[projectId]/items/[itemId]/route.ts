import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getAuthenticatedContext } from "@/lib/auth";
import { hasPermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  code: z.string().trim().min(1).max(40).optional(),
  name: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  unit: z.string().trim().max(24).nullable().optional(),
  quantity: z.number().finite().nonnegative().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
}).strict();

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; itemId: string }> },
) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  const context = await getAuthenticatedContext();
  if (!context) return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  if (!hasPermission(context.role, "projects:write")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Forneça pelo menos um campo para actualizar." }, { status: 400 });
  }

  const { projectId, itemId } = await params;
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.workItem.findFirst({
        where: { id: itemId, projectId, project: { companyId: context.companyId } },
      });
      if (!item) return null;

      const data: Prisma.WorkItemUpdateInput = {
        ...parsed.data,
        ...(parsed.data.quantity !== undefined ? { quantity: new Prisma.Decimal(parsed.data.quantity) } : {}),
      };
      const next = await tx.workItem.update({ where: { id: item.id }, data });
      await tx.auditLog.create({
        data: {
          companyId: context.companyId,
          userId: context.userId,
          action: "WORK_ITEM_UPDATED",
          entityType: "WorkItem",
          entityId: next.id,
          beforeData: {
            code: item.code, name: item.name, description: item.description,
            unit: item.unit, quantity: item.quantity.toString(), sortOrder: item.sortOrder,
          } satisfies Prisma.InputJsonValue,
          afterData: {
            code: next.code, name: next.name, description: next.description,
            unit: next.unit, quantity: next.quantity.toString(), sortOrder: next.sortOrder,
          } satisfies Prisma.InputJsonValue,
        },
      });
      return next;
    });
    if (!updated) return NextResponse.json({ error: "Item não encontrado nesta obra." }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Já existe um item com este código nesta obra." }, { status: 409 });
    }
    console.error("Work item update failed", error);
    return NextResponse.json({ error: "Não foi possível actualizar o item." }, { status: 500 });
  }
}
