"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import "./obras.css";

type Project = {
  id: string;
  code: string;
  name: string;
  clientName: string | null;
  location: string | null;
  currency: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  _count?: { items: number; revisions: number };
};

const statuses: Record<string, string> = {
  DRAFT: "Rascunho",
  BUDGETING: "Em orçamentação",
  APPROVED: "Aprovada",
  IN_PROGRESS: "Em execução",
  ON_HOLD: "Suspensa",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

const dateLabel = (value: string | null) =>
  value ? new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)) : "—";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadProjects = useCallback(async (search = "") => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects?limit=100${search.trim() ? `&q=${encodeURIComponent(search.trim())}` : ""}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível carregar as obras.");
      setProjects(result.data);
      setError(false);
      setMessage("");
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Erro ao carregar as obras.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadProjects(); }, [loadProjects]);

  async function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code, name, clientName, location, currency: "MZN",
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível criar a obra.");
      setCode(""); setName(""); setClientName(""); setLocation(""); setStartDate(""); setEndDate("");
      setShowForm(false);
      setMessage("Obra criada com sucesso.");
      await loadProjects(query);
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Erro ao criar a obra.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="projects-workspace">
      <header className="projects-topbar">
        <Link href="/" className="projects-brand"><span className="projects-brand-mark">O</span><span><strong>ObraCerta</strong><small>GESTÃO DE OBRAS</small></span></Link>
        <Link href="/" className="projects-back">← Painel principal</Link>
      </header>
      <section className="projects-heading">
        <div><span className="projects-kicker">MÓDULO 01 · PLANEAMENTO</span><h1>Obras e projectos</h1><p>Crie e organize os projectos da sua empresa. Os dados são isolados por empresa e guardados na base de dados.</p></div>
        <button type="button" className="projects-primary" onClick={() => { setShowForm(v => !v); setMessage(""); }}>＋ Nova obra</button>
      </section>

      {message && <p className={error ? "projects-alert error" : "projects-alert"} role="status">{message}{error && message.includes("Sessão") ? <> <Link href="/acesso">Iniciar sessão</Link></> : null}</p>}

      {showForm && <section className="projects-form-card">
        <div className="projects-card-heading"><div><h2>Registar obra</h2><p>Preencha os dados principais. A moeda inicial é o metical (MZN).</p></div><button type="button" className="projects-close" onClick={() => setShowForm(false)} aria-label="Fechar formulário">×</button></div>
        <form className="projects-form" onSubmit={submitProject}>
          <label>Código da obra<input required maxLength={40} value={code} onChange={e => setCode(e.target.value)} placeholder="Ex.: OB-2026-001" /></label>
          <label>Nome da obra<input required minLength={3} maxLength={160} value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Construção de edifício administrativo" /></label>
          <label>Cliente<input maxLength={160} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome do cliente" /></label>
          <label>Localização<input maxLength={160} value={location} onChange={e => setLocation(e.target.value)} placeholder="Distrito, cidade ou província" /></label>
          <label>Data de início<input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
          <label>Data prevista de conclusão<input type="date" min={startDate || undefined} value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
          <div className="projects-form-actions"><button type="button" className="projects-secondary" onClick={() => setShowForm(false)}>Cancelar</button><button type="submit" className="projects-primary" disabled={busy}>{busy ? "A guardar…" : "Guardar obra"}</button></div>
        </form>
      </section>}

      <section className="projects-list-card">
        <div className="projects-list-heading"><div><h2>Portefólio de obras</h2><p>{projects.length} {projects.length === 1 ? "obra registada" : "obras registadas"}</p></div><form className="projects-search" onSubmit={e => { e.preventDefault(); void loadProjects(query); }}><input aria-label="Pesquisar obras" value={query} onChange={e => setQuery(e.target.value)} placeholder="Pesquisar código, obra ou cliente" /><button type="submit">Pesquisar</button></form></div>
        {loading ? <div className="projects-empty">A carregar obras…</div> : projects.length === 0 ? <div className="projects-empty"><span className="projects-empty-icon">▤</span><strong>{error ? "Não foi possível carregar os dados" : "Ainda não existem obras"}</strong><p>{error ? "Verifique a sessão e a ligação ao servidor." : "Registe a primeira obra para começar a preparar o orçamento."}</p>{!error && <button type="button" className="projects-primary" onClick={() => setShowForm(true)}>Criar primeira obra</button>}</div> :
          <div className="projects-table-wrap"><table className="projects-table"><thead><tr><th>Obra</th><th>Cliente / localização</th><th>Estado</th><th>Início</th><th>Itens EAP</th></tr></thead><tbody>{projects.map(project => <tr key={project.id}><td><strong>{project.name}</strong><small>{project.code}</small></td><td>{project.clientName || "Sem cliente"}<small>{project.location || "Localização não indicada"}</small></td><td><span className={`projects-status status-${project.status.toLowerCase()}`}>{statuses[project.status] || project.status}</span></td><td>{dateLabel(project.startDate)}</td><td>{project._count?.items ?? 0}</td></tr>)}</tbody></table></div>}
      </section>
      <p className="projects-footnote">Valores em MZN por omissão · Os preços de recursos são definidos pela sua empresa · A criação e actualização de obras são registadas para auditoria.</p>
    </main>
  );
}
