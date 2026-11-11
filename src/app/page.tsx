const metrics = [
  { label: "Obras activas", value: "—", note: "Ligue a base de dados para carregar obras", icon: "▦" },
  { label: "Orçamento total", value: "— MZN", note: "Sem dados registados", icon: "↗" },
  { label: "Em revisão", value: "—", note: "Revisões por aprovar", icon: "◷" },
  { label: "Desvio de custos", value: "—", note: "Disponível na fase de execução", icon: "⌁" },
];

const modules = [
  { number: "01", title: "Obras e EAP", description: "Organize capítulos, actividades e serviços numa estrutura hierárquica.", status: "Módulo em construção" },
  { number: "02", title: "Recursos e fornecedores", description: "Registe os seus materiais, mão de obra, equipamentos e cotações.", status: "Modelo inicial criado" },
  { number: "03", title: "Composições de custos", description: "Calcule custos unitários a partir de coeficientes técnicos e preços próprios.", status: "Motor inicial criado" },
  { number: "04", title: "Orçamento e coeficiente K", description: "Separe custos directos, indirectos, encargos, lucro e impostos configuráveis.", status: "Cálculo inicial criado" },
];

export default function HomePage() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="ObraCerta página inicial">
          <span className="brand-mark">O</span>
          <span><strong>ObraCerta</strong><small>GESTÃO DE OBRAS</small></span>
        </a>
        <div className="workspace-label">ESPAÇO DE TRABALHO</div>
        <nav className="navigation" aria-label="Navegação principal">
          <a className="nav-item active" href="#visao-geral"><span>▦</span> Visão geral</a>
          <a className="nav-item" href="/obras"><span>▤</span> Obras</a>
          <a className="nav-item" href="/simulador"><span>∑</span> Simulador de custos</a>
          <a className="nav-item" href="#orcamentos"><span>▧</span> Orçamentos <em>Em breve</em></a>
          <a className="nav-item" href="#recursos"><span>◫</span> Recursos <em>Em breve</em></a>
          <a className="nav-item" href="#relatorios"><span>▥</span> Relatórios <em>Em breve</em></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="setup-card">
            <span className="setup-dot" />
            <strong>Ambiente inicial</strong>
            <p>Esta versão é a fundação do produto. Ainda não existem dados de obras.</p>
          </div>
          <div className="profile">
            <div className="avatar">OC</div>
            <div><strong>Espaço da empresa</strong><small>Configuração pendente</small></div>
            <span className="profile-menu">···</span>
          </div>
        </div>
      </aside>

      <section className="main-panel" id="visao-geral">
        <header className="topbar">
          <div className="breadcrumb">ObraCerta <span>/</span> <strong>Visão geral</strong></div>
          <div className="topbar-right"><a className="currency-chip" href="/acesso">Aceder / criar conta</a><span className="currency-chip">MZN · Metical</span><span className="user-chip">OC</span></div>
        </header>

        <div className="content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">PAINEL DE CONTROLO</p>
              <h1>Visão geral</h1>
              <p className="welcome-copy">Uma base organizada para orçamentar e acompanhar os custos das suas obras.</p>
            </div>
            <a className="primary-button" href="/simulador">Abrir simulador de custos <span className="button-soon">experimental</span></a>
          </section>

          <section className="notice" aria-label="Estado da aplicação">
            <div className="notice-icon">i</div>
            <div><strong>Bem-vindo à fundação do ObraCerta</strong><p>O projecto já tem a estrutura inicial, o modelo de dados e o motor de cálculo. Autenticação e ligação à base de dados ainda estão por implementar; os indicadores abaixo não representam dados reais.</p></div>
          </section>

          <section className="metric-grid" aria-label="Indicadores">
            {metrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <div className="metric-heading"><span>{metric.label}</span><span className="metric-icon">{metric.icon}</span></div>
                <div className="metric-value">{metric.value}</div>
                <p>{metric.note}</p>
              </article>
            ))}
          </section>

          <section className="section-heading">
            <div><p className="eyebrow">ESTRUTURA DO PRODUTO</p><h2>Módulos principais</h2></div>
            <span className="section-count">4 módulos prioritários</span>
          </section>

          <section className="module-grid" id="obras">
            {modules.map((module) => (
              <article className="module-card" key={module.number}>
                <div className="module-top"><span className="module-number">{module.number}</span><span className="module-arrow">↗</span></div>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                <div className="module-footer"><span className="status-dot" />{module.status}</div>
              </article>
            ))}
          </section>

          <section className="bottom-grid">
            <article className="panel-card" id="orcamentos">
              <div className="panel-title"><div><h2>Próximas etapas</h2><p>Ordem de implementação recomendada</p></div><span className="subtle-icon">☷</span></div>
              <ol className="task-list">
                <li><span className="task-check done">✓</span><div><strong>Definir âmbito e arquitectura</strong><small>Concluído · documentação base</small></div></li>
                <li><span className="task-check done">✓</span><div><strong>Criar o motor de cálculo</strong><small>Concluído · funções e testes iniciais</small></div></li>
                <li><span className="task-check">3</span><div><strong>Implementar acesso e empresas</strong><small>Próximo · autenticação e permissões</small></div></li>
                <li><span className="task-check">4</span><div><strong>Construir gestão de obras e EAP</strong><small>Após o módulo de acesso</small></div></li>
              </ol>
            </article>
            <article className="panel-card calculation-card" id="recursos">
              <div className="panel-title"><div><h2>Princípio de cálculo</h2><p>Transparência em cada orçamento</p></div><span className="subtle-icon">∑</span></div>
              <div className="formula-row"><span>Custo directo</span><strong>+</strong><span>Custo indirecto</span></div>
              <div className="formula-divider" />
              <div className="formula-row"><span>Encargos gerais</span><strong>+</strong><span>Lucro</span></div>
              <div className="formula-divider" />
              <div className="formula-row"><span>Imposto configurado</span><strong>=</strong><span className="formula-result">Preço de venda</span></div>
              <p className="calculation-note">As taxas serão parametrizadas e validadas localmente. Nenhuma taxa legal é presumida pelo motor de cálculo.</p>
            </article>
          </section>

          <footer className="footer"><span>ObraCerta · Fundação de produto v0.1</span><span>Desenhado para o contexto operacional de Moçambique</span></footer>
        </div>
      </section>
    </main>
  );
}
