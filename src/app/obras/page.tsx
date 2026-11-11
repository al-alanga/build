import "../module.css";
import Link from "next/link";

const steps = [
  { number: "01", title: "Identificação da obra", detail: "Código, nome, cliente, localização e moeda." },
  { number: "02", title: "Estrutura de actividades (EAP)", detail: "Capítulos, subcapítulos, actividades e serviços." },
  { number: "03", title: "Quantidades e medições", detail: "Unidades, quantidades, revisões e histórico de alterações." },
];

export default function ProjectsPage() {
  return (
    <main className="module-page">
      <header className="module-page-header">
        <Link href="/" className="module-back">← Painel principal</Link>
        <span className="module-kicker">MÓDULO 01 · GESTÃO DE OBRAS</span>
        <h1>Obras e estrutura de actividades</h1>
        <p>Prepare a base técnica de cada orçamento: identifique a obra, organize os serviços e mantenha as quantidades rastreáveis.</p>
      </header>
      <section className="module-status">
        <span className="module-status-icon">i</span>
        <div><strong>Módulo em construção</strong><p>Esta página apresenta o âmbito funcional. O cadastro ainda não grava registos, porque a autenticação e a persistência segura por empresa estão a ser implementadas primeiro.</p></div>
      </section>
      <section className="module-step-grid">
        {steps.map((step) => (
          <article className="module-step-card" key={step.number}>
            <span>{step.number}</span><h2>{step.title}</h2><p>{step.detail}</p>
          </article>
        ))}
      </section>
      <section className="module-page-note">
        <h2>Regras que o módulo deverá respeitar</h2>
        <ul>
          <li>Cada código de obra será único dentro da empresa.</li>
          <li>Uma obra terá uma hierarquia de capítulos e serviços sem ciclos.</li>
          <li>As quantidades serão validadas e as alterações importantes terão histórico.</li>
          <li>Os dados de uma empresa não poderão ser consultados por membros de outra empresa.</li>
        </ul>
      </section>
    </main>
  );
}
