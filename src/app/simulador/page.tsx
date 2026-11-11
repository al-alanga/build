"use client";

import { useMemo, useState } from "react";
import { calculateBudget } from "@/lib/costing";

const money = new Intl.NumberFormat("pt-MZ", {
  style: "currency",
  currency: "MZN",
  maximumFractionDigits: 2,
});

function RateInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-with-suffix">
        <input
          type="number"
          min="0"
          max="100"
          step="0.5"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span>%</span>
      </div>
    </label>
  );
}

export default function SimulatorPage() {
  const [directCost, setDirectCost] = useState(100000);
  const [indirectCost, setIndirectCost] = useState(12000);
  const [overhead, setOverhead] = useState(8);
  const [profit, setProfit] = useState(15);
  const [tax, setTax] = useState(0);

  const result = useMemo(() => calculateBudget({
    directCost: Math.max(0, directCost),
    indirectCost: Math.max(0, indirectCost),
    overheadRate: overhead / 100,
    profitRate: profit / 100,
    taxRate: tax / 100,
  }), [directCost, indirectCost, overhead, profit, tax]);

  return (
    <main className="simulator-shell">
      <header className="simulator-header">
        <a className="brand" href="/">
          <span className="brand-mark">O</span>
          <span><strong>ObraCerta</strong><small>SIMULADOR DE CUSTOS</small></span>
        </a>
        <a className="back-link" href="/">← Voltar ao painel</a>
      </header>
      <div className="simulator-content">
        <p className="eyebrow">FERRAMENTA DE TRABALHO · VERSÃO INICIAL</p>
        <h1>Simulador de orçamento</h1>
        <p className="simulator-intro">Experimente como os custos, os encargos e o lucro influenciam o preço de venda. Os valores são temporários e não ficam guardados.</p>

        <div className="simulator-grid">
          <section className="simulator-card">
            <div className="sim-card-heading"><span className="sim-step">01</span><div><h2>Dados do orçamento</h2><p>Introduza os valores que pretende testar.</p></div></div>
            <label className="field">
              <span>Custos directos</span>
              <div className="input-with-suffix"><input type="number" min="0" step="1000" value={directCost} onChange={(e) => setDirectCost(Math.max(0, Number(e.target.value)))} /><span>MZN</span></div>
              <small>Materiais, mão de obra directa, equipamentos e subempreitadas.</small>
            </label>
            <label className="field">
              <span>Custos indirectos</span>
              <div className="input-with-suffix"><input type="number" min="0" step="1000" value={indirectCost} onChange={(e) => setIndirectCost(Math.max(0, Number(e.target.value)))} /><span>MZN</span></div>
              <small>Despesas gerais da obra não atribuídas directamente a um serviço.</small>
            </label>
            <div className="field-divider" />
            <div className="sim-card-heading"><span className="sim-step">02</span><div><h2>Parâmetros de cálculo</h2><p>Taxas ilustrativas e totalmente editáveis.</p></div></div>
            <div className="rates-grid">
              <RateInput label="Encargos gerais" value={overhead} onChange={setOverhead} />
              <RateInput label="Lucro sobre o custo com encargos" value={profit} onChange={setProfit} />
              <RateInput label="Imposto aplicado ao preço antes do imposto" value={tax} onChange={setTax} />
            </div>
            <p className="simulator-warning">A taxa de imposto começa em 0% apenas para não presumir uma taxa legal. Confirme os parâmetros aplicáveis com o seu contabilista antes de usar qualquer resultado comercial.</p>
          </section>

          <section className="result-column">
            <div className="result-hero">
              <p>PREÇO DE VENDA SIMULADO</p>
              <div className="result-price">{money.format(result.sellingPrice)}</div>
              <div className="result-meta">Coeficiente K: <strong>{result.kCoefficient.toFixed(4).replace(".", ",")}</strong></div>
            </div>
            <div className="breakdown-card">
              <h2>Composição do preço</h2>
              <div className="breakdown-row"><span>Custos directos</span><strong>{money.format(result.directCost)}</strong></div>
              <div className="breakdown-row"><span>Custos indirectos</span><strong>{money.format(result.indirectCost)}</strong></div>
              <div className="breakdown-row"><span>Base de custos</span><strong>{money.format(result.baseCost)}</strong></div>
              <div className="breakdown-row"><span>Encargos gerais</span><strong>{money.format(result.overheadAmount)}</strong></div>
              <div className="breakdown-row"><span>Lucro</span><strong>{money.format(result.profitAmount)}</strong></div>
              <div className="breakdown-row"><span>Preço antes do imposto</span><strong>{money.format(result.preTaxPrice)}</strong></div>
              <div className="breakdown-row"><span>Imposto parametrizado</span><strong>{money.format(result.taxAmount)}</strong></div>
              <div className="breakdown-row total"><span>Preço final</span><strong>{money.format(result.sellingPrice)}</strong></div>
            </div>
            <div className="formula-hint"><strong>Como é calculado?</strong><p>Base de custos = custos directos + indirectos. Os encargos gerais são aplicados à base; o lucro incide sobre a base com encargos; o imposto é aplicado ao preço antes do imposto.</p></div>
          </section>
        </div>
        <footer className="footer simulator-footer"><span>ObraCerta · Simulação local</span><a href="/">Voltar ao painel principal</a></footer>
      </div>
    </main>
  );
}
