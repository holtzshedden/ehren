import {NextResponse} from "next/server";
import {auth,clerkClient} from "@clerk/nextjs/server";
import {sql} from "../../../../../lib/db";

export async function POST(r:Request){
  try{
    const {userId}=await auth();
    if(!userId)return NextResponse.json({error:"Nicht autorisiert"},{status:401});
    const c=await clerkClient(),u=await c.users.getUser(userId);
    if(u.publicMetadata?.ehrenmann!==true)return NextResponse.json({error:"Nicht autorisiert"},{status:403});

    const b=await r.json();
    const pid=Number(b.product_id),q=Number(b.quantity),cost=Number(b.unit_cost),wh=Number(b.warehouse_id);
    const supplier=b.supplier_id?Number(b.supplier_id):null;
    const cc=b.cost_center_id?Number(b.cost_center_id):null;
    const date=String(b.date||"").trim(),note=String(b.note||"").trim()||null,batch=String(b.batch_number||"").trim()||null;

    if(!pid||!q||q<=0||!Number.isFinite(cost)||cost<0||!wh||!supplier||!date)
      return NextResponse.json({error:"Produkt, Menge, Preis / Einheit, Lieferant, Lagerort und Datum sind Pflichtfelder."},{status:400});

    const [p]=await sql`SELECT id FROM products WHERE id=${pid} AND active=true`;
    const [w]=await sql`SELECT id FROM address_book WHERE id=${wh} AND active=true AND 'warehouse'=ANY(types)`;
    const [s]=await sql`SELECT id FROM address_book WHERE id=${supplier} AND active=true AND 'supplier'=ANY(types)`;
    if(!p||!w||!s)return NextResponse.json({error:"Produkt, Lagerort oder Lieferant ungültig."},{status:400});

    let batchId=null;
    if(batch){
      const old=await sql`SELECT id FROM product_batches WHERE product_id=${pid} AND batch_number=${batch} LIMIT 1`;
      if(old.length)batchId=old[0].id;
      else{
        const[x]=await sql`INSERT INTO product_batches(product_id,batch_number,unit_cost,supplier_address_id,received_date) VALUES(${pid},${batch},${cost},${supplier},${date}) RETURNING id`;
        batchId=x.id;
      }
    }

    const name=u.fullName||u.firstName||u.primaryEmailAddress?.emailAddress||"User";
    const[m]=await sql`
      INSERT INTO warehouse_movements(
        movement_date,movement_type,product_id,batch_id,quantity,unit_cost,
        destination_location_id,cost_center_id,note,created_by_clerk_user_id,created_by_name
      )
      VALUES(${date},'IN',${pid},${batchId},${q},${cost},${wh},${cc},${note},${userId},${name})
      RETURNING id
    `;
    return NextResponse.json({ok:true,movementId:m.id});
  }catch(e){
    console.error("WAREHOUSE_INCOMING_ERROR",e);
    return NextResponse.json({error:"Wareneingang konnte nicht gespeichert werden."},{status:500});
  }
}
