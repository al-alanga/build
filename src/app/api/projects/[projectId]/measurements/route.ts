import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedContext } from "@/lib/auth";
import { hasPermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ projectId: string }> };

const measurementSchema = z.object({
  workItemId: z.string().trim().min(1),
  quantity: z.number().finite().positive().max(1_000_000_000),
  measuredOn: z.string().datetime().optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  notes: z.string().trim().max(2000).optional(),
}).superRefine((value, ctx) => {
  if (value.periodStart && value.periodEnd && value.periodEnd < value.periodStart) {
    ctx.addIssue({ code: "custom", path: ["periodEnd"], message: "O fim do período não pode anteceder o início." });
  }
});

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedContext();
  if (!context) return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  if (!hasPermission(context.role, "budget:read")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { projectId } = await params;
  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId: context.companyId },
    select: { id: true, name: true, currency: true },
  });
  if (!project) return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });

  const [items, measurements] = await Promise.all([
    prisma.workItem.findMany({
      where: { projectId },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      include: { children: { select: { id: true } }, compositions: { orderBy: { version: "desc" }, take: 1, include: { lines: { select: { coefficient: true, unitPriceAtSave: true } } } } },
    }),
    prisma.executionMeasurement.findMany({
      where: { projectId },
      orderBy: [{ measuredOn: "desc" }, { createdAt: "desc" }],
      include: { workItem: { select: { id: true, code: true, name: true, unit: true, quantity: true } } },
    }),
  ]);

  const budgetItems = items.filter((item) => item.children.length === 0).map((item) => {
    const composition = item.compositions[0];
    const unitCost = composition?.lines.reduce((sum, line) => sum + Number(line.coefficient) * Number(line.unitPriceAtSave), 0) ?? 0;
    return { id: item.id, code: item.code, name: item.name, unit: item.unit, budgetQuantity: Number(item.quantity), unitCost };
  });

  const totals = new Map<string, number>();
  for (const measurement of measurements) {
    if (measurement.status === "APPROVED") totals.set(measurement.workItemId, (totals.get(measurement.workItemId) ?? 0) + Number(measurement.quantity));
  }
  const executionSummary = budgetItems.map((item) => {
    const executedQuantity = totals.get(item.id) ?? 0;
    const remainingQuantity = item.budgetQuantity - executedQuantity;
    return {
      ...item,
      executedQuantity,
      remainingQuantity,
      executedValue: executedQuantity * item.unitCost,
      remainingValue: remainingQuantity * item.unitCost,
      quantityVariance: executedQuantity - item.budgetQuantity,
    };
  });

  return NextResponse.json({ data: { project, items: executionSummary, measurements } });
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
  const parsed = measurementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados da medição inválidos.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { projectId } = await params;
  const data = parsed.data;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findFirst({
        where: { id: projectId, companyId: context.companyId },
        select: { id: true },
      });
      if (!project) throw new Error("PROJECT_NOT_FOUND");

      const item = await tx.workItem.findFirst({
        where: { id: data.workItemId, projectId },
        include: { children: { select: { id: true } }, compositions: { orderBy: { version: "desc" }, take: 1, include: { lines: { select: { coefficient: true, unitPriceAtSave: true } } } } },
      });
      if (!item) throw new Error("ITEM_NOT_FOUND");
      if (item.children.length > 0) throw new Error("ITEM_NOT_TERMINAL");

      const composition = item.compositions[0];
      if (!composition || composition.lines.length === 0) throw new Error("MISSING_COMPOSITION");
      const unitPrice = composition.lines.reduce((sum, line) => sum + Number(line.coefficient) * Number(line.unitPriceAtSave), 0);
      const quantity = data.quantity;
      const measurement = await tx.executionMeasurement.create({
        data: {
          projectId,
          workItemId: item.id,
          createdByUserId: context.userId,
          measuredOn: data.measuredOn ? new Date(data.measuredOn) : new Date(),
          periodStart: data.periodStart ? new Date(data.periodStart) : null,
          periodEnd: data.periodEnd ? new Date(data.periodEnd) : null,
          quantity,
          unitPriceAtMeasurement: unitPrice,
          amount: quantity * unitPrice,
          notes: data.notes,
          status: "DRAFT",
        },
        include: { workItem: { select: { id: true, code: true, name: true, unit: true, quantity: true } } },
      });
      await tx.auditLog.create({
        data: {
          companyId: context.companyId,
          userId: context.userId,
          action: "EXECUTION_MEASUREMENT_CREATED",
          entityType: "ExecutionMeasurement",
          entityId: measurement.id,
          afterData: { projectId, workItemId: item.id, quantity, unitPriceAtMeasurement: unitPrice, amount: quantity * unitPrice, status: "DRAFT" },
        },
      });
      return measurement;
    });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PROJECT_NOT_FOUND") return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });
      if (error.message === "ITEM_NOT_FOUND") return NextResponse.json({ error: "Serviço não encontrado nesta obra." }, { status: 404 });
      if (error.message === "ITEM_NOT_TERMINAL") return NextResponse.json({ error: "Registe medições apenas em serviços finais da EAP." }, { status: 422 });
      if (error.message === "MISSING_COMPOSITION") return NextResponse.json({ error: "O serviço precisa de uma composição de custos antes de registar a medição." }, { status: 422 });
    }
    console.error("Execution measurement creation failed", error);
    return NextResponse.json({ error: "Não foi possível registar a medição." }, { status: 500 });
  }
}
