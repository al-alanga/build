"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Account = {
  user: { id: string; name: string; email: string };
  company: { id: string; name: string; baseCurrency: string };
  role: "OWNER" | "ADMIN" | "BUDGET_MANAGER" | "ENGINEER" | "FINANCE" | "VIEWER";
};

const roleLabels: Record<Account["role"], string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  BUDGET_MANAGER: "Gestor de orçamento",
  ENGINEER: "Engenharia",
  FINANCE: "Finanças",
  VIEWER: "Consulta",
};

export default function AccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        setAccount(null);
        setError(true);
        setMessage(response.status === 401
          ? "Não tem uma sessão activa. Inicie sessão para consultar os dados da sua conta."
          : result.error || "Não foi possível carregar a conta.");
        return;
      }
      setAccount(result);
      setError(false);
      setMessage("");
    } catch {
      setError(true);
      setMessage("Não foi possível contactar o servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAccount(); }, [loadAccount]);

  async function logout() {
    setBusy(true);
    setError(false);
    setMessage("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível terminar a sessão.");
      window.location.assign("/acesso");
    } catch (e) {
      setError(true);
      setMessage(e instanceof Error ? e.message : "Não foi possível terminar a sessão.");
      setBusy(false);
    }
  }

  return (
    <main className="account-shell">
      <header className="account-topbar">
        <Link className="account-brand" href="/"><span className="account-brand-mark">O</span><span><strong>ObraCerta</strong><small>GESTÃO DE OBRAS</small></span></Link>
        <nav aria-label="Navegação da conta"><Link href="/">Painel principal</Link><Link href="/usuarios">Utilizadores</Link></nav>
      </header>
      <section className="account-heading">
        <span className="account-kicker">PERFIL E SEGURANÇA</span>
        <h1>Conta e sessão</h1>
        <p>Consulte os dados da conta activa e termine a sessão neste dispositivo.</p>
      </section>
      {message && <div className={error ? "account-message account-error" : "account-message"} role="status">{message}{!account && <div className="account-message-actions"><Link href="/acesso">Iniciar sessão / criar conta</Link>{error && <button type="button" onClick={() => void loadAccount()}>Tentar novamente</button>}</div>}</div>}
      {loading ? <section className="account-card account-loading">A verificar a sessão…</section> : account ? <>
        <section className="account-profile-card">
          <div className="account-avatar" aria-hidden="true">{account.user.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("")}</div>
          <div className="account-profile-main"><span className="account-status"><i /> Sessão activa</span><h2>{account.user.name}</h2><p>{account.user.email}</p></div>
          <span className="account-role">{roleLabels[account.role] || account.role}</span>
        </section>
        <section className="account-details-grid">
          <article className="account-card"><span className="account-detail-label">UTILIZADOR</span><h3>Dados pessoais</h3><dl><div><dt>Nome</dt><dd>{account.user.name}</dd></div><div><dt>Email</dt><dd>{account.user.email}</dd></div><div><dt>Identificador</dt><dd className="account-id">{account.user.id}</dd></div></dl><p className="account-muted">A edição do perfil e a alteração de palavra-passe serão acrescentadas numa etapa seguinte.</p></article>
          <article className="account-card"><span className="account-detail-label">ESPAÇO DE TRABALHO</span><h3>Empresa associada</h3><dl><div><dt>Empresa</dt><dd>{account.company.name}</dd></div><div><dt>Moeda base</dt><dd>{account.company.baseCurrency}</dd></div><div><dt>Perfil de acesso</dt><dd>{roleLabels[account.role] || account.role}</dd></div></dl><Link className="account-secondary-link" href="/usuarios">Consultar gestão de utilizadores →</Link></article>
        </section>
        <section className="account-session-card"><div><span className="account-detail-label">SESSÃO ACTUAL</span><h3>Terminar sessão</h3><p>Fecha a sessão neste navegador. Para voltar a trabalhar, será necessário iniciar sessão novamente.</p></div><button type="button" className="account-logout" onClick={() => void logout()} disabled={busy}>{busy ? "A terminar…" : "Terminar sessão"}</button></section>
      </> : !message && <section className="account-card account-loading">Não foi possível obter os dados da conta.</section>}
      <footer className="account-footer">ObraCerta · Gestão de obras · Moçambique · MZN</footer>
      <style jsx>{`
        .account-shell{min-height:100vh;background:#f5f7fb;color:#172033;padding:0 5vw 36px;font-family:Arial,Helvetica,sans-serif}
        .account-topbar{height:82px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e7ef;gap:20px}
        .account-brand{display:flex;align-items:center;gap:11px;color:inherit;text-decoration:none}.account-brand-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#183c35;color:white;font-size:22px;font-weight:800}.account-brand strong,.account-brand small{display:block}.account-brand strong{font-size:17px}.account-brand small{font-size:9px;letter-spacing:1.6px;color:#6d7788;margin-top:4px}
        .account-topbar nav{display:flex;gap:22px}.account-topbar nav a,.account-secondary-link{color:#315d52;text-decoration:none;font-weight:700;font-size:13px}
        .account-heading{padding:44px 0 25px}.account-kicker,.account-detail-label{font-size:10px;letter-spacing:1.6px;font-weight:800;color:#537a6e}.account-heading h1{font-size:clamp(28px,4vw,40px);letter-spacing:-1.3px;margin:10px 0}.account-heading p{color:#687386;margin:0;line-height:1.6}
        .account-message{background:#e8f4ef;border:1px solid #cce4d9;color:#285947;padding:15px 18px;border-radius:12px;margin-bottom:20px;font-size:14px}.account-error{background:#fff0ee;border-color:#f0d1cb;color:#963c31}.account-message-actions{display:flex;gap:16px;margin-top:10px;align-items:center}.account-message a{color:inherit;font-weight:700}.account-message button{background:transparent;border:0;text-decoration:underline;color:inherit;cursor:pointer}
        .account-profile-card,.account-card,.account-session-card{background:#fff;border:1px solid #e3e8ef;border-radius:16px;box-shadow:0 5px 22px rgba(25,42,66,.035)}
        .account-profile-card{padding:24px;display:flex;align-items:center;gap:18px}.account-avatar{width:62px;height:62px;border-radius:18px;background:#e4eee9;color:#285b4c;display:grid;place-items:center;font-size:22px;font-weight:800;flex-shrink:0}.account-profile-main{flex:1;min-width:0}.account-status{display:flex;align-items:center;gap:7px;color:#28704f;font-size:11px;font-weight:700}.account-status i{width:7px;height:7px;border-radius:50%;background:#299764}.account-profile-main h2{font-size:22px;margin:7px 0 4px}.account-profile-main p{color:#687386;font-size:14px;margin:0;overflow-wrap:anywhere}.account-role{background:#eef3f1;color:#315d52;border-radius:30px;padding:9px 13px;font-size:12px;font-weight:800;white-space:nowrap}
        .account-details-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:18px}.account-card{padding:23px}.account-card h3,.account-session-card h3{font-size:18px;margin:9px 0 18px}.account-card dl{margin:0}.account-card dl div{display:flex;justify-content:space-between;gap:18px;padding:12px 0;border-bottom:1px solid #edf0f4}.account-card dt{color:#6b7585;font-size:13px}.account-card dd{margin:0;text-align:right;font-weight:700;font-size:13px;overflow-wrap:anywhere}.account-id{max-width:60%;font-size:11px!important}.account-muted,.account-session-card p{font-size:12px;color:#7a8494;line-height:1.6;margin:17px 0 0}.account-secondary-link{display:inline-block;margin-top:18px}.account-session-card{padding:23px;margin-top:18px;display:flex;align-items:center;justify-content:space-between;gap:20px}.account-session-card h3{margin-bottom:7px}.account-session-card p{margin:0;max-width:620px}.account-logout{border:1px solid #e3c9c5;background:#fff7f6;color:#9d4035;padding:12px 17px;border-radius:9px;font-weight:800;cursor:pointer;white-space:nowrap}.account-logout:disabled{opacity:.6;cursor:wait}.account-loading{padding:24px;color:#6b7585}.account-footer{font-size:11px;color:#8b94a3;margin-top:30px}
        @media(max-width:700px){.account-shell{padding:0 18px 28px}.account-topbar{height:auto;min-height:76px;align-items:flex-start;padding:18px 0;flex-direction:column}.account-topbar nav{gap:16px}.account-heading{padding-top:30px}.account-details-grid{grid-template-columns:1fr}.account-profile-card{align-items:flex-start;flex-wrap:wrap;padding:18px}.account-role{margin-left:80px}.account-session-card{align-items:flex-start;flex-direction:column}.account-logout{width:100%}.account-card{padding:18px}}
      `}</style>
    </main>
  );
}
