"use client";
import React,{useEffect,useState}from"react";import "./invoice.css";
const eur=(n:any)=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(Number(n||0));
const validDate=(v:any)=>{if(!v)return null;const d=new Date(String(v).slice(0,10)+"T00:00:00");return Number.isNaN(d.getTime())?null:d};
const dd=(v:any)=>{const d=validDate(v);return d?d.toLocaleDateString("de-DE"):"–"};
const addDays=(v:any,n:any)=>{const d=validDate(v);if(!d)return null;d.setDate(d.getDate()+Number(n||0));return d.toISOString().slice(0,10)};
export default function InvoicePage({params}:{params:Promise<{id:string}>}){
 const[p,setP]=useState<any>(null),[err,setErr]=useState("");
 useEffect(()=>{(async()=>{try{const{id}=await params,r=await fetch(`/api/backend/finance/documents/${id}`,{cache:"no-store"}),t=await r.text();if(!t.trim())throw Error(`Leere Serverantwort (${r.status})`);const x=JSON.parse(t);if(!r.ok)throw Error(x.error);setP(x)}catch(e){setErr(e instanceof Error?e.message:"Fehler")}})()},[params]);
 if(err)return <main className="invoice-screen"><div className="invoice-paper">{err}</div></main>;
 if(!p)return <main className="invoice-screen"><div className="invoice-paper">Lädt …</div></main>;
 const d=p.document,items=p.items||[],due=d.due_date||addDays(d.document_date,d.payment_terms_days??14);
 return <main className="invoice-screen"><div className="invoice-toolbar"><button onClick={()=>window.print()}>Drucken / Als PDF speichern</button><button onClick={()=>window.close()}>Schließen</button></div><article className="invoice-paper">
 <header className="invoice-head"><div><div className="invoice-brand">EHREN<br/>FELD</div><small>{d.issuer_name||"Rechnungssteller noch nicht konfiguriert"}</small></div><h1>{d.document_type==="ZERO_RECEIPT"?"0-€-BELEG":"RECHNUNG"}</h1></header>
 <section className="invoice-addresses"><div><small>{[d.issuer_name,d.issuer_street,[d.issuer_postal_code,d.issuer_city].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}</small><h3>{d.recipient_name||"–"}</h3><p>{d.recipient_street||""}<br/>{d.recipient_postal_code||""} {d.recipient_city||""}<br/>{d.recipient_country||""}</p></div><div className="invoice-meta"><p><span>Rechnungsnummer</span><strong>{d.document_number}</strong></p><p><span>Rechnungsdatum</span><strong>{dd(d.document_date)}</strong></p><p><span>Leistungsdatum</span><strong>{dd(d.service_date||d.document_date)}</strong></p>{d.status==="OPEN"&&<p><span>Zahlbar bis</span><strong>{dd(due)}</strong></p>}</div></section>
 <table className="invoice-items"><thead><tr><th>Pos.</th><th>Beschreibung</th><th>Menge</th><th>Einzel netto</th><th>MwSt.</th><th>Netto</th></tr></thead><tbody>{items.map((x:any,i:number)=><tr key={x.id}><td>{i+1}</td><td>{x.description}</td><td>{Number(x.quantity).toLocaleString("de-DE")} {x.unit}</td><td>{eur(x.unit_price)}</td><td>{Number(x.tax_rate||0).toLocaleString("de-DE")} %</td><td>{eur(x.net_total||x.line_total)}</td></tr>)}</tbody></table>
 <div className="invoice-totals"><p><span>Netto</span><strong>{eur(d.net_amount)}</strong></p><p><span>MwSt.</span><strong>{eur(d.tax_amount)}</strong></p><p className="grand"><span>Brutto</span><strong>{eur(d.gross_amount)}</strong></p></div>
 {d.note&&<section className="invoice-note"><strong>Hinweis</strong><p>{d.note}</p></section>}
 <footer className="invoice-footer"><div><strong>{d.issuer_name||""}</strong><br/>{d.issuer_street||""}<br/>{d.issuer_postal_code||""} {d.issuer_city||""}<br/>{d.issuer_country||""}</div><div>{d.issuer_tax_number&&<>Steuernr.: {d.issuer_tax_number}<br/></>}{d.issuer_vat_id&&<>USt-IdNr.: {d.issuer_vat_id}</>}</div><div>{d.issuer_bank_name||""}<br/>{d.issuer_iban&&<>IBAN: {d.issuer_iban}<br/></>}{d.issuer_bic&&<>BIC: {d.issuer_bic}</>}</div></footer>
 </article></main>
}
