"use client";
import React from "react";

type DocumentRow={
  id:number; document_number:string|null; external_document_number:string|null; document_type:string|null;
  direction:string; status:string; document_date:string; net_amount:string|number; tax_amount:string|number; gross_amount:string|number;
  attachment_name:string|null; credit_note_for_id:number|null; contact_name:string|null; cost_center_code:string|null;
};
type Data={documents:DocumentRow[]};
const eur=(n:any)=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(Number(n||0));
const dd=(v:any)=>{if(!v)return"–";const d=new Date(String(v).slice(0,10)+"T00:00:00");return Number.isNaN(d.getTime())?"–":d.toLocaleDateString("de-DE")};
const kind=(x:DocumentRow)=>x.credit_note_for_id?"Gutschrift":x.direction==="INCOMING"?"Eingangsrechnung":x.document_type==="ZERO_RECEIPT"?"0-€-Beleg":x.document_type==="INTERNAL"?"Interner Beleg":"Ausgangsrechnung";
const status=(s:string)=>s==="OPEN"?"Offen":s==="PAID"?"Bezahlt":s==="CANCELLED"?"Storniert":s==="COMPLETED"?"Erledigt":s;
export default function ClosingSection(){
 const[data,setData]=React.useState<Data|null>(null),[error,setError]=React.useState("");
 React.useEffect(()=>{(async()=>{try{const r=await fetch("/api/backend/closing",{cache:"no-store"}),t=await r.text();if(!t.trim())throw new Error(`Leere Serverantwort (${r.status})`);const x=JSON.parse(t);if(!r.ok)throw new Error(x.error||`HTTP ${r.status}`);setData(x);setError("")}catch(e){setError(e instanceof Error?e.message:"Abschluss konnte nicht geladen werden.")}})()},[]);
 const groups=React.useMemo(()=>{const m=new Map<number,DocumentRow[]>();for(const x of data?.documents||[]){const y=Number(String(x.document_date||"").slice(0,4))||0;if(!m.has(y))m.set(y,[]);m.get(y)!.push(x)}return [...m.entries()].sort((a,b)=>b[0]-a[0])},[data]);
 return <section className="backend-section closing-section">
   <div className="backend-section-head"><div><span className="backend-section-kicker">JAHRESABSCHLUSS</span><h2>Rechnungsarchiv</h2><p className="finance-section-note">Alle Ein- und Ausgangsrechnungen sowie Gutschriften, vollständig nach Geschäftsjahren sortiert.</p></div></div>
   {error&&<div className="backend-alert">{error}</div>}
   {!error&&!data&&<p className="finance-section-note">Wird geladen …</p>}
   {data&&groups.length===0&&<p className="finance-section-note">Noch keine Rechnungen oder Belege vorhanden.</p>}
   {groups.map(([year,rows])=>{
     const net=rows.reduce((s,x)=>s+Number(x.net_amount||0),0),tax=rows.reduce((s,x)=>s+Number(x.tax_amount||0),0),gross=rows.reduce((s,x)=>s+Number(x.gross_amount||0),0);
     return <div className="closing-year" key={year}>
       <div className="backend-section-head closing-year-head"><div><span className="backend-section-kicker">GESCHÄFTSJAHR</span><h2>{year}</h2></div><div className="closing-year-summary"><span>{rows.length} Belege</span><span>Netto <strong>{eur(net)}</strong></span><span>MwSt. <strong>{eur(tax)}</strong></span><span>Brutto <strong>{eur(gross)}</strong></span></div></div>
       <div className="backend-table-wrap"><table className="backend-table"><thead><tr><th>Datum</th><th>Nr.</th><th>Art</th><th>Von / Zu</th><th>Kostenstelle</th><th>Netto</th><th>MwSt.</th><th>Brutto</th><th>Status</th><th>Dokument</th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td>{dd(x.document_date)}</td><td>{x.direction==="OUTGOING"?<a className="backend-table-link" href={`/backend/rechnung/${x.id}`} target="_blank" rel="noreferrer">{x.document_number}</a>:<strong>{x.external_document_number||x.document_number}</strong>}</td><td>{kind(x)}</td><td>{x.contact_name||"–"}</td><td>{x.cost_center_code||"–"}</td><td>{eur(x.net_amount)}</td><td>{eur(x.tax_amount)}</td><td><strong>{eur(x.gross_amount)}</strong></td><td>{status(x.status)}</td><td>{x.direction==="INCOMING"&&x.attachment_name?<a className="backend-table-link" href={`/api/backend/finance/documents/${x.id}?download=1`} target="_blank" rel="noreferrer">PDF</a>:"–"}</td></tr>)}</tbody></table></div>
     </div>})}
 </section>
}
