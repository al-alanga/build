"use client";
import React, { FormEvent,useCallback,useEffect,useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import "./orcamento.css";
type BudgetRow={id:string;code:string;name:string;unit:string|null;quantity:number;compositionVersion:number|null;unitCost:number;directTotal:number;lines:{code:string;name:string;type:string;unit:string;coefficient:number;unitPrice:number;total:number}[]};
type Pricing={directCost:number;indirectCost:number;costBase:number;overheadAmount:number;costAfterOverhead:number;profitAmount:number;sellingPriceBeforeTax:number;taxAmount:number;sellingPrice:number;kCoefficient:number};
type Revision={id:string;revisionNumber:number;status:string;directCost:string|number;indirectCost:string|number;overheadRate:string|number;profitRate:string|number;taxRate:string|number;sellingPrice:string|number;createdAt:string;assumptions:unknown};
const pct=(n:number)=>String((n*100).toLocaleString("pt-MZ",{maximumFractionDigits:2}))+"%";
export default function BudgetPage(){
 const {projectId}=useParams<{projectId:string}>();
 const [project,setProject]=useState<{name:string;currency:string}|null>(null);
 const [rows,setRows]=useState<BudgetRow[]>([]);
 const [revisions,setRevisions]=useState<Revision[]>([]);
 const [indirect,setIndirect]=useState("0");
 const [overhead,setOverhead]=useState("0.10");
 const [profit,setProfit]=useState("0.15");
 const [tax,setTax]=useState("0");
 const [notes,setNotes]=useState("");
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState(false);
 const [lastPricing,setLastPricing]=useState<Pricing|null>(null);
 const [expanded,setExpanded]=useState<string|null>(null);
 const fmt=useCallback((value:number)=>new Intl.NumberFormat("pt-MZ",{style:"currency",currency:project?.currency||"MZN",maximumFractionDigits:2}).format(value),[project?.currency]);
 const load=useCallback(async()=>{
  setLoading(true);
  try{const response=await fetch("/api/projects/"+encodeURIComponent(projectId)+"/budget",{cache:"no-store"});const result=await response.json();if(!response.ok)throw new Error(result.error||"Não foi possível carregar o orçamento.");setProject(result.data.project);setRows(result.data.items);setRevisions(result.data.revisions);setError(false);setMessage("");}
  catch(e){setError(true);setMessage(e instanceof Error?e.message:"Erro ao carregar o orçamento.");}finally{setLoading(false);}
 },[projectId]);
 useEffect(()=>{void load();},[load]);
 const direct=rows.reduce((sum,row)=>sum+row.directTotal,0);
 const indirectValue=Number(indirect)||0, overheadValue=Number(overhead)||0, profitValue=Number(profit)||0,taxValue=Number(tax)||0;
 const costBase=direct+indirectValue, overheadAmount=costBase*overheadValue, afterOverhead=costBase+overheadAmount, profitAmount=afterOverhead*profitValue, beforeTax=afterOverhead+profitAmount, taxAmount=beforeTax*taxValue, selling=beforeTax+taxAmount;
 async function createRevision(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setSaving(true);setError(false);setMessage("");
  try{const response=await fetch("/api/projects/"+encodeURIComponent(projectId)+"/budget",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({indirectCost:indirectValue,overheadRate:overheadValue,profitRate:profitValue,taxRate:taxValue,notes})});const result=await response.json();if(!response.ok)throw new Error(result.error||"Não foi possível guardar a revisão.");setLastPricing(result.data.pricing);setMessage("Revisão v"+result.data.revision.revisionNumber+" guardada como rascunho.");await load();}
  catch(e){setError(true);setMessage(e instanceof Error?e.message:"Erro ao guardar a revisão.");}finally{setSaving(false);}
 }
 return <main className="budget-shell">
  <header className="budget-topbar"><Link href="/" className="budget-brand"><span className="budget-logo">O</span><span><strong>ObraCerta</strong><small>GESTÃO DE OBRAS</small></span></Link><Link href={"/obras/"+projectId} className="budget-back">← Voltar à EAP</Link></header>
  {loading?<p className="budget-loading">A carregar mapa financeiro…</p>:!project?<section className="budget-error">{message}<p><Link href="/obras">Voltar às obras</Link></p></section>:<>
   <section className="budget-heading"><span className="budget-kicker">ORÇAMENTO · MAPA FINANCEIRO</span><h1>{project.name}</h1><p>Custos directos calculados a partir das últimas composições guardadas em cada serviço.</p></section>
   {message&&<p className={error?"budget-alert error":"budget-alert"} role="status">{message}{error&&message.includes("Sessão")?<> <Link href="/acesso">Iniciar sessão</Link></>:null}</p>}
   <section className="budget-metrics"><div><span>Custo directo</span><strong>{fmt(direct)}</strong><small>{rows.length} serviço(s) de nível final</small></div><div><span>Preço de venda simulado</span><strong>{fmt(selling)}</strong><small>Com as premissas abaixo</small></div><div><span>Coeficiente K</span><strong>{direct>0?(beforeTax/direct).toLocaleString("pt-MZ",{maximumFractionDigits:4}):"—"}</strong><small>Preço antes de imposto / custo directo</small></div><div><span>Revisões</span><strong>{revisions.length}</strong><small>Histórico de versões</small></div></section>
   <section className="budget-card"><header className="budget-card-head"><div><h2>Mapa de custos por serviço</h2><p>Os capítulos são excluídos do somatório quando têm filhos, para evitar dupla contagem.</p></div></header>
    {rows.length===0?<div className="budget-empty">Ainda não existem serviços finais na EAP.</div>:<div className="budget-table-wrap"><table className="budget-table"><thead><tr><th>Código</th><th>Serviço</th><th>Un.</th><th>Quantidade</th><th>Versão</th><th>Custo unitário</th><th>Custo total</th></tr></thead><tbody>{rows.map(row=><React.Fragment key={row.id}><tr><td>{row.code}</td><td><strong>{row.name}</strong>{row.compositionVersion===null&&<small className="budget-missing">Sem composição</small>}<button type="button" className="budget-expand" onClick={()=>setExpanded(expanded===row.id?null:row.id)}>{expanded===row.id?"Ocultar recursos":"Detalhar recursos"}</button></td><td>{row.unit||"—"}</td><td>{row.quantity.toLocaleString("pt-MZ",{maximumFractionDigits:4})}</td><td>{row.compositionVersion===null?"—":"v"+row.compositionVersion}</td><td>{fmt(row.unitCost)}</td><td><strong>{fmt(row.directTotal)}</strong></td></tr>{expanded===row.id&&<tr><td colSpan={7}><div className="budget-resource-details"><strong>Recursos da composição</strong>{row.lines.length?row.lines.map((line,i)=><div key={line.code+i}><span>{line.code} · {line.name}</span><span>{line.coefficient.toLocaleString("pt-MZ",{maximumFractionDigits:6})} × {fmt(line.unitPrice)}</span><strong>{fmt(line.total)}</strong></div>):<p>Este serviço ainda não tem composição guardada.</p>}</div></td></tr>}</React.Fragment>)}</tbody><tfoot><tr><td colSpan={6}>TOTAL DOS CUSTOS DIRECTOS</td><td>{fmt(direct)}</td></tr></tfoot></table></div>}
   </section>
   <section className="budget-card"><header className="budget-card-head"><div><h2>Formação do preço de venda</h2><p>Parâmetros editáveis para simulação. Confirme os impostos e encargos aplicáveis ao contrato.</p></div></header>
    <form className="budget-form" onSubmit={createRevision}>
     <label>Custos indirectos totais ({project.currency})<input type="number" min="0" step="0.01" required value={indirect} onChange={e=>setIndirect(e.target.value)}/><small>Ex.: administração, comunicações, instalações e custos gerais atribuídos à obra.</small></label>
     <label>Encargos gerais (%)<input type="number" min="0" max="100" step="0.01" required value={(overheadValue*100).toString()} onChange={e=>setOverhead(String(Number(e.target.value)/100))}/><small>Aplicados à soma dos custos directos e indirectos.</small></label>
     <label>Lucro sobre o custo com encargos (%)<input type="number" min="0" max="100" step="0.01" required value={(profitValue*100).toString()} onChange={e=>setProfit(String(Number(e.target.value)/100))}/><small>Taxa sobre o custo acrescido dos encargos gerais, não margem sobre vendas.</small></label>
     <label>Imposto configurável (%)<input type="number" min="0" max="100" step="0.01" required value={(taxValue*100).toString()} onChange={e=>setTax(String(Number(e.target.value)/100))}/><small>Premissa de simulação; não é determinação fiscal automática.</small></label>
     <label className="budget-notes">Notas e premissas<textarea rows={2} maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Pressupostos, exclusões e condições comerciais"/></label>
     <div className="budget-breakdown"><div><span>Custos directos</span><strong>{fmt(direct)}</strong></div><div><span>Custos indirectos</span><strong>{fmt(indirectValue)}</strong></div><div><span>Encargos gerais · {pct(overheadValue)}</span><strong>{fmt(overheadAmount)}</strong></div><div><span>Lucro · {pct(profitValue)}</span><strong>{fmt(profitAmount)}</strong></div><div><span>Preço antes de imposto</span><strong>{fmt(beforeTax)}</strong></div><div><span>Imposto · {pct(taxValue)}</span><strong>{fmt(taxAmount)}</strong></div><div className="budget-total"><span>PREÇO DE VENDA SIMULADO</span><strong>{fmt(selling)}</strong></div><div><span>Coeficiente K</span><strong>{direct>0?(beforeTax/direct).toLocaleString("pt-MZ",{maximumFractionDigits:4}):"—"}</strong></div></div>
     <div className="budget-actions"><button className="budget-primary" type="submit" disabled={saving}>{saving?"A guardar…":"Guardar revisão do orçamento"}</button></div>
    </form>
   </section>
   {lastPricing&&<section className="budget-card"><h2>Resultado da última gravação</h2><p>Preço de venda: <strong>{fmt(lastPricing.sellingPrice)}</strong> · K: <strong>{lastPricing.kCoefficient.toLocaleString("pt-MZ",{maximumFractionDigits:4})}</strong></p></section>}
   <section className="budget-card"><header className="budget-card-head"><div><h2>Histórico de revisões</h2><p>Cada gravação cria uma revisão nova; as anteriores são preservadas.</p></div></header>{revisions.length===0?<div className="budget-empty">Ainda não existem revisões guardadas.</div>:<div className="budget-history">{revisions.map(r=><article key={r.id}><div><strong>Revisão v{r.revisionNumber}</strong><small>{new Intl.DateTimeFormat("pt-MZ",{dateStyle:"medium",timeZone:"UTC"}).format(new Date(r.createdAt))} · {r.status==="DRAFT"?"Rascunho":r.status}</small></div><strong>{fmt(Number(r.sellingPrice))}</strong></article>)}</div>}</section>
   <p className="budget-note">O cálculo utiliza apenas a última composição de cada item terminal. Os itens sem composição têm custo unitário zero e são assinalados no mapa; verifique todos os serviços antes de aprovar.</p>
  </>}
 </main>;
}
