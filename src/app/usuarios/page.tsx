"use client";

import Link from "next/link";
import { useState } from "react";
import "./usuarios.css";

export default function UsuariosPage() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="ObraCerta página inicial">
          <span className="brand-mark">O</span>
          <span><strong>ObraCerta</strong><small>GESTÃO DE OBRAS</small></span>
        </Link>
        <div className="workspace-label">ESPAÇO DE TRABALHO</div>
        <nav className="navigation" aria-label="Navegação principal">
          <Link className="nav-item" href="/"><span>▦</span> Visão geral</Link>
          <Link className="nav-item" href="/obras"><span>▤</span> Obras e EAP</Link>
          <Link className="nav-item" href="/recursos"><span>◫</span> Recursos e fornecedores</Link>
          <Link className="nav-item" href="/simulador"><span>∑</span> Simulador de custos</Link>
          <Link className="nav-item active" href="/usuarios"><span>♙</span> Utilizadores</Link>
          <Link className="nav-item" href="/equipa"><span>♧</span> Equipa e permissões</Link>
          <Link className="nav-item" href="/conta"><span>◎</span> Conta e sessão</Link>
          <Link className="nav-item" href="/acesso"><span>↪</span> Entrar / registar</Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="setup-card"><span className="setup-dot" /><strong>Acesso à plataforma</strong><p>Crie uma conta da empresa ou entre com as suas credenciais.</p><Link href="/acesso" className="dashboard-inline-link">Abrir acesso →</Link></div>
          <div className="profile"><div className="avatar">OC</div><div><strong>ObraCerta</strong><small>Gestão de obras · MZN</small></div></div>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><Link href="/">ObraCerta</Link><span>/</span><strong>Utilizadores</strong></div>
          <div className="topbar-right"><Link className="currency-chip" href="/acesso">Aceder / criar conta</Link><span className="currency-chip">MZN · Metical</span></div>
        </header>
        <div className="content users-content">
          <section className="welcome-row">
            <div><p className="eyebrow">ADMINISTRAÇÃO DA CONTA</p><h1>Utilizadores e acessos</h1><p className="welcome-copy">Entre na sua conta ou crie o espaço de trabalho da sua empresa.</p></div>
            <Link className="primary-button" href="/acesso">＋ Criar conta / iniciar sessão</Link>
          </section>

          <section className="users-intro">
            <div className="users-intro-icon">♙</div>
            <div><h2>O seu acesso ao ObraCerta começa aqui</h2><p>Use o módulo de conta para registar o seu nome, email profissional e empresa. No registo, a conta cria o espaço da empresa e atribui o perfil de proprietário (OWNER) ao primeiro utilizador.</p></div>
          </section>

          <section className="users-action-grid">
            <article className="users-card">
              <span className="users-card-icon">＋</span>
              <p className="eyebrow">NOVO UTILIZADOR</p>
              <h2>Criar conta da empresa</h2>
              <p>Registe os dados do responsável e da empresa para iniciar um espaço de trabalho.</p>
              <ul><li>Nome e email profissional</li><li>Nome da empresa e NUIT opcional</li><li>Palavra-passe com pelo menos 12 caracteres</li></ul>
              <Link className="users-action-link" href="/acesso">Criar conta <span>→</span></Link>
            </article>
            <article className="users-card">
              <span className="users-card-icon">↪</span>
              <p className="eyebrow">JÁ TEM CONTA?</p>
              <h2>Iniciar sessão</h2>
              <p>Entre com o email e a palavra-passe usados no registo para continuar a trabalhar.</p>
              <ul><li>Autenticação por email e palavra-passe</li><li>Sessão protegida por cookie</li><li>Acesso associado à empresa do utilizador</li></ul>
              <Link className="users-action-link" href="/acesso">Iniciar sessão <span>→</span></Link>
            </article>
          </section>

          <section className="users-management-note">
            <div><strong>Gestão de equipa e permissões</strong><p>Os perfis de acesso já estão definidos no modelo de dados (proprietário, administrador, orçamento, engenharia, finanças e consulta). O convite de colaboradores, a listagem de utilizadores e a alteração de permissões ainda precisam de ser ligados a operações seguras no servidor.</p></div>
            <button type="button" className="users-details-toggle" onClick={() => setShowDetails(value => !value)} aria-expanded={showDetails}>{showDetails ? "Ocultar perfis" : "Ver perfis previstos"} <span>{showDetails ? "−" : "+"}</span></button>
            {showDetails && <div className="users-roles"><div><strong>Proprietário / Administrador</strong><span>Gestão da empresa e dos acessos</span></div><div><strong>Gestor de orçamento</strong><span>Preparação e revisão de orçamentos</span></div><div><strong>Engenharia</strong><span>Obras, actividades e medições</span></div><div><strong>Finanças</strong><span>Consulta e controlo financeiro</span></div><div><strong>Consulta</strong><span>Acesso de leitura</span></div></div>}
          </section>
          <footer className="footer"><span>ObraCerta · Utilizadores e acessos</span><span>Moçambique · MZN</span></footer>
        </div>
      </section>
    </main>
  );
}
