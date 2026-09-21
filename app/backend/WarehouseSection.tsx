"use client";
import React,{useCallback,useEffect,useState} from "react";
import {useUser} from "@clerk/nextjs";
type M={id:number;name:string;code?:string}; type S={product_id:number;product_name:string;category:string;unit:string;active:boolean;location_id:number;location_name:string;quantity:string;avg_unit_cost:string;selling_price:string;tax_rate?:string;gross_profit_unit:string;margin_percent:string|null;stock_value:string}; type R={id:number;movement_date:string;movement_type:string;product_name:string;batch_number:string|null;quantity:string;cost_center_code:string|null;source_location:string|null;destination_location:string|null;destination_name:string|null;supplier_name:string|null;note:string|null;user_name:string|null};
async function safeJson(r:Response){const t=await r.text();if(!t.trim())throw new Error(`Leere Serverantwort (HTTP ${r.status}).`);try{return JSON.parse(t)}catch{throw new Error(`Ungültige Serverantwort (HTTP ${r.status}).`)}}
const td=()=>new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10); const f=(n:number,d=2)=>new Intl.NumberFormat("de-DE",{minimumFractionDigits:d,maximumFractionDigits:d}).format(n); const ln=(x:string)=>({IN:"Wareneingang",OUT:"Ausbuchung",SALE:"Verkauf",TRANSFER:"Transfer",LOSS:"Bruch / Verlust"} as any)[x]||x;
export default function WarehouseSection(){const {user}=useUser();const [md,setMd]=useState<any>({products:[],costCenters:[],suppliers:[],warehouses:[],destinations:[]}),[stock,setStock]=useState<S[]>([]),[rows,setRows]=useState<R[]>([]),[years,setYears]=useState<number[]>([]),[stats,setStats]=useState({stockUnits:0,stockValue:0,incoming:0,outgoing:0}),[year,setYear]=useState(new Date().getFullYear()),[type,setType]=useState("ALL"),[limit,setLimit]=useState(5),[archive,setArchive]=useState(false),[modal,setModal]=useState<null|"incoming"|"outgoing"|"transfer">(null),[form,setForm]=useState<any>({}),[err,setErr]=useState("");
const load=useCallback(async()=>{setErr("");try{const [a,b,c]=await Promise.all([fetch("/api/backend/warehouse/masterdata",{cache:"no-store"}),fetch("/api/backend/warehouse/overview",{cache:"no-store"}),fetch(`/api/backend/warehouse/movements?year=${year}&type=${type}&limit=${limit}`,{cache:"no-store"})]);const [A,B,C]=await Promise.all([safeJson(a),safeJson(b),safeJson(c)]);if(!a.ok||!b.ok||!c.ok)return setErr(A.error||B.error||C.error||"Fehler");setMd(A);setStock(B.stock||[]);setYears(B.years||[]);setStats(B.stats||{stockUnits:0,stockValue:0,incoming:0,outgoing:0});setRows(C.movements||[])}catch(e){setErr(e instanceof Error?e.message:"Lager konnte nicht geladen werden.")}},[year,type,limit]);useEffect(()=>{void load()},[load]);
const [modalErr,setModalErr]=useState("");
const [saving,setSaving]=useState(false);const [detailMovement,setDetailMovement]=useState<R|null>(null);
const charge=async(id:number)=>{const r=await fetch(`/api/backend/warehouse/masterdata?nextChargeFor=${id}`,{cache:"no-store"}),d=await safeJson(r);if(!r.ok)throw new Error(d.error||"Charge konnte nicht ermittelt werden.");return d.nextCharge||""};
const open=async(k:any)=>{setErr("");setModalErr("");try{
  const firstStock=k==="outgoing"||k==="transfer"?stock.find((s:any)=>Number(s.quantity)>0):null;
  const p=firstStock?.product_id??md.products[0]?.id??"";
  const product=md.products.find((x:any)=>String(x.id)===String(p));
  const base={product_id:Number(p)||"",quantity:"",date:td(),note:""};
  if(k==="incoming")setForm({...base,batch_number:p?await charge(Number(p)):"",unit_cost:"",tax_rate:String(product?.tax_rate||19),shipping_net:"",shipping_tax_rate:"19",cost_center_id:Number(md.costCenters[0]?.id)||"",supplier_id:Number(md.suppliers[0]?.id)||"",warehouse_id:Number(md.warehouses[0]?.id)||""});
  if(k==="outgoing")setForm({...base,kind:"OUT",unit_price:String(product?.selling_price||0),tax_rate:String(product?.tax_rate||19),shipping_net:"",shipping_tax_rate:"19",cost_center_id:Number(md.costCenters[0]?.id)||"",destination_id:Number(md.destinations[0]?.id)||"",source_location_id:Number(firstStock?.location_id??md.warehouses[0]?.id)||""});if(k==="transfer")setForm({...base,source_location_id:md.warehouses[0]?.id||"",destination_location_id:md.warehouses[1]?.id||md.warehouses[0]?.id||""});setModal(k)}catch(e){setErr(e instanceof Error?e.message:"Dialog konnte nicht geöffnet werden.")}};
const incomingValid=modal==="incoming"&&+form.product_id>0&&+form.quantity>0&&form.unit_cost!==""&&+form.unit_cost>=0&&+form.cost_center_id>0&&+form.supplier_id>0&&+form.warehouse_id>0&&!!form.date;
const outgoingValid=modal==="outgoing"&&+form.product_id>0&&+form.quantity>0&&+form.cost_center_id>0&&+form.source_location_id>0&&+form.destination_id>0&&form.unit_price!==""&&+form.unit_price>=0&&form.tax_rate!==""&&+form.tax_rate>=0&&!!form.date&&!!stock.find((s:any)=>String(s.product_id)===String(form.product_id)&&String(s.location_id)===String(form.source_location_id)&&Number(s.quantity)>=Number(form.quantity));
const transferValid=modal==="transfer"&&+form.product_id>0&&+form.quantity>0&&+form.source_location_id>0&&+form.destination_location_id>0&&+form.source_location_id!==+form.destination_location_id&&!!form.date;
const canSubmit=incomingValid||outgoingValid||transferValid;
const submit=async()=>{if(!modal||!canSubmit||saving)return;setModalErr("");setSaving(true);try{const r=await fetch(`/api/backend/warehouse/${modal}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}),d=await safeJson(r);if(!r.ok){setModalErr(d.error||"Buchung fehlgeschlagen");return}setModal(null);setLimit(5);await load()}catch(e){setModalErr(e instanceof Error?e.message:"Buchung fehlgeschlagen.")}finally{setSaving(false)}};
const selectedStock=modal==="outgoing"?stock.find(s=>String(s.product_id)===String(form.product_id)&&String(s.location_id)===String(form.source_location_id)):undefined;
const outgoingUnitCost=Number(selectedStock?.avg_unit_cost||0);
const outgoingPrice=Number(form.unit_price||0);
const outgoingQty=Number(form.quantity||0);
const outgoingRevenue=outgoingPrice*outgoingQty;
const outgoingCost=outgoingUnitCost*outgoingQty;
const outgoingProfit=outgoingRevenue-outgoingCost;
const outgoingMargin=outgoingPrice>0?((outgoingPrice-outgoingUnitCost)/outgoingPrice)*100:null;
const isLoss=modal==="outgoing"&&form.kind==="LOSS";
return <><section className="warehouse-kpis">{[["Bestand",f(stats.stockUnits,0),"Einheiten"],["Warenwert",f(stats.stockValue)+" €","aktueller Bestand"],["Wareneingänge",f(stats.incoming,0),"aktuelles Jahr"],["Ausgänge",f(stats.outgoing,0),"aktuelles Jahr"]].map(x=><article key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong><small>{x[2]}</small></article>)}</section><div className="warehouse-actions"><button className="backend-primary-action" onClick={()=>void open("incoming")}>+ Wareneingang</button><button className="backend-secondary-action" onClick={()=>void open("outgoing")}>− Ausbuchung</button><button className="backend-secondary-action" onClick={()=>void open("transfer")}>Transfer</button></div>{err&&<div className="backend-inline-alert warehouse-alert">{err}</div>}
<section className="backend-section"><div className="backend-section-head"><div><span className="backend-section-kicker">BESTAND</span><h2>Aktueller Lagerbestand</h2></div><button className="backend-secondary-action compact-button" onClick={()=>setArchive(v=>!v)}>{archive?"Aktiven Bestand anzeigen":"Archivierten Bestand anzeigen"}</button></div><div className="backend-table-wrap"><table className="backend-table"><thead><tr><th>Produkt</th><th>Kategorie</th><th>Bestand</th><th>Ø Einstand</th><th>Verkaufspreis</th><th>Rohertrag / Einheit</th><th>Marge</th><th>Warenwert</th><th>Lagerort</th><th>Status</th></tr></thead><tbody>{stock.filter(s=>archive?!s.active:s.active).map(s=><tr key={`${s.product_id}-${s.location_id}`}><td><strong>{s.product_name}</strong></td><td>{s.category}</td><td>{f(+s.quantity,0)} {s.unit}</td><td>{f(+s.avg_unit_cost)} €</td><td className="backend-number">{f(+s.selling_price)} €</td><td>{f(+s.gross_profit_unit)} €</td><td>{s.margin_percent===null?"–":`${f(+s.margin_percent,1)} %`}</td><td>{f(+s.stock_value)} €</td><td>{s.location_name}</td><td>{s.active?"Aktiv":"Archiviert"}</td></tr>)}</tbody></table></div></section>
<section className="backend-section">
<div className="backend-section-head">
  <div><span className="backend-section-kicker">ARCHIV</span><h2>Lagerbewegungen</h2></div>
  <div className="warehouse-filter-dummy">
    {["ALL","IN","OUT","SALE","TRANSFER","LOSS"].map(v=>
      <button key={v} className={type===v?"active":""} onClick={()=>{setType(v);setLimit(5)}}>
        {v==="ALL"?"Alle":ln(v)}
      </button>
    )}
  </div>
</div>
<div className="warehouse-year-tabs">
  {(years.length?years:[year]).map(y=>
    <button key={y} className={year===y?"active":""} onClick={()=>{setYear(y);setLimit(5)}}>{y}</button>
  )}
</div>
<div className="backend-table-wrap warehouse-movements-wrap">
<table className="backend-table warehouse-movements-table">
  <thead><tr>
    <th>Datum</th><th>Art</th><th>Produkt</th><th>Menge</th><th>Kostenstelle</th><th>Von / An</th><th>User</th><th className="warehouse-info-head"></th>
  </tr></thead>
  <tbody>
    {rows.length?rows.map(r=>
      <tr key={r.id}>
        <td>{new Date(r.movement_date+"T00:00:00").toLocaleDateString("de-DE")}</td>
        <td>{ln(r.movement_type)}</td>
        <td>{r.product_name}</td>
        <td>{r.movement_type==="IN"?"+ ":"- "}{f(+r.quantity,0)}</td>
        <td>{r.cost_center_code||"–"}</td>
        <td className="warehouse-route-cell">
          <div className="warehouse-route">
            <span
              className="warehouse-route-name"
              title={r.movement_type==="IN"?r.supplier_name||"–":r.source_location||"–"}
            >
              {r.movement_type==="IN"?r.supplier_name||"–":r.source_location||"–"}
            </span>
            <span className="warehouse-route-arrow" aria-hidden="true">→</span>
            <span
              className="warehouse-route-name"
              title={r.movement_type==="IN"?r.destination_location||"–":r.destination_name||r.destination_location||"–"}
            >
              {r.movement_type==="IN"?r.destination_location||"–":r.destination_name||r.destination_location||"–"}
            </span>
          </div>
        </td>
        <td>{r.user_name||"–"}</td>
        <td className="warehouse-info-cell">
          {(r.note||r.batch_number)&&
            <button type="button" className="warehouse-info-button" onClick={()=>setDetailMovement(r)} title="Details anzeigen" aria-label="Details anzeigen">i</button>
          }
        </td>
      </tr>
    ):<tr><td colSpan={8}>Keine Bewegungen vorhanden.</td></tr>}
  </tbody>
</table>
</div>
{rows.length>=limit&&
  <div className="warehouse-more"><button className="backend-secondary-action" onClick={()=>setLimit(v=>v+50)}>50 weitere anzeigen</button></div>
}
</section>
{modal&&<div className="backend-modal-backdrop"><div className="backend-modal"><div className="backend-modal-head"><div><span className="backend-section-kicker">LAGERBEWEGUNG</span><h2>{modal==="incoming"?"Wareneingang":modal==="outgoing"?"Ausbuchung":"Transfer"}</h2></div><button className="backend-modal-close" onClick={()=>setModal(null)}>×</button></div>{modalErr&&<div className="backend-inline-alert backend-modal-alert">{modalErr}</div>}<div className="backend-form-grid"><label><span>Produkt</span><select value={form.product_id} onChange={async e=>{const id=+e.target.value;setForm({...form,product_id:id,...(modal==="incoming"?{batch_number:await charge(id)}:modal==="outgoing"?{unit_price:String(md.products.find((x:any)=>String(x.id)===String(id))?.selling_price||0),tax_rate:String(md.products.find((x:any)=>String(x.id)===String(id))?.tax_rate||19)}:{})})}}>{md.products.map((p:M)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label><span>Menge</span><input type="number" min="0" value={form.quantity||""} onChange={e=>setForm({...form,quantity:e.target.value})}/></label>
{modal==="incoming"&&<><label><span>Lieferkosten netto</span><input type="number" min="0" step="0.01" value={form.shipping_net||""} onChange={e=>setForm({...form,shipping_net:e.target.value})}/></label><label><span>MwSt. Lieferkosten</span><select value={form.shipping_tax_rate||"19"} onChange={e=>setForm({...form,shipping_tax_rate:e.target.value})}><option value="19">19 %</option><option value="7">7 %</option><option value="0">0 %</option></select></label><label><span>MwSt.</span><select value={form.tax_rate||"19"} onChange={e=>setForm({...form,tax_rate:e.target.value})}><option value="19">19 %</option><option value="7">7 %</option><option value="0">0 %</option></select></label><label><span>Charge</span><input value={form.batch_number||""} onChange={e=>setForm({...form,batch_number:e.target.value})}/></label><label><span>Preis netto / Einheit</span><input type="number" step="0.0001" value={form.unit_cost||""} onChange={e=>setForm({...form,unit_cost:e.target.value})}/></label><label><span>Kostenstelle</span><select value={form.cost_center_id} onChange={e=>setForm({...form,cost_center_id:+e.target.value})}>{md.costCenters.map((x:M)=><option key={x.id} value={x.id}>{x.code}</option>)}</select></label><label><span>Lieferant</span><select value={form.supplier_id} onChange={e=>setForm({...form,supplier_id:+e.target.value})}><option value="">Bitte wählen</option>{md.suppliers.map((x:M)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label><span>Lagerort</span><select value={form.warehouse_id} onChange={e=>setForm({...form,warehouse_id:+e.target.value})}>{md.warehouses.map((x:M)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label></>}
{modal==="outgoing"&&<><label><span>Lieferkosten netto</span><input type="number" min="0" step="0.01" value={form.shipping_net||""} onChange={e=>setForm({...form,shipping_net:e.target.value})}/></label><label><span>MwSt. Lieferkosten</span><select value={form.shipping_tax_rate||"19"} onChange={e=>setForm({...form,shipping_tax_rate:e.target.value})}><option value="19">19 %</option><option value="7">7 %</option><option value="0">0 %</option></select></label><label><span>Preis netto / Einheit</span><input type="number" min="0" step="0.01" value={form.unit_price||"0"} onChange={e=>setForm({...form,unit_price:e.target.value})}/></label><label><span>Netto gesamt</span><input value={`${f((+form.quantity||0)*(+form.unit_price||0)+(+form.shipping_net||0))} €`} disabled/></label><label><span>MwSt.</span><select value={form.tax_rate||"19"} onChange={e=>setForm({...form,tax_rate:e.target.value})}><option value="19">19 %</option><option value="7">7 %</option><option value="0">0 %</option></select></label><label><span>Brutto gesamt</span><input value={`${f(((+form.quantity||0)*(+form.unit_price||0))*(1+(+form.tax_rate||0)/100)+(+form.shipping_net||0)*(1+(+form.shipping_tax_rate||0)/100))} €`} disabled/></label><label><span>Art</span><select value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})}><option value="OUT">Ausbuchung</option><option value="SALE">Verkauf</option><option value="LOSS">Bruch / Verlust</option></select></label><label><span>Kostenstelle</span><select value={form.cost_center_id} onChange={e=>setForm({...form,cost_center_id:+e.target.value})}>{md.costCenters.map((x:M)=><option key={x.id} value={x.id}>{x.code}</option>)}</select></label><label><span>Von Lager</span><select value={form.source_location_id} onChange={e=>setForm({...form,source_location_id:+e.target.value})}>{md.warehouses.map((x:M)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label><span>Ziel / Empfänger</span><select value={form.destination_id} onChange={e=>setForm({...form,destination_id:+e.target.value})}>{md.destinations.map((x:M)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label></>}
{modal==="outgoing"&&
  <div className="warehouse-margin-preview backend-form-full">
    {isLoss?<>
      <div><span>Ø Einstand</span><strong>{f(outgoingUnitCost)} €</strong></div>
      <div><span>Warenwertverlust</span><strong>{f(outgoingCost)} €</strong></div>
      <div className="warehouse-margin-preview-wide"><span>Hinweis</span><strong>Bruch / Verlust wird zum Einstand bewertet.</strong></div>
    </>:<>
      <div><span>Ø Einstand</span><strong>{f(outgoingUnitCost)} €</strong></div>
      <div><span>Rohertrag / Einheit</span><strong>{f(outgoingPrice-outgoingUnitCost)} €</strong></div>
      <div><span>Marge</span><strong>{outgoingMargin===null?"–":`${f(outgoingMargin,1)} %`}</strong></div>
      <div><span>Rohertrag gesamt</span><strong>{f(outgoingProfit)} €</strong></div>
      {outgoingPrice===0&&<div className="warehouse-margin-preview-wide warehouse-zero-receipt"><span>Beleg</span><strong>0-€-Beleg · Warenwert zum Einstand: {f(outgoingCost)} €</strong></div>}
    </>}
  </div>
}{modal==="transfer"&&<><label><span>Von</span><select value={form.source_location_id} onChange={e=>setForm({...form,source_location_id:+e.target.value})}>{md.warehouses.map((x:M)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label><span>Nach</span><select value={form.destination_location_id} onChange={e=>setForm({...form,destination_location_id:+e.target.value})}>{md.warehouses.map((x:M)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label><span>Verantwortlich</span><input value={user?.fullName||user?.firstName||""} disabled/></label></>}
<label><span>Datum</span><input type="date" value={form.date||td()} onChange={e=>setForm({...form,date:e.target.value})}/></label><label className="backend-form-full"><span>Notiz</span><textarea value={form.note||""} onChange={e=>setForm({...form,note:e.target.value})}/></label></div>{modal==="outgoing"&&!outgoingValid&&<div className="backend-modal-validation backend-form-full">Bitte Produkt, Menge, Netto-VK, MwSt., Kostenstelle, Lager und Empfänger vollständig auswählen. Die Menge darf den verfügbaren Bestand nicht überschreiten.</div>}<div className="backend-modal-actions"><button className="backend-secondary-action" onClick={()=>setModal(null)}>Abbrechen</button><button className="backend-primary-action" disabled={!canSubmit||saving} onClick={()=>void submit()}>{saving?"Speichert …":modal==="incoming"?"Einbuchen":modal==="outgoing"?"Ausbuchen":"Transfer buchen"}</button></div></div></div>}{detailMovement&&<div className="backend-modal-backdrop"><div className="backend-confirm-modal warehouse-detail-modal"><div className="backend-modal-head"><div><span className="backend-section-kicker">LAGERBEWEGUNG</span><h3>Details</h3></div><button type="button" className="backend-modal-close" onClick={()=>setDetailMovement(null)}>×</button></div><div className="warehouse-detail-meta"><div><span>Datum</span><strong>{new Date(detailMovement.movement_date+"T00:00:00").toLocaleDateString("de-DE")}</strong></div><div><span>Art</span><strong>{ln(detailMovement.movement_type)}</strong></div><div><span>Produkt</span><strong>{detailMovement.product_name}</strong></div><div><span>Menge</span><strong>{detailMovement.movement_type==="IN"?"+ ":"- "}{f(+detailMovement.quantity,0)}</strong></div>{detailMovement.batch_number&&<div><span>Charge</span><strong>{detailMovement.batch_number}</strong></div>}<div className="warehouse-detail-wide"><span>Von / An</span><strong>{detailMovement.movement_type==="IN"?`${detailMovement.supplier_name||"–"} → ${detailMovement.destination_location||"–"}`:`${detailMovement.source_location||"–"} → ${detailMovement.destination_name||detailMovement.destination_location||"–"}`}</strong></div></div>{detailMovement.note&&<div className="warehouse-detail-note"><span>Notiz</span><p>{detailMovement.note}</p></div>}<div className="backend-modal-actions"><button type="button" className="backend-primary-action" onClick={()=>setDetailMovement(null)}>Schließen</button></div></div></div>}</>}
