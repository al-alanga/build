import Link from "next/link";

const modules = [
  { number: "01", title: "Obras e EAP", description: "Criar obras, definir cliente e localização, estruturar capítulos, actividades e serviços.", href: "/obras", action: "Abrir gestão de obras", status: "Disponível", icon: "▤" },
  { number: "02", title: "Recursos e fornecedores", description: "Registar materiais, mão de obra, equipamentos, fornecedores e custos de importação/transporte.", href: "/recursos", action: "Abrir recursos", status: "Disponível", icon: "◫" },
  { number: "03", title: "Composições de custos", description: "Associar recursos e coeficientes técnicos a cada serviço para obter o custo unitário.", href: "/obras", action: "Seleccionar uma obra", status: "Dentro da obra", icon: "∑" },
  { number: "04", title: "Mapa financeiro e coeficiente K", description: "Consultar custos directos, simular indirectos, encargos, lucro e impostos configuráveis, guardar revisões.", href: "/obras", action: "Abrir uma obra e o orçamento", status: "Dentro da obra", icon: "▧" },
  { number: "05", title: "Medições de execução", description: "Registar quantidades executadas, consultar histórico e comparar execução aprovada com orçamento.", href: "/obras", action: "Abrir uma obra e as medições", status: "Registo inicial disponível", icon: "✓" },
  { number: "06", title: "Simulador de custos", description: "Experimentar cenários de cálculo sem começar pelo registo de uma obra completa.", href: "/simulador", action: "Abrir simulador", status: "Experimental", icon: "⌁" },
];

const nextSteps = [
  { title: "Aprovação de medições", description: "Submeter, aprovar ou rejeitar medições com permissões e registo de auditoria." },
  { title: "Custos reais e compromissos", description: "Ligar compras, facturas e despesas à obra para calcular desvios face ao orçamento." },
  { title: "Relatórios PDF e Excel avançados", description: "Gerar autos de medição e relatórios técnicos/financeiros formais." },
];

export default function HomePage() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="ObraCerta página inicial">
          <span className="brand-mark">O</span><span><strong>ObraCerta</strong><small>GESTÃO DE OBRAS</small></span>
        </Link>
        <div className="workspace-label">ESPAÇO DE TRABALHO</div>
        <nav className="navigation" aria-label="Navegação principal">
          <Link className="nav-item active" href="/"><span>▦</span> Visão geral</Link>
          <Link className="nav-item" href="/obras"><span>▤</span> Obras e EAP</Link>
          <Link className="nav-item" href="/recursos"><span>◫</span> Recursos e fornecedores</Link>
          <Link className="nav-item" href="/simulador"><span>∑</span> Simulador de custos</Link>
          <Link className="nav-item" href="/acesso"><span>↪</span> Conta e sessão</Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="setup-card"><span className="setup-dot" /><strong>Como começar</strong><p>Crie uma obra. Depois registe a EAP, os recursos, as composições e o orçamento.</p><Link href="/obras" className="dashboard-inline-link">Começar pela primeira obra →</Link></div>
          <div className="profile"><div className="avatar">OC</div><div><strong>ObraCerta</strong><small>Gestão de obras · MZN</small></div><span className="profile-menu">···</span></div>
        </div>
      </aside>

      <section className="main-panel" id="visao-geral">
        <header className="topbar">
          <div className="breadcrumb">ObraCerta <span>/</span> <strong>Visão geral</strong></div>
          <div className="topbar-right"><Link className="currency-chip" href="/acesso">Aceder / criar conta</Link><span className="currency-chip">MZN · Metical</span><span className="user-chip">OC</span></div>
        </header>

        <div className="content dashboard-content">
          <section className="welcome-row">
            <div><p className="eyebrow">PAINEL DE CONTROLO</p><h1>Visão geral do ObraCerta</h1><p className="welcome-copy">Acompanhe os módulos implementados e aceda directamente a cada área do sistema.</p></div>
            <Link className="primary-button" href="/obras">＋ Abrir gestão de obras</Link>
          </section>

          <section className="notice" aria-label="Como navegar no sistema">
            <div className="notice-icon">i</div><div><strong>O painel é o ponto de entrada — os módulos estão nas páginas próprias</strong><p>Para ver os dados e operações de cada obra, entre em “Obras e EAP”, abra uma obra e use os atalhos para composições, mapa financeiro e medições. Os indicadores de actividade global ainda não estão ligados a uma API de resumo; por isso não mostramos números inventados.</p></div>
          </section>

          <section className="dashboard-quicklinks" aria-label="Acessos rápidos">
            <Link href="/obras"><span className="quick-icon">▤</span><span><strong>Obras e EAP</strong><small>Criar e abrir projectos</small></span><span className="quick-arrow">↗</span></Link>
            <Link href="/recursos"><span className="quick-icon">◫</span><span><strong>Recursos</strong><small>Preços e fornecedores</small></span><span className="quick-arrow">↗</span></Link>
            <Link href="/simulador"><span className="quick-icon">∑</span><span><strong>Simulador</strong><small>Testar cenários de custos</small></span><span className="quick-arrow">↗</span></Link>
          </section>

          <section className="section-heading dashboard-section-heading">
            <div><p className="eyebrow">CENTRO DE FUNCIONALIDADES</p><h2>O que já pode acompanhar</h2></div><span className="section-count">6 áreas do produto</span>
          </section>
          <section className="module-grid dashboard-module-grid">
            {modules.map((module) => <article className="module-card dashboard-module-card" key={module.number}>
              <div className="module-top"><span className="module-number">{module.number}</span><span className="module-arrow">{module.icon}</span></div>
              <div className="dashboard-module-status"><span className={module.status === "Disponível" ? "status-dot" : "status-dot status-dot-warn"} />{module.status}</div>
              <h3>{module.title}</h3><p>{module.description}</p>
              <Link className="dashboard-module-link" href={module.href}>{module.action} <span>→</span></Link>
            </article>)}
          </section>

          <section className="bottom-grid dashboard-bottom-grid">
            <article className="panel-card">
              <div className="panel-title"><div><h2>Fluxo recomendado para uma obra</h2><p>Siga esta sequência para obter um orçamento útil</p></div><span className="subtle-icon">☷</span></div>
              <ol className="task-list">
                <li><span className="task-check done">1</span><div><strong>Criar a obra</strong><small>Cliente, localização, datas e moeda</small></div></li>
                <li><span className="task-check done">2</span><div><strong>Estruturar a EAP</strong><small>Capítulos, actividades e serviços finais</small></div></li>
                <li><span className="task-check done">3</span><div><strong>Registar recursos e composições</strong><small>Preços próprios e coeficientes técnicos</small></div></li>
                <li><span className="task-check">4</span><div><strong>Preparar o mapa financeiro</strong><small>Premissas, coeficiente K e revisão do orçamento</small></div></li>
                <li><span className="task-check">5</span><div><strong>Acompanhar a execução</strong><small>Medições e, futuramente, custos reais</small></div></li>
              </ol>
              <Link className="dashboard-text-link" href="/obras">Ir para as obras →</Link>
            </article>
            <article className="panel-card dashboard-roadmap">
              <div className="panel-title"><div><h2>Em desenvolvimento</h2><p>Funcionalidades seguintes — não apresentadas como concluídas</p></div><span className="subtle-icon">⌁</span></div>
              {nextSteps.map((step, index) => <div className="roadmap-item" key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{step.description}</p></div></div>)}
            </article>
          </section>

          <section className="dashboard-note"><strong>Importante sobre o estado actual</strong><p>A interface de medições permite criar rascunhos; a aprovação ainda não está implementada. O CSV de orçamento está disponível dentro de cada obra. Antes de usar em produção, é necessário confirmar a compilação, as migrações e os testes do ambiente publicado.</p></section>
          <footer className="footer"><span>ObraCerta · Plataforma de orçamentação e controlo de obras</span><span>Contexto operacional de Moçambique · moeda base MZN</span></footer>
        </div>
      </section>
    </main>
  );
}
