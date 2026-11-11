import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";
import { hasPermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ projectId: string }> };

function csvCell(value: string | number | null | undefined): string {
  let text = value == null ? "" : String(value);
  // Prevent spreadsheet formula injection when opening exported values in Excel.
  if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedContext();
  if (!context) {
    return NextResponse.json({ error: "Sessão não autenticada." }, { status: 401 });
  }
  if (!hasPermission(context.role, "budget:read")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { projectId } = await params;
  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId: context.companyId },
    select: { id: true, name: true, code: true, currency: true, clientName: true, location: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });
  }

  const items = await prisma.workItem.findMany({
    where: { projectId },
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    include: {
      children: { select: { id: true } },
      compositions: {
        orderBy: { version: "desc" },
        take: 1,
        include: {
          lines: {
            select: {
              coefficient: true,
              unitPriceAtSave: true,
              resource: { select: { code: true, name: true, unit: true } },
            },
          },
        },
      },
    },
  });

  const leaves = items.filter((item) => item.children.length === 0);
  const rows = leaves.map((item) => {
    const composition = item.compositions[0];
    const unitCost = composition?.lines.reduce(
      (sum, line) => sum + Number(line.coefficient) * Number(line.unitPriceAtSave),
      0,
    ) ?? 0;
    const quantity = Number(item.quantity);
    return {
      code: item.code,
      name: item.name,
      unit: item.unit ?? "",
      quantity,
      compositionVersion: composition?.version ?? "",
      unitCost,
      directTotal: quantity * unitCost,
      hasComposition: Boolean(composition?.lines.length),
      lines: composition?.lines ?? [],
    };
  });

  const directCost = rows.reduce((sum, row) => sum + row.directTotal, 0);
  const records: (string | number | null)[][] = [
    ["OBRACERTA — MAPA DE ORÇAMENTO"],
    ["Obra", project.name],
    ["Código", project.code],
    ["Cliente", project.clientName],
    ["Localização", project.location],
    ["Moeda", project.currency],
    ["Exportado em", new Date().toISOString()],
    [],
    ["Código do serviço", "Descrição", "Unidade", "Quantidade", "Versão da composição", "Custo unitário", "Custo directo total", "Estado da composição"],
  ];

  for (const row of rows) {
    records.push([
      row.code,
      row.name,
      row.unit,
      row.quantity,
      row.compositionVersion,
      row.unitCost,
      row.directTotal,
      row.hasComposition ? "Composição disponível" : "SEM COMPOSIÇÃO — rever",
    ]);
    for (const line of row.lines) {
      records.push([
        "",
        "  Recurso: " + line.resource.name,
        line.resource.unit,
        Number(line.coefficient),
        "",
        Number(line.unitPriceAtSave),
        Number(line.coefficient) * Number(line.unitPriceAtSave),
        "Código do recurso: " + line.resource.code,
      ]);
    }
  }

  records.push([], ["TOTAL DOS CUSTOS DIRECTOS", "", "", "", "", "", directCost]);
  const csv = "\uFEFF" + records.map((record) => record.map(csvCell).join(";")).join("\r\n");
  const safeCode = project.code.replace(/[^a-zA-Z0-9_-]/g, "_") || "obra";
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="orcamento-' + safeCode + '.csv"',
      "Cache-Control": "no-store",
    },
  });
}
