import {NextResponse} from "next/server";
import {auth,clerkClient} from "@clerk/nextjs/server";
import {sql} from "../../../../lib/db";

async function allowed(){const{userId}=await auth();if(!userId)return false;const c=await clerkClient(),u=await c.users.getUser(userId);return u.publicMetadata?.ehrenmann===true}
export async function GET(){
 if(!await allowed())return NextResponse.json({error:"Nicht autorisiert"},{status:403});
 const currentYear=new Date().getFullYear();
 const [warehouse]=await sql`SELECT COALESCE(SUM(CASE WHEN movement_type IN ('IN','RETURN') THEN quantity WHEN movement_type IN ('OUT','SALE','LOSS') THEN -quantity ELSE 0 END),0)::float8 units FROM warehouse_movements`;
 const stockRows=await sql`SELECT wm.product_id,wm.movement_type,wm.quantity::float8,wm.unit_cost::float8,wm.source_location_id,wm.destination_location_id FROM warehouse_movements wm ORDER BY wm.movement_date,wm.id`;
 const states=new Map<string,{q:number,v:number}>();const get=(p:number,l:number)=>{const k=`${p}:${l}`;if(!states.has(k))states.set(k,{q:0,v:0});return states.get(k)!};
 for(const r of stockRows as any[]){const p=+r.product_id,q=+r.quantity;if(!q)continue;if(['IN','RETURN'].includes(r.movement_type)){const l=+r.destination_location_id;if(!l)continue;const st=get(p,l);st.q+=q;st.v+=q*(+r.unit_cost||0)}else if(r.movement_type==='TRANSFER'){const a=+r.source_location_id,b=+r.destination_location_id;if(!a||!b)continue;const s=get(p,a),avg=s.q?s.v/s.q:0,m=Math.min(q,Math.max(s.q,0)),v=m*avg;s.q-=m;s.v-=v;const d=get(p,b);d.q+=m;d.v+=v}else if(['OUT','SALE','LOSS'].includes(r.movement_type)){const l=+r.source_location_id;if(!l)continue;const st=get(p,l),avg=st.q?st.v/st.q:0,m=Math.min(q,Math.max(st.q,0));st.q-=m;st.v-=m*avg}}
 const stockValue=[...states.values()].reduce((a,x)=>a+x.v,0);
 const [fin]=await sql`SELECT COALESCE(SUM(CASE WHEN transaction_type IN ('INCOME','CAPITAL_IN') THEN amount ELSE 0 END),0)::float8 income,COALESCE(SUM(CASE WHEN transaction_type IN ('EXPENSE','CAPITAL_OUT') THEN amount ELSE 0 END),0)::float8 expenses FROM financial_transactions WHERE EXTRACT(YEAR FROM transaction_date)=${currentYear}`;
 const [cash]=await sql`SELECT amount::float8,snapshot_date::text FROM finance_cash_snapshots ORDER BY snapshot_date DESC,id DESC LIMIT 1`;
 const wh=await sql`SELECT wm.id,wm.movement_date::text,wm.movement_type,p.name product_name,wm.quantity::float8,COALESCE(dest.name,da.name,sa.name,'–') location FROM warehouse_movements wm JOIN products p ON p.id=wm.product_id LEFT JOIN address_book dest ON dest.id=wm.destination_address_id LEFT JOIN address_book da ON da.id=wm.destination_location_id LEFT JOIN address_book sa ON sa.id=wm.source_location_id ORDER BY wm.movement_date DESC,wm.id DESC LIMIT 5`;
 const ft=await sql`SELECT ft.id,ft.transaction_date::text,ft.transaction_type,ft.amount::float8,cc.code cost_center_code,COALESCE(ab.name,ft.capital_person_name,'–') contact FROM financial_transactions ft LEFT JOIN cost_centers cc ON cc.id=ft.cost_center_id LEFT JOIN address_book ab ON ab.id=ft.address_book_id ORDER BY ft.transaction_date DESC,ft.id DESC LIMIT 5`;
 const monthly=await sql`WITH m AS (SELECT generate_series(date_trunc('month',CURRENT_DATE)-interval '11 months',date_trunc('month',CURRENT_DATE),interval '1 month') mon) SELECT to_char(m.mon,'YYYY-MM') month,COALESCE(SUM(CASE WHEN ft.transaction_type IN ('INCOME','CAPITAL_IN') THEN ft.amount ELSE 0 END),0)::float8 income,COALESCE(SUM(CASE WHEN ft.transaction_type IN ('EXPENSE','CAPITAL_OUT') THEN ft.amount ELSE 0 END),0)::float8 expenses FROM m LEFT JOIN financial_transactions ft ON date_trunc('month',ft.transaction_date)=m.mon GROUP BY m.mon ORDER BY m.mon`;
 return NextResponse.json({kpis:{stockUnits:+warehouse.units||0,stockValue,income:+fin.income||0,expenses:+fin.expenses||0,cash:cash?.amount??null,cashDate:cash?.snapshot_date??null},warehouse:wh,finance:ft,monthly});
}
