"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import "./detalhe.css";

type Project = {
  id: string; code: string; name: string; clientName: string | null;
  location: string | null; currency: string; status: string;
  startDate: string | null; endDate: string | null;
};
type WorkItem = {
  id: string; projectId: string; parentId: string | null; code: string; name: string;
  description: string | null; unit: string | null; quantity: string | number; sortOrder: number;
};
const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho", BUDGETING: "Em orçamentação", APPROVED: "Aprovada",
  IN_PROGRESS: "Em execução", ON_HOLD: "Suspensa", COMPLETED: "Concluída", CANCELLED: "Cancelada",
};
const fmtDate = (v: string | null) => v ? new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(v)) : "—";

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("un");
  const [quantity, setQuantity] = useState("0");
  const [parentId, setParentId] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ code: "", name: "", description: "", unit: "", quantity: "0" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [projectResponse, itemsResponse] = await Promise.all([
        fetch(`/api/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" }),
        fetch(`/api/projects/${encodeURIComponent(projectId)}/items`, { cache: "no-store" }),
      ]);
      const [projectResult, itemsResult] = await Promise.all([projectResponse.json(), itemsResponse.json()]);
      if (!projectResponse.ok) throw new Error(projectResult.error || "Não foi possível carregar a obra.");
      if (!itemsResponse.ok) throw new Error(itemsResult.error || "Não foi possível carregar a EAP.");
      setProject(projectResult.data);
      setItems(itemsResult.data);
      setIsError(false);
      setMessage("");
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : "Erro ao carregar os dados da obra.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { void load(); }, [load]);

  const orderedItems = useMemo(() => {
    const children = new Map<string | null, WorkItem[]>();
    for (const item of items) {
      const key = item.parentId ?? null;
      children.set(key, [...(children.get(key) ?? []), item]);
    }
    const output: Array<{ item: WorkItem; depth: number }> = [];
    const visited = new Set<string>();
    const walk = (parent: string | null, depth: number) => {
      for (const item of children.get(parent) ?? []) {
        if (visited.has(item.id)) continue;
        visited.add(item.id);
        output.push({ item, depth });
        walk(item.id, depth + 1);
      }
    };
    walk(null, 0);
    for (const item of items) if (!visited.has(item.id)) output.push({ item, depth: 0 });
    return output;
  }, [items]);

  function startEditing(item: WorkItem) {
    setEditingItemId(item.id);
    setEditValues({ code: item.code, name: item.name, description: item.description || "", unit: item.unit || "", quantity: String(item.quantity) });
    setMessage("");
    setIsError(false);
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingItemId) return;
    setSaving(true); setMessage(""); setIsError(false);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(editingItemId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editValues.code.trim(),
          name: editValues.name.trim(),
          description: editValues.description.trim() || null,
          unit: editValues.unit.trim() || null,
          quantity: Number(editValues.quantity),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível actualizar o item.");
      setEditingItemId(null);
      setMessage("Item da EAP actualizado e registado no histórico de auditoria.");
      await load();
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : "Erro ao actualizar o item.");
    } finally {
      setSaving(false);
    }
  }

  async function submitItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage(""); setIsError(false);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(), name: name.trim(), description: description.trim() || undefined,
          unit: unit.trim() || undefined, quantity: Number(quantity), parentId: parentId || undefined,
          sortOrder: items.length,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível guardar o item.");
      setCode(""); setName(""); setDescription(""); setUnit("un"); setQuantity("0"); setParentId("");
      setShowForm(false); setMessage("Item da EAP registado com sucesso.");
      await load();
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : "Erro ao registar o item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="detail-workspace">
      <header className="detail-topbar">
        <Link href="/" className="detail-brand"><span className="detail-brand-mark">O</span><span><strong>ObraCerta</strong><small>GESTÃO DE OBRAS</small></span></Link>
        <Link href="/obras" className="detail-back">← Todas as obras</Link>
      </header>
      {loading ? <section className="detail-loading">A carregar dados da obra…</section> : !project ? (
        <section className="detail-error"><h1>Não foi possível abrir a obra</h1><p>{message || "A obra não existe ou não tem acesso a ela."}</p><Link href="/obras">Voltar à lista de obras</Link></section>
      ) : <>
        <section className="detail-heading">
          <div><span className="detail-kicker">OBRA {project.code}</span><h1>{project.name}</h1><p>{project.clientName || "Cliente não indicado"} · {project.location || "Localização não indicada"}</p></div>
          <span className={`detail-status detail-status-${project.status.toLowerCase()}`}>{statusLabels[project.status] || project.status}</span>
        </section>
        {message && <p className={isError ? "detail-alert error" : "detail-alert"} role="status">{message}{isError && message.includes("Sessão") ? <> <Link href="/acesso">Iniciar sessão</Link></> : null}</p>}
        <div className="detail-budget-action"><Link href={`/obras/${projectId}/orcamento`}>Abrir mapa financeiro do orçamento →</Link><Link href={`/obras/${projectId}/medicoes`}>Controlar medições de execução →</Link></div>
        <section className="detail-stats">
          <div><span>Itens da EAP</span><strong>{items.length}</strong></div>
          <div><span>Moeda do orçamento</span><strong>{project.currency}</strong></div>
          <div><span>Início previsto</span><strong>{fmtDate(project.startDate)}</strong></div>
          <div><span>Conclusão prevista</span><strong>{fmtDate(project.endDate)}</strong></div>
        </section>
        <section className="detail-card">
          <div className="detail-card-heading"><div><h2>Estrutura Analítica do Projecto (EAP)</h2><p>Organize capítulos, actividades e serviços por níveis hierárquicos.</p></div><button type="button" className="detail-primary" onClick={() => setShowForm(v => !v)}>＋ Adicionar item</button></div>
          {showForm && <form className="detail-form" onSubmit={submitItem}>
            <label>Código<input required maxLength={40} value={code} onChange={e => setCode(e.target.value)} placeholder="Ex.: 01.01" /></label>
            <label>Nome do capítulo/serviço<input required minLength={2} maxLength={200} value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Escavação de fundações" /></label>
            <label>Item superior<select value={parentId} onChange={e => setParentId(e.target.value)}><option value="">Sem item superior (nível principal)</option>{orderedItems.map(({item,depth}) => <option key={item.id} value={item.id}>{ "— ".repeat(depth) }{item.code} · {item.name}</option>)}</select></label>
            <label>Unidade<input maxLength={24} value={unit} onChange={e => setUnit(e.target.value)} placeholder="m³, m², kg, h, un…" /></label>
            <label>Quantidade<input type="number" min="0" step="0.0001" required value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
            <label className="detail-wide">Descrição<textarea maxLength={2000} rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Especificações e notas técnicas do serviço" /></label>
            <div className="detail-form-actions"><button type="button" className="detail-secondary" onClick={() => setShowForm(false)}>Cancelar</button><button type="submit" className="detail-primary" disabled={saving}>{saving ? "A guardar…" : "Guardar item"}</button></div>
          </form>}
          {orderedItems.length === 0 ? <div className="detail-empty"><span>▤</span><strong>A EAP ainda está vazia</strong><p>Adicione o primeiro capítulo ou serviço para começar a estruturar o orçamento.</p>{!showForm && <button type="button" className="detail-secondary" onClick={() => setShowForm(true)}>Adicionar primeiro item</button>}</div> :
            <div className="detail-table-wrap"><table className="detail-table"><thead><tr><th>Código</th><th>Capítulo / serviço</th><th>Unidade</th><th>Quantidade</th><th>Acções</th></tr></thead><tbody>{orderedItems.map(({item,depth}) => <tr key={item.id}><td>{item.code}</td><td><div className="detail-item-name" style={{paddingLeft:Math.min(depth,8)*20}}><Link className="detail-composition-link" href={`/obras/${projectId}/itens/${item.id}/composicao`}><strong>{item.name}</strong></Link>{item.description && <small>{item.description}</small>}<Link className="detail-open-composition" href={`/obras/${projectId}/itens/${item.id}/composicao`}>Composição de custos →</Link></div>{editingItemId === item.id && <form className="detail-form" onSubmit={saveItem}>
              <label>Código<input required maxLength={40} value={editValues.code} onChange={e => setEditValues(v => ({...v, code:e.target.value}))} /></label>
              <label>Nome<input required minLength={2} maxLength={200} value={editValues.name} onChange={e => setEditValues(v => ({...v, name:e.target.value}))} /></label>
              <label>Unidade<input maxLength={24} value={editValues.unit} onChange={e => setEditValues(v => ({...v, unit:e.target.value}))} placeholder="m³, m², kg, h, un…" /></label>
              <label>Quantidade<input type="number" min="0" step="0.0001" required value={editValues.quantity} onChange={e => setEditValues(v => ({...v, quantity:e.target.value}))} /></label>
              <label className="detail-wide">Descrição<textarea rows={2} maxLength={2000} value={editValues.description} onChange={e => setEditValues(v => ({...v, description:e.target.value}))} /></label>
              <div className="detail-form-actions"><button type="button" className="detail-secondary" onClick={() => setEditingItemId(null)}>Cancelar</button><button type="submit" className="detail-primary" disabled={saving}>{saving ? "A guardar…" : "Guardar alterações"}</button></div>
            </form>}</td><td>{item.unit || "—"}</td><td>{Number(item.quantity).toLocaleString("pt-MZ",{maximumFractionDigits:4})}</td><td><button type="button" className="detail-secondary" onClick={() => editingItemId === item.id ? setEditingItemId(null) : startEditing(item)}>{editingItemId === item.id ? "Fechar edição" : "Editar"}</button></td></tr>)}</tbody></table></div>}
        </section>
        <p className="detail-note">As alterações são guardadas na base de dados e registadas para auditoria. Os custos unitários e o mapa financeiro serão ligados numa etapa seguinte.</p>
      </>}
    </main>
  );
}
