"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import "./medicoes.css";

type BudgetItem = {
  id: string; code: string; name: string; unit: string | null;
  budgetQuantity: number; unitCost: number; executedQuantity: number;
  remainingQuantity: number; executedValue: number; remainingValue: number;
};
type Measurement = {
  id: string; measuredOn: string; quantity: string | number;
  unitPriceAtMeasurement: string | number; amount: string | number;
  status: string; notes: string | null;
  workItem: { id: string; code: string; name: string; unit: string | null; quantity: string | number };
};
type Payload = { project: { id: string; name: string; currency: string }; items: BudgetItem[]; measurements: Measurement[] };

export default function MedicoesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [data, setData] = useState<Payload | null>(null);
  const [workItemId, setWorkItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [measuredOn, setMeasuredOn] = useState(new Date().toISOString().slice(0, 10));
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const fmt = useCallback((value: number) => new Intl.NumberFormat("pt-MZ", {
    style: "currency", currency: data?.project.currency || "MZN", maximumFractionDigits: 2,
  }).format(value), [data?.project.currency]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/projects/" + encodeURIComponent(projectId) + "/measurements", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível carregar as medições.");
      setData(result.data);
      setWorkItemId((current) => current || result.data.items[0]?.id || "");
      setIsError(false);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Erro ao carregar as medições.");
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { void load(); }, [load]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setMessage(""); setIsError(false);
    try {
      const payload: Record<string, unknown> = {
        workItemId, quantity: Number(quantity), measuredOn: new Date(measuredOn + "T12:00:00.000Z").toISOString(),
        notes,
      };
      if (periodStart) payload.periodStart = new Date(periodStart + "T12:00:00.000Z").toISOString();
      if (periodEnd) payload.periodEnd = new Date(periodEnd + "T12:00:00.000Z").toISOString();
      const response = await fetch("/api/projects/" + encodeURIComponent(projectId) + "/measurements", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível guardar a medição.");
      setMessage("Medição registada como rascunho. Só medições aprovadas entram no total executado.");
      setQuantity(""); setNotes("");
      await load();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Erro ao registar medição.");
    } finally { setSaving(false); }
  }

  const approved = data?.measurements.filter((m) => m.status === "APPROVED").length ?? 0;
  const drafts = data?.measurements.filter((m) => m.status === "DRAFT").length ?? 0;

  return <main className="measure-shell">
    <header className="measure-topbar">
      <Link href="/" className="measure-brand"><span className="measure-logo">O</span><span><strong>ObraCerta</strong><small>GESTÃO DE OBRAS</small></span></Link>
      <Link href={"/obras/" + projectId} className="measure-back">← Voltar à obra</Link>
    </header>
    {loading ? <p className="measure-state">A carregar medições…</p> : !data ? <section className="measure-alert error">{message}</section> : <>
      <section className="measure-heading"><span>EXECUÇÃO · CONTROLO FÍSICO</span><h1>{data.project.name}</h1><p>Registe quantidades executadas e compare-as com o orçamento. As novas medições ficam em rascunho até existir um fluxo de aprovação.</p></section>
      {message && <p className={"measure-alert" + (isError ? " error" : "")} role="status">{message}</p>}
      <section className="measure-stats">
        <div><span>Serviços orçamentados</span><strong>{data.items.length}</strong></div>
        <div><span>Medições aprovadas</span><strong>{approved}</strong></div>
        <div><span>Rascunhos por rever</span><strong>{drafts}</strong></div>
        <div><span>Quantidade executada aprovada</span><strong>{data.items.reduce((sum, item) => sum + item.executedQuantity, 0).toLocaleString("pt-MZ", { maximumFractionDigits: 3 })}</strong></div>
      </section>
      <section className="measure-card">
        <header><h2>Registar medição</h2><p>O valor é calculado pelo custo unitário da composição mais recente no momento do registo.</p></header>
        {data.items.length === 0 ? <p className="measure-empty">Crie serviços finais na EAP e complete as respectivas composições antes de registar medições.</p> : <form className="measure-form" onSubmit={submit}>
          <label>Serviço<select required value={workItemId} onChange={(e) => setWorkItemId(e.target.value)}>{data.items.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></label>
          <label>Quantidade executada<input type="number" required min="0.0001" step="0.0001" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Ex.: 12.5" /></label>
          <label>Data da medição<input type="date" required value={measuredOn} onChange={(e) => setMeasuredOn(e.target.value)} /></label>
          <label>Início do período (opcional)<input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} /></label>
          <label>Fim do período (opcional)<input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} min={periodStart || undefined} /></label>
          <label className="measure-wide">Notas<textarea rows={2} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Local, frente de trabalho, referência do auto…" /></label>
          <div className="measure-wide"><button className="measure-primary" disabled={saving || !workItemId}>{saving ? "A guardar…" : "Guardar medição em rascunho"}</button></div>
        </form>}
      </section>
      <section className="measure-card">
        <header><h2>Orçamento versus execução aprovada</h2><p>Apenas medições com estado aprovado são contabilizadas como execução confirmada.</p></header>
        <div className="measure-table-wrap"><table><thead><tr><th>Código / serviço</th><th>Un.</th><th>Quantidade orçamentada</th><th>Executada aprovada</th><th>Por executar</th><th>Valor executado</th></tr></thead><tbody>
          {data.items.map((item) => <tr key={item.id}><td><strong>{item.code}</strong><small>{item.name}</small></td><td>{item.unit || "—"}</td><td>{item.budgetQuantity.toLocaleString("pt-MZ")}</td><td>{item.executedQuantity.toLocaleString("pt-MZ")}</td><td className={item.remainingQuantity < 0 ? "measure-over" : ""}>{item.remainingQuantity.toLocaleString("pt-MZ")}</td><td>{fmt(item.executedValue)}</td></tr>)}
          {!data.items.length && <tr><td colSpan={6}>Sem serviços orçamentados.</td></tr>}
        </tbody></table></div>
      </section>
      <section className="measure-card">
        <header><h2>Histórico de medições</h2><p>Os registos mantêm o preço unitário usado na data da medição.</p></header>
        {data.measurements.length === 0 ? <p className="measure-empty">Ainda não existem medições.</p> : <div className="measure-history">{data.measurements.map((m) => <article key={m.id}><div><strong>{m.workItem.code} — {m.workItem.name}</strong><small>{new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(m.measuredOn))} · {m.status === "DRAFT" ? "Rascunho" : m.status === "APPROVED" ? "Aprovada" : m.status}</small>{m.notes && <p>{m.notes}</p>}</div><div className="measure-value"><strong>{Number(m.quantity).toLocaleString("pt-MZ")} {m.workItem.unit || ""}</strong><span>{fmt(Number(m.amount))}</span></div></article>)}</div>}
      </section>
      <p className="measure-footnote">Limitação desta versão: a criação de medições está disponível, mas aprovação, edição e anulação com fluxo auditável serão implementadas numa etapa seguinte.</p>
    </>}
  </main>;
}
