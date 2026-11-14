import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedContext } from "@/lib/auth";
import { hasPermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { getNextMeasurementStatus, type MeasurementAction } from "@/lib/measurement-workflow";

type RouteContext = { params: Promise<{ projectId: string; measurementId: string }> };
const schema = z.object({
  action: z.enum(["submit", "approve", "reject"]),
  note: z.string().trim().max(2000).optional(),
});
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  const context = await getAuthenticatedContext();
  if (!context) return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Acção de medição inválida.", details: parsed.error.flatten().fieldErrors }, { status: 400 });

  const action: MeasurementAction = parsed.data.action;
  if (action === "submit" && !hasPermission(context.role, "budget:write")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  if (action !== "submit" && !hasPermission(context.role, "budget:approve")) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const { projectId, measurementId } = await params;
  try {
    const data = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findFirst({ where: { id: projectId, companyId: context.companyId }, select: { id: true } });
      if (!project) throw new Error("PROJECT_NOT_FOUND");
      const measurement = await tx.executionMeasurement.findFirst({
        where: { id: measurementId, projectId },
        select: { id: true, workItemId: true, quantity: true, status: true, amount: true, measuredOn: true },
      });
      if (!measurement) throw new Error("MEASUREMENT_NOT_FOUND");

      let nextStatus: ReturnType<typeof getNextMeasurementStatus>;
      try { nextStatus = getNextMeasurementStatus(measurement.status, action); }
      catch { throw new Error("INVALID_MEASUREMENT_TRANSITION"); }

      if (action === "approve") {
        const item = await tx.workItem.findFirst({
          where: { id: measurement.workItemId, projectId },
          select: { id: true, quantity: true, children: { select: { id: true } } },
        });
        if (!item) throw new Error("ITEM_NOT_FOUND");
        if (item.children.length > 0) throw new Error("ITEM_NOT_TERMINAL");
        const approved = await tx.executionMeasurement.aggregate({
          where: { projectId, workItemId: item.id, status: "APPROVED", id: { not: measurement.id } },
          _sum: { quantity: true },
        });
        const executed = Number(approved._sum.quantity ?? 0);
        if (executed + Number(measurement.quantity) > Number(item.quantity) + 0.0000001) {
          throw new Error("MEASUREMENT_EXCEEDS_BUDGET");
        }
      }

      const updateData: { status: typeof nextStatus } = { status: nextStatus };
      const updated = await tx.executionMeasurement.updateMany({
        where: { id: measurement.id, projectId, status: measurement.status },
        data: updateData,
      });
      if (updated.count !== 1) throw new Error("MEASUREMENT_CONCURRENT_UPDATE");

      const auditAction = {
        submit: "EXECUTION_MEASUREMENT_SUBMITTED",
        approve: "EXECUTION_MEASUREMENT_APPROVED",
        reject: "EXECUTION_MEASUREMENT_REJECTED",
      }[action];
      await tx.auditLog.create({
        data: {
          companyId: context.companyId,
          userId: context.userId,
          action: auditAction,
          entityType: "ExecutionMeasurement",
          entityId: measurement.id,
          beforeData: { projectId, workItemId: measurement.workItemId, status: measurement.status },
          afterData: { projectId, workItemId: measurement.workItemId, status: nextStatus, quantity: Number(measurement.quantity), amount: Number(measurement.amount), note: parsed.data.note ?? null },
        },
      });
      return { id: measurement.id, previousStatus: measurement.status, status: nextStatus };
    });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PROJECT_NOT_FOUND") return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });
      if (error.message === "MEASUREMENT_NOT_FOUND" || error.message === "ITEM_NOT_FOUND") return NextResponse.json({ error: "Medição ou serviço não encontrado nesta obra." }, { status: 404 });
      if (error.message === "ITEM_NOT_TERMINAL") return NextResponse.json({ error: "A medição tem de pertencer a um serviço final da EAP." }, { status: 422 });
      if (error.message === "MEASUREMENT_EXCEEDS_BUDGET") return NextResponse.json({ error: "A quantidade aprovada ultrapassaria a quantidade orçamentada. Registe primeiro uma alteração contratual aprovada." }, { status: 422 });
      if (error.message === "INVALID_MEASUREMENT_TRANSITION") return NextResponse.json({ error: "Esta transição não é permitida para o estado actual da medição." }, { status: 409 });
      if (error.message === "MEASUREMENT_CONCURRENT_UPDATE") return NextResponse.json({ error: "A medição foi alterada por outro pedido. Actualize a página e tente novamente." }, { status: 409 });
    }
    console.error("Execution measurement transition failed", error);
    return NextResponse.json({ error: "Não foi possível actualizar a medição." }, { status: 500 });
  }
}
