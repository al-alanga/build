import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedContext } from "@/lib/auth";
import { hasPermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { getNextBudgetRevisionStatus, type BudgetRevisionAction } from "@/lib/budget-revision-workflow";

type RouteContext = { params: Promise<{ projectId: string; revisionId: string }> };

const actionSchema = z.object({
  action: z.enum(["submit", "approve", "reject"]),
  note: z.string().trim().max(2000).optional(),
});

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/**
 * Enforces the budget revision lifecycle on the server.
 * Approved revisions are immutable; subsequent changes require a new revision.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }

  const context = await getAuthenticatedContext();
  if (!context) {
    return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Acção de revisão inválida.", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const action: BudgetRevisionAction = parsed.data.action;
  if (action === "submit" && !hasPermission(context.role, "budget:write")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
  if (action !== "submit" && !hasPermission(context.role, "budget:approve")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { projectId, revisionId } = await params;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findFirst({
        where: { id: projectId, companyId: context.companyId },
        select: { id: true },
      });
      if (!project) throw new Error("PROJECT_NOT_FOUND");

      const revision = await tx.budgetRevision.findFirst({
        where: { id: revisionId, projectId },
        select: { id: true, revisionNumber: true, status: true, sellingPrice: true },
      });
      if (!revision) throw new Error("REVISION_NOT_FOUND");

      let nextStatus: ReturnType<typeof getNextBudgetRevisionStatus>;
      try {
        nextStatus = getNextBudgetRevisionStatus(revision.status, action);
      } catch {
        throw new Error("INVALID_REVISION_TRANSITION");
      }

      const now = new Date();
      const updateData: {
        status: typeof nextStatus;
        submittedAt?: Date;
        approvedAt?: Date;
        approvedByUserId?: string;
      } = { status: nextStatus };

      if (action === "submit") updateData.submittedAt = now;
      if (action === "approve") {
        updateData.approvedAt = now;
        updateData.approvedByUserId = context.userId;
      }

      // Compare-and-set prevents a stale request from overwriting a concurrent transition.
      const updated = await tx.budgetRevision.updateMany({
        where: { id: revision.id, projectId, status: revision.status },
        data: updateData,
      });
      if (updated.count !== 1) throw new Error("REVISION_CONCURRENT_UPDATE");

      // Only one revision can be the active approved budget for a project.
      if (action === "approve") {
        await tx.budgetRevision.updateMany({
          where: { projectId, status: "APPROVED", id: { not: revision.id } },
          data: { status: "SUPERSEDED" },
        });
      }

      const auditAction = {
        submit: "BUDGET_REVISION_SUBMITTED",
        approve: "BUDGET_REVISION_APPROVED",
        reject: "BUDGET_REVISION_REJECTED",
      }[action];

      await tx.auditLog.create({
        data: {
          companyId: context.companyId,
          userId: context.userId,
          action: auditAction,
          entityType: "BudgetRevision",
          entityId: revision.id,
          beforeData: { projectId, revisionNumber: revision.revisionNumber, status: revision.status },
          afterData: {
            projectId,
            revisionNumber: revision.revisionNumber,
            status: nextStatus,
            sellingPrice: Number(revision.sellingPrice),
            note: parsed.data.note ?? null,
          },
        },
      });

      return {
        id: revision.id,
        revisionNumber: revision.revisionNumber,
        previousStatus: revision.status,
        status: nextStatus,
      };
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PROJECT_NOT_FOUND") {
        return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });
      }
      if (error.message === "REVISION_NOT_FOUND") {
        return NextResponse.json({ error: "Revisão não encontrada nesta obra." }, { status: 404 });
      }
      if (error.message === "INVALID_REVISION_TRANSITION") {
        return NextResponse.json({ error: "Esta transição não é permitida. Consulte o estado actual da revisão." }, { status: 409 });
      }
      if (error.message === "REVISION_CONCURRENT_UPDATE") {
        return NextResponse.json({ error: "A revisão foi alterada por outro pedido. Actualize a página e tente novamente." }, { status: 409 });
      }
    }
    console.error("Budget revision transition failed", error);
    return NextResponse.json({ error: "Não foi possível actualizar o estado da revisão." }, { status: 500 });
  }
}
