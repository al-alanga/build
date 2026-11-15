"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Role = "OWNER" | "ADMIN" | "BUDGET_MANAGER" | "ENGINEER" | "FINANCE" | "VIEWER";
type Member = { id: string; name: string; email: string; role: Role; joinedAt: string };
const roles: { value: Exclude<Role, "OWNER" | "ADMIN">; label: string; description: string }[] = [
  { value: "BUDGET_MANAGER", label: "Gestor de orçamento", description: "Obras, recursos e preparação de orçamentos." },
  { value: "ENGINEER", label: "Engenharia", description: "Obras e consulta de custos e recursos." },
  { value: "FINANCE", label: "Finanças", description: "Consulta de obras e gestão de orçamento." },
  { value: "VIEWER", label: "Consulta", description: "Acesso de leitura aos módulos permitidos." },
];
const roleLabel: Record<Role, string> = { OWNER: "Proprietário", ADMIN: "Administrador", BUDGET_MANAGER: "Gestor de orçamento", ENGINEER: "Engenharia", FINANCE: "Finanças", VIEWER: "Consulta" };

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentRole, setCurrentRole] = useState<Role | "">("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<Role, "OWNER" | "ADMIN">>("VIEWER");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("");

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/company/members", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível carregar a equipa.");
      setMembers(result.data);
      setCurrentUserId(result.currentUserId);
      setCurrentRole(result.currentRole);
      setError(false);
      setMessage("");
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Erro ao carregar a equipa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadMembers(); }, [loadMembers]);

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(""); setError(false);
    try {
      const response = await fetch("/api/company/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível associar o utilizador.");
      setEmail(""); setRole("VIEWER");
      setMessage("Utilizador associado à empresa com sucesso.");
      await loadMembers();
    } catch (e) {
      setError(true); setMessage(e instanceof Error ? e.message : "Erro ao associar utilizador.");
    } finally { setBusy(false); }
  }

  async function changeRole(member: Member, nextRole: string) {
    if (nextRole === member.role) return;
    setBusy(true); setMessage(""); setError(false);
    try {
      const response = await fetch("/api/company/members", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: member.id, role: nextRole }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível alterar o perfil.");
      setMessage("Perfil de acesso actualizado.");
      await loadMembers();
    } catch (e) {
      setError(true); setMessage(e instanceof Error ? e.message : "Erro ao alterar perfil.");
    } finally { setBusy(false); }
  }

  async function removeMember(member: Member) {
    if (!window.confirm(`Remover ${member.name} da empresa? A conta pessoal não será eliminada.`)) return;
    setBusy(true); setMessage(""); setError(false);
    try {
      const response = await fetch("/api/company/members", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: member.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível remover o utilizador.");
      setMessage("Utilizador removido da empresa.");
      await loadMembers();
    } catch (e) {
      setError(true); setMessage(e instanceof Error ? e.message : "Erro ao remover utilizador.");
    } finally { setBusy(false); }
  }

  const visibleMembers = members.filter((member) => `${member.name} ${member.email} ${roleLabel[member.role]}`.toLowerCase().includes(filter.toLowerCase()));
  const canManage = currentRole === "OWNER" || currentRole === "ADMIN";

  return (
    <main className="team-shell">
      <header className="team-topbar">
        <Link href="/" className="team-brand"><span className="team-brand-mark">O</span><span><strong>ObraCerta</strong><small>GESTÃO DE OBRAS</small></span></Link>
        <nav><Link href="/">Painel principal</Link><Link href="/conta">Conta e sessão</Link><Link href="/usuarios">Utilizadores</Link></nav>
      </header>
      <section className="team-heading"><div><span className="team-kicker">ADMINISTRAÇÃO DA EMPRESA</span><h1>Equipa e permissões</h1><p>Associe contas existentes à empresa e controle o perfil de acesso de cada colaborador.</p></div><span className="team-count">{members.length} {members.length === 1 ? "membro" : "membros"}</span></section>
      {message && <div className={error ? "team-message team-error" : "team-message"} role="status">{message}{error && message.includes("Sessão") && <> <Link href="/acesso">Iniciar sessão</Link></>}</div>}
      {canManage && <section className="team-add-card"><div><span className="team-kicker">ADICIONAR À EQUIPA</span><h2>Associar utilizador</h2><p>O colaborador precisa de criar primeiro uma conta no ObraCerta com este email.</p></div><form onSubmit={addMember}><label>Email da conta<input required type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colaborador@empresa.co.mz" /></label><label>Perfil de acesso<select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>{roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><button disabled={busy} type="submit">{busy ? "A processar…" : "Associar utilizador"}</button></form></section>}
      <section className="team-list-card"><div className="team-list-head"><div><h2>Membros da empresa</h2><p>As alterações de perfil e remoções são registadas no histórico de auditoria.</p></div><input aria-label="Pesquisar membros" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Pesquisar por nome, email ou perfil" /></div>
        {loading ? <div className="team-empty">A carregar equipa…</div> : error && members.length === 0 ? <div className="team-empty"><strong>Não foi possível carregar os membros</strong><button type="button" onClick={() => void loadMembers()}>Tentar novamente</button></div> : visibleMembers.length === 0 ? <div className="team-empty">{members.length ? "Nenhum membro corresponde à pesquisa." : "Ainda não existem membros associados a esta empresa."}</div> :
        <div className="team-table-wrap"><table><thead><tr><th>Utilizador</th><th>Perfil</th><th>Associado em</th><th>Gestão</th></tr></thead><tbody>{visibleMembers.map((member) => <tr key={member.id}><td><div className="team-person"><span>{member.name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}</span><div><strong>{member.name}{member.id === currentUserId ? " (eu)" : ""}</strong><small>{member.email}</small></div></div></td><td><span className={member.role === "OWNER" || member.role === "ADMIN" ? "team-role privileged" : "team-role"}>{roleLabel[member.role]}</span></td><td>{new Intl.DateTimeFormat("pt-MZ", { dateStyle: "medium" }).format(new Date(member.joinedAt))}</td><td>{canManage && member.id !== currentUserId && member.role !== "OWNER" && member.role !== "ADMIN" ? <div className="team-row-actions"><select aria-label={`Perfil de ${member.name}`} disabled={busy} value={member.role} onChange={(e) => void changeRole(member, e.target.value)}>{roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><button className="team-remove" disabled={busy} onClick={() => void removeMember(member)} type="button">Remover</button></div> : <span className="team-protected">{member.id === currentUserId ? "Conta actual" : "Protegido"}</span>}</td></tr>)}</tbody></table></div>}
      </section>
      <section className="team-security-note"><strong>Regras de segurança</strong><p>Esta página só permite gerir membros a proprietários e administradores. Não permite alterar o próprio perfil, remover o proprietário ou atribuir novos perfis de administrador através do formulário.</p></section>
      <footer className="team-footer">ObraCerta · Gestão de equipa · Moçambique · MZN</footer>
      <style jsx>{`
        .team-shell{min-height:100vh;background:#f5f7fb;color:#172033;padding:0 5vw 36px;font-family:Arial,Helvetica,sans-serif}.team-topbar{min-height:80px;display:flex;align-items:center;justify-content:space-between;gap:22px;border-bottom:1px solid #e2e7ef}.team-brand{display:flex;align-items:center;gap:11px;color:inherit;text-decoration:none}.team-brand-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#183c35;color:white;font-size:22px;font-weight:800}.team-brand strong,.team-brand small{display:block}.team-brand strong{font-size:17px}.team-brand small{font-size:9px;letter-spacing:1.6px;color:#6d7788;margin-top:4px}.team-topbar nav{display:flex;gap:22px;flex-wrap:wrap}.team-topbar nav a{color:#315d52;text-decoration:none;font-size:13px;font-weight:700}.team-heading{padding:42px 0 24px;display:flex;justify-content:space-between;align-items:end;gap:20px}.team-kicker{font-size:10px;letter-spacing:1.6px;font-weight:800;color:#537a6e}.team-heading h1{font-size:clamp(28px,4vw,40px);letter-spacing:-1.3px;margin:10px 0}.team-heading p,.team-add-card p,.team-list-head p{color:#687386;line-height:1.6;font-size:13px;margin:0}.team-count{padding:10px 13px;background:#e8f0ec;border-radius:30px;color:#315d52;font-size:12px;font-weight:800;white-space:nowrap}.team-message{padding:14px 16px;border-radius:11px;background:#e8f4ef;border:1px solid #cce4d9;color:#285947;margin-bottom:18px;font-size:13px}.team-error{background:#fff0ee;border-color:#f0d1cb;color:#963c31}.team-message a{color:inherit;font-weight:800}.team-add-card,.team-list-card,.team-security-note{background:#fff;border:1px solid #e3e8ef;border-radius:16px;box-shadow:0 5px 22px rgba(25,42,66,.035)}.team-add-card{padding:22px 24px;margin-bottom:18px;display:grid;grid-template-columns:.8fr 1.4fr;gap:26px;align-items:start}.team-add-card h2,.team-list-head h2{font-size:18px;margin:9px 0 7px}.team-add-card form{display:grid;grid-template-columns:1.2fr 1fr auto;align-items:end;gap:12px}.team-add-card label{font-size:12px;font-weight:700;display:grid;gap:7px}.team-add-card input,.team-add-card select,.team-list-head input,.team-row-actions select{min-width:0;width:100%;border:1px solid #dce3eb;background:white;border-radius:8px;padding:11px;font-size:12px;color:#172033}.team-add-card button{border:0;background:#1d5143;color:white;padding:12px 15px;border-radius:8px;font-weight:800;font-size:12px;white-space:nowrap;cursor:pointer}.team-add-card button:disabled,.team-row-actions button:disabled{opacity:.55;cursor:wait}.team-list-card{overflow:hidden}.team-list-head{padding:22px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}.team-list-head input{max-width:300px}.team-table-wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;text-align:left}th{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#7b8492;background:#f8fafc;padding:13px 20px}td{padding:15px 20px;border-top:1px solid #edf0f4;font-size:12px;color:#596577;white-space:nowrap}.team-person{display:flex;align-items:center;gap:11px}.team-person>span{width:37px;height:37px;display:grid;place-items:center;background:#e7efeb;color:#315d52;border-radius:11px;font-weight:800}.team-person strong,.team-person small{display:block}.team-person strong{color:#263246;font-size:12px}.team-person small{color:#7b8492;font-size:11px;margin-top:4px}.team-role{display:inline-block;padding:7px 9px;border-radius:20px;background:#eef3f1;color:#315d52;font-weight:800;font-size:10px}.team-role.privileged{background:#e8edf8;color:#425c8a}.team-row-actions{display:flex;gap:8px;align-items:center}.team-row-actions select{width:155px;padding:8px}.team-remove{border:1px solid #ecd7d4;background:#fff7f6;color:#9d4035;border-radius:7px;padding:8px 9px;font-size:11px;font-weight:800;cursor:pointer}.team-protected{font-size:11px;color:#8992a0}.team-empty{padding:34px 24px;text-align:center;color:#7b8492;font-size:13px}.team-empty strong{display:block;margin-bottom:12px}.team-empty button{border:1px solid #dce3eb;background:white;padding:9px 12px;border-radius:8px;cursor:pointer}.team-security-note{margin-top:18px;padding:19px 22px}.team-security-note strong{font-size:13px}.team-security-note p{color:#737e8e;font-size:12px;line-height:1.6;margin:8px 0 0}.team-footer{font-size:11px;color:#8b94a3;margin-top:28px}@media(max-width:950px){.team-add-card{grid-template-columns:1fr}.team-add-card form{grid-template-columns:1fr 1fr}.team-add-card form button{grid-column:1/-1}.team-list-head{align-items:flex-start;flex-direction:column}.team-list-head input{max-width:none;width:100%}}@media(max-width:650px){.team-shell{padding:0 16px 25px}.team-topbar{padding:16px 0;align-items:flex-start;flex-direction:column}.team-heading{align-items:flex-start;flex-direction:column;padding-top:30px}.team-add-card{padding:18px}.team-add-card form{grid-template-columns:1fr}.team-add-card form button{grid-column:auto}.team-list-head{padding:18px}.team-row-actions{align-items:flex-start;flex-direction:column}.team-row-actions select{width:140px}th,td{padding:13px 14px}}
      `}</style>
    </main>
  );
}
