"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

type AddressEntry = {
  id: number; customer_number: string; types: string[]; name: string; company: string | null;
  billing_street: string | null; billing_postal_code: string | null; billing_city: string | null; billing_country: string | null;
  delivery_same_as_billing: boolean; delivery_street: string | null; delivery_postal_code: string | null; delivery_city: string | null; delivery_country: string | null;
  contact_name: string | null; phone: string | null; email: string | null; notes: string | null; active: boolean;
};

type FormState = {
  types: string[]; name: string; company: string;
  billing_street: string; billing_postal_code: string; billing_city: string; billing_country: string;
  delivery_same_as_billing: boolean; delivery_street: string; delivery_postal_code: string; delivery_city: string; delivery_country: string;
  contact_name: string; phone: string; email: string; notes: string;
};

const TYPE_OPTIONS = [
  ["customer","Kunde"],["buddy","Buddy"],["supplier","Lieferant"],["event","Event"],
  ["warehouse","Lager"],["service_provider","Dienstleister"],["person","Person"],["other","Sonstiges"],
] as const;

const EMPTY_FORM: FormState = {
  types:["customer"], name:"", company:"", billing_street:"", billing_postal_code:"", billing_city:"", billing_country:"Deutschland",
  delivery_same_as_billing:true, delivery_street:"", delivery_postal_code:"", delivery_city:"", delivery_country:"Deutschland",
  contact_name:"", phone:"", email:"", notes:"",
};

const entryToForm = (e: AddressEntry): FormState => ({
  types:e.types?.length?e.types:["other"], name:e.name||"", company:e.company||"",
  billing_street:e.billing_street||"", billing_postal_code:e.billing_postal_code||"", billing_city:e.billing_city||"", billing_country:e.billing_country||"Deutschland",
  delivery_same_as_billing:e.delivery_same_as_billing, delivery_street:e.delivery_street||"", delivery_postal_code:e.delivery_postal_code||"", delivery_city:e.delivery_city||"", delivery_country:e.delivery_country||"Deutschland",
  contact_name:e.contact_name||"", phone:e.phone||"", email:e.email||"", notes:e.notes||"",
});

const formatAddress = (street:string|null, postal:string|null, city:string|null) =>
  [[street].filter(Boolean).join(""), [postal,city].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "–";

export default function AddressBookSection({onDirtyChange}:{onDirtyChange:(dirty:boolean)=>void}) {
  const [entries,setEntries]=useState<AddressEntry[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [showArchived,setShowArchived]=useState(false);
  const [editing,setEditing]=useState<AddressEntry|null>(null);
  const [creating,setCreating]=useState(false);
  const [form,setForm]=useState<FormState>(EMPTY_FORM);
  const [initialForm,setInitialForm]=useState<FormState>(EMPTY_FORM);
  const [saving,setSaving]=useState(false);
  const [confirmAction,setConfirmAction]=useState<null|{kind:"archive"|"delete"|"restore";entry:AddressEntry}>(null);

  const dirty=useMemo(()=>(creating||editing!==null)&&JSON.stringify(form)!==JSON.stringify(initialForm),[creating,editing,form,initialForm]);
  useEffect(()=>onDirtyChange(dirty),[dirty,onDirtyChange]);
  useEffect(()=>{const fn=(e:BeforeUnloadEvent)=>{if(!dirty)return;e.preventDefault();e.returnValue="";};window.addEventListener("beforeunload",fn);return()=>window.removeEventListener("beforeunload",fn);},[dirty]);

  const loadEntries=useCallback(async()=>{
    setLoading(true); setError("");
    try{
      const r=await fetch(`/api/backend/addressbook?archived=${showArchived?"1":"0"}`,{cache:"no-store"});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||"Adressbuch konnte nicht geladen werden.");
      setEntries(d.entries||[]);
    }catch(e){setError(e instanceof Error?e.message:"Unbekannter Fehler");}finally{setLoading(false);}
  },[showArchived]);
  useEffect(()=>{void loadEntries();},[loadEntries]);

  const openCreate=()=>{const f={...EMPTY_FORM,types:[...EMPTY_FORM.types]};setForm(f);setInitialForm(f);setEditing(null);setCreating(true);};
  const openEdit=(e:AddressEntry)=>{const f=entryToForm(e);setForm(f);setInitialForm(f);setEditing(e);setCreating(false);};
  const requestClose=()=>{if(dirty&&!window.confirm("Achtung: Deine Änderungen wurden noch nicht gespeichert. Änderungen verwerfen?"))return;setEditing(null);setCreating(false);onDirtyChange(false);};
  const update=<K extends keyof FormState>(key:K,value:FormState[K])=>setForm(c=>({...c,[key]:value}));
  const toggleType=(type:string)=>setForm(c=>{const t=c.types.includes(type)?c.types.filter(x=>x!==type):[...c.types,type];return{...c,types:t.length?t:["other"]};});

  const save=async()=>{
    if(!form.name.trim()){setError("Name / Firma ist ein Pflichtfeld.");return;}
    setSaving(true);setError("");
    try{
      const r=await fetch(editing?`/api/backend/addressbook/${editing.id}`:"/api/backend/addressbook",{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const d=await r.json();if(!r.ok)throw new Error(d.error||"Speichern fehlgeschlagen.");
      setEditing(null);setCreating(false);onDirtyChange(false);await loadEntries();
    }catch(e){setError(e instanceof Error?e.message:"Unbekannter Fehler");}finally{setSaving(false);}
  };

  const executeAction=async()=>{
    if(!confirmAction)return; const {kind,entry}=confirmAction; setSaving(true);setError("");
    try{
      const r=await fetch(`/api/backend/addressbook/${entry.id}`,{method:kind==="delete"?"DELETE":"PATCH",headers:kind==="delete"?undefined:{"Content-Type":"application/json"},body:kind==="delete"?undefined:JSON.stringify({active:kind==="restore"})});
      const d=await r.json();if(!r.ok)throw new Error(d.error||"Aktion fehlgeschlagen.");setConfirmAction(null);await loadEntries();
    }catch(e){setConfirmAction(null);setError(e instanceof Error?e.message:"Unbekannter Fehler");}finally{setSaving(false);}
  };

  return <>
    <section className="addressbook-section">
      <div className="addressbook-toolbar">
        <div><span className="backend-section-kicker">STAMMDATEN</span><h2>Geschäftspartner & Kontakte</h2></div>
        <div className="addressbook-toolbar-actions">
          <button className={`backend-secondary-action ${showArchived?"active":""}`} onClick={()=>setShowArchived(v=>!v)}>{showArchived?"Aktive anzeigen":"Archiv anzeigen"}</button>
          <button className="backend-primary-action" onClick={openCreate}>+ Neuer Eintrag</button>
        </div>
      </div>
      {error&&<div className="backend-inline-alert">{error}</div>}
      <div className="backend-table-wrap addressbook-table-wrap"><table className="backend-table addressbook-table">
        <thead><tr><th>Kundennr.</th><th>Typ</th><th>Name</th><th>Rechnungsadresse</th><th>Lieferadresse</th><th>Kontakt</th><th>Telefon</th><th>E-Mail</th><th>Status</th><th></th></tr></thead>
        <tbody>{loading?<tr><td colSpan={10}>Adressbuch wird geladen …</td></tr>:entries.length===0?<tr><td colSpan={10}>Noch keine Einträge vorhanden.</td></tr>:entries.map(e=><tr key={e.id}>
          <td className="backend-number">{e.customer_number}</td>
          <td><div className="addressbook-types">{e.types.map(t=><span key={t}>{TYPE_OPTIONS.find(([v])=>v===t)?.[1]||t}</span>)}</div></td>
          <td><strong className="backend-product-name">{e.name}</strong>{e.company&&e.company!==e.name?<small className="addressbook-subline">{e.company}</small>:null}</td>
          <td>{formatAddress(e.billing_street,e.billing_postal_code,e.billing_city)}</td>
          <td>{e.delivery_same_as_billing?<span className="addressbook-muted">wie Rechnung</span>:formatAddress(e.delivery_street,e.delivery_postal_code,e.delivery_city)}</td>
          <td>{e.contact_name||"–"}</td><td>{e.phone||"–"}</td><td>{e.email||"–"}</td>
          <td><span className={`addressbook-status ${e.active?"active":"archived"}`}>{e.active?"Aktiv":"Archiviert"}</span></td>
          <td><div className="addressbook-row-actions"><button onClick={()=>openEdit(e)}>Bearbeiten</button><button onClick={()=>setConfirmAction({kind:e.active?"archive":"restore",entry:e})}>{e.active?"Archivieren":"Reaktivieren"}</button><button className="danger" onClick={()=>setConfirmAction({kind:"delete",entry:e})}>Löschen</button></div></td>
        </tr>)}</tbody>
      </table></div>
    </section>

    {(creating||editing)&&<div className="backend-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)requestClose();}}><div className="backend-modal addressbook-modal">
      <div className="backend-modal-head"><div><span className="backend-section-kicker">ADRESSBUCH</span><h2>{editing?"Eintrag bearbeiten":"Neuer Eintrag"}</h2>{editing&&<small className="addressbook-customer-number">{editing.customer_number}</small>}</div><button className="backend-modal-close" onClick={requestClose}>×</button></div>
      <div className="addressbook-form">
        <div className="addressbook-form-block backend-form-full"><span className="addressbook-form-label">Typ</span><div className="addressbook-type-picker">{TYPE_OPTIONS.map(([v,l])=><button key={v} type="button" className={form.types.includes(v)?"active":""} onClick={()=>toggleType(v)}>{l}</button>)}</div></div>
        <label><span>Name / Firma *</span><input value={form.name} onChange={e=>update("name",e.target.value)}/></label>
        <label><span>Zusatz / Firmenname</span><input value={form.company} onChange={e=>update("company",e.target.value)}/></label>
        <div className="addressbook-form-block backend-form-full"><span className="addressbook-form-label">Rechnungsadresse</span></div>
        <label className="backend-form-full"><span>Straße + Hausnummer</span><input value={form.billing_street} onChange={e=>update("billing_street",e.target.value)}/></label>
        <label><span>PLZ</span><input value={form.billing_postal_code} onChange={e=>update("billing_postal_code",e.target.value)}/></label><label><span>Ort</span><input value={form.billing_city} onChange={e=>update("billing_city",e.target.value)}/></label>
        <label className="backend-form-full"><span>Land</span><input value={form.billing_country} onChange={e=>update("billing_country",e.target.value)}/></label>
        <div className="addressbook-form-block backend-form-full addressbook-delivery-head"><span className="addressbook-form-label">Lieferadresse</span><label className="addressbook-checkbox"><input type="checkbox" checked={form.delivery_same_as_billing} onChange={e=>update("delivery_same_as_billing",e.target.checked)}/><span>wie Rechnungsadresse</span></label></div>
        {!form.delivery_same_as_billing&&<><label className="backend-form-full"><span>Straße + Hausnummer</span><input value={form.delivery_street} onChange={e=>update("delivery_street",e.target.value)}/></label><label><span>PLZ</span><input value={form.delivery_postal_code} onChange={e=>update("delivery_postal_code",e.target.value)}/></label><label><span>Ort</span><input value={form.delivery_city} onChange={e=>update("delivery_city",e.target.value)}/></label><label className="backend-form-full"><span>Land</span><input value={form.delivery_country} onChange={e=>update("delivery_country",e.target.value)}/></label></>}
        <div className="addressbook-form-block backend-form-full"><span className="addressbook-form-label">Kontakt</span></div>
        <label><span>Ansprechpartner</span><input value={form.contact_name} onChange={e=>update("contact_name",e.target.value)}/></label><label><span>Telefon</span><input value={form.phone} onChange={e=>update("phone",e.target.value)}/></label>
        <label className="backend-form-full"><span>E-Mail</span><input type="email" value={form.email} onChange={e=>update("email",e.target.value)}/></label>
        <label className="backend-form-full"><span>Notiz</span><textarea value={form.notes} onChange={e=>update("notes",e.target.value)}/></label>
      </div>
      <div className="backend-modal-actions"><button className="backend-secondary-action" onClick={requestClose}>Abbrechen</button><button className="backend-primary-action" disabled={saving} onClick={()=>void save()}>{saving?"Speichert …":"Speichern"}</button></div>
    </div></div>}

    {confirmAction&&<div className="backend-modal-backdrop"><div className="backend-confirm-modal">
      <span className="backend-section-kicker">ACHTUNG</span><h3>{confirmAction.kind==="delete"?"Eintrag endgültig löschen?":confirmAction.kind==="archive"?"Eintrag archivieren?":"Eintrag reaktivieren?"}</h3>
      <p>{confirmAction.kind==="delete"?"Diese Aktion kann nicht rückgängig gemacht werden. Bereits verwendete Einträge können aus Sicherheitsgründen nicht gelöscht werden.":confirmAction.kind==="archive"?"Der Eintrag bleibt vollständig erhalten, wird aber in normalen Auswahllisten nicht mehr angezeigt.":"Der Eintrag wird wieder als aktiv geführt."}</p>
      <div className="backend-modal-actions"><button className="backend-secondary-action" onClick={()=>setConfirmAction(null)}>Abbrechen</button><button className="backend-primary-action" disabled={saving} onClick={()=>void executeAction()}>{confirmAction.kind==="delete"?"Endgültig löschen":confirmAction.kind==="archive"?"Archivieren":"Reaktivieren"}</button></div>
    </div></div>}
  </>;
}
