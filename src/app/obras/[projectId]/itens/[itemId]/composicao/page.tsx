"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import "./composicao.css";

type Resource = { id: string; code: string; name: string; type: string; unit: string; unitPrice: string | number; currency: string; importCost: string | number; transportCost: string | number; otherCost: string | number; supplier: { name: string } | null };
type Line = { resourceId: string; coefficient: string };
type SavedLine = { id: string; coefficient: string | number; unitPriceAtSave: string | number; resource: { code: string; name: string; type: string; unit: string } };
type Version = { id: string; version: number; notes: string | null; createdAt: string; lines: SavedLine[] };

const resourceTypes: Record<string,string> = { MATERIAL:"Material", LABOUR:"Mão-de-obra", EQUIPMENT:"Equipamento", SUBCONTRACT:"Subempreitada", OTHER:"Outro" };
const fmt = (v:number, currency="MZN") => new Intl.NumberFormat("pt-MZ",{style:"currency",currency,maximumFractionDigits:2}).format(v);
export default function CompositionPage() {
  const params = useParams<{projectId:string;itemId:string}>();
  const {projectId,itemId}=params;
  const [resources,setResources]=useState<Resource[]>([]);
  const [versions,setVersions]=useState<Version[]>([]);
  const [projectName,setProjectName]=useState("");
  const [itemName,setItemName]=useState("");
  const [itemCode,setItemCode]=useState("");
  const [currency,setCurrency]=useState("MZN");
  const [lines,setLines]=useState<Line[]>([{resourceId:"",coefficient:"1"}]);
  const [notes,setNotes]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState(false);

  const load=useCallback(async()=>{
    setLoading(true);
    try {
      const [projectRes,itemsRes,resourcesRes,versionsRes]=await Promise.all([
        fetch(`/api/projects/${encodeURIComponent(projectId)}`,{cache:"no-store"}),
        fetch(`/api/projects/${encodeURIComponent(projectId)}/items`,{cache:"no-store"}),
        fetch("/api/resources?active=true",{cache:"no-store"}),
        fetch(`/api/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}/compositions`,{cache:"no-store"}),
      ]);
      const [projectData,itemsData,resourcesData,versionsData]=await Promise.all([projectRes.json(),itemsRes.json(),resourcesRes.json(),versionsRes.json()]);
      for(const [response,data] of [[projectRes,projectData],[itemsRes,itemsData],[resourcesRes,resourcesData],[versionsRes,versionsData]] as const) {
        if(!response.ok) throw new Error(data.error||"Não foi possível carregar os dados.");
      }
      setProjectName(projectData.data.name); setCurrency(projectData.data.currency||"MZN");
      const item=itemsData.data.find((entry:{id:string;name:string;code:string})=>entry.id===itemId);
      if(!item) throw new Error("Item não encontrado nesta obra.");
      setItemName(item.name); setItemCode(item.code); setResources(resourcesData.data); setVersions(versionsData.data);
      setError(false);setMessage("");
    } catch(e) {setError(true);setMessage(e instanceof Error?e.message:"Erro ao carregar os dados.");}
    finally{setLoading(false);}
  },[projectId,itemId]);
  useEffect(()=>{void load();},[load]);

  const effectivePrice=(r:Resource)=>Number(r.unitPrice)+Number(r.importCost)+Number(r.transportCost)+Number(r.otherCost);
  const estimate=useMemo(()=>lines.reduce((total,line)=>{
    const r=resources.find(item=>item.id===line.resourceId);
    const coefficient=Number(line.coefficient);
    return total+(r&&Number.isFinite(coefficient)&&coefficient>0?effectivePrice(r)*coefficient:0);
  },0),[lines,resources]);

  function updateLine(index:number,patch:Partial<Line>){setLines(current=>current.map((line,i)=>i===index?{...line,...patch}:line));}
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setSaving(true);setMessage("");setError(false);
    try{
      const validLines=lines.filter(line=>line.resourceId&&Number(line.coefficient)>0&&Number.isFinite(Number(line.coefficient)));
      if(!validLines.length) throw new Error("Adicione pelo menos um recurso e um coeficiente válido.");
      if(new Set(validLines.map(line=>line.resourceId)).size!==validLines.length) throw new Error("Seleccione cada recurso apenas uma vez na mesma composição.");
      const response=await fetch(`/api/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}/compositions`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({notes,lines:validLines.map(line=>({resourceId:line.resourceId,coefficient:Number(line.coefficient)}))}),
      });
      const data=await response.json();if(!response.ok)throw new Error(data.error||"Não foi possível guardar a composição.");
      setLines([{resourceId:"",coefficient:"1"}]);setNotes("");setMessage("Nova versão da composição guardada com sucesso.");await load();
    }catch(e){setError(true);setMessage(e instanceof Error?e.message:"Erro ao guardar a composição.");}
    finally{setSaving(false);}
  }

  return <main className="composition-shell">
    <header className="composition-topbar"><Link href="/" className="composition-brand"><span className="composition-logo">O</span><span><strong>ObraCerta</strong><small>GESTÃO DE OBRAS</small></span></Link><Link href={`/obras/${projectId}`} className="composition-back">← Voltar à EAP</Link></header>
    {loading?<div className="composition-state">A carregar composição…</div>:<><section className="composition-heading"><span className="composition-eyebrow">COMPOSIÇÃO DE CUSTOS UNITÁRIOS · {itemCode}</span><h1>{itemName}</h1><p>Obra: {projectName} · Moeda: {currency}</p></section>
    {message&&<p className={error?"composition-alert error":"composition-alert"} role="status">{message}{error&&message.includes("Sessão")?<> <Link href="/acesso">Iniciar sessão</Link></>:null}</p>}
    <section className="composition-card"><div className="composition-card-title"><div><h2>Nova versão da composição</h2><p>Escolha os recursos da sua empresa e indique o coeficiente necessário por unidade de serviço.</p></div><span className="composition-version">{versions.length? `Última versão: v${Math.max(...versions.map(v=>v.version))}`:"Primeira versão"}</span></div>
    {resources.length===0?<div className="composition-empty"><strong>Não existem recursos activos</strong><p>Registe materiais, mão-de-obra ou equipamentos antes de compor o custo.</p><Link href="/recursos">Abrir recursos e fornecedores</Link></div>:<form onSubmit={submit} className="composition-form">
    {lines.map((line,index)=><div className="composition-line" key={index}><label>Recurso<select required value={line.resourceId} onChange={e=>updateLine(index,{resourceId:e.target.value})}><option value="">Seleccione um recurso…</option>{resources.filter(r=>r.id===line.resourceId||!lines.some((other,i)=>i!==index&&other.resourceId===r.id)).map(r=><option key={r.id} value={r.id}>{r.code} · {r.name} ({resourceTypes[r.type]||r.type})</option>)}</select></label><label>Coeficiente<input type="number" min="0.000001" step="0.000001" required value={line.coefficient} onChange={e=>updateLine(index,{coefficient:e.target.value})}/></label><div className="composition-line-price"><small>Preço efectivo / unidade</small><strong>{line.resourceId&&resources.find(r=>r.id===line.resourceId)?fmt(effectivePrice(resources.find(r=>r.id===line.resourceId)! ),currency):"—"}</strong></div><button type="button" className="composition-remove" disabled={lines.length===1} onClick={()=>setLines(current=>current.filter((_,i)=>i!==index))} aria-label="Remover recurso">×</button></div>)}
    <div className="composition-add-row"><button type="button" className="composition-secondary" disabled={lines.length>=500||lines.filter(l=>l.resourceId).length>=resources.length} onClick={()=>setLines(current=>[...current,{resourceId:"",coefficient:"1"}])}>＋ Adicionar recurso</button><span>{lines.filter(l=>l.resourceId).length} recurso(s) seleccionado(s)</span></div>
    <label className="composition-notes">Notas técnicas<textarea rows={2} maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Premissas de produtividade, desperdícios ou condições de execução"/></label>
    <div className="composition-estimate"><div><span>Custo directo unitário estimado</span><small>Preço de aquisição + importação + transporte + outros encargos, multiplicado pelos coeficientes</small></div><strong>{fmt(estimate,currency)}</strong></div>
    <div className="composition-actions"><button type="submit" className="composition-primary" disabled={saving||resources.length===0}>{saving?"A guardar…":"Guardar nova versão"}</button></div>
    </form>}</section>
    <section className="composition-card"><div className="composition-card-title"><div><h2>Histórico de versões</h2><p>Os preços ficam congelados em cada versão para preservar o histórico de custos.</p></div><span className="composition-count">{versions.length} versão(ões)</span></div>
    {versions.length===0?<div className="composition-empty">Ainda não existem composições para este serviço.</div>:<div className="composition-history">{versions.map(v=><article className="composition-version-card" key={v.id}><header><div><strong>Versão {v.version}</strong><small>{new Intl.DateTimeFormat("pt-MZ",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v.createdAt))}</small></div><strong>{fmt(v.lines.reduce((sum,l)=>sum+Number(l.coefficient)*Number(l.unitPriceAtSave),0),currency)} / unidade</strong></header>{v.notes&&<p>{v.notes}</p>}<div className="composition-history-lines">{v.lines.map(line=><div key={line.id}><span>{line.resource.code} · {line.resource.name}</span><span>{Number(line.coefficient).toLocaleString("pt-MZ",{maximumFractionDigits:6})} × {fmt(Number(line.unitPriceAtSave),currency)}</span><strong>{fmt(Number(line.coefficient)*Number(line.unitPriceAtSave),currency)}</strong></div>)}</div></article>)}</div>}
    </section></>}
  </main>;
}
