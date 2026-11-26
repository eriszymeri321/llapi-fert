"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { jsPDF } from "jspdf";

type Product = { id:string; name:string; slug:string; description:string; category_id:string; category_name:string; image_url:string; price:string|null; price_label:string; featured:boolean };
type Order = { id:string; customer_name:string; phone:string; email:string|null; business_number:string|null; location:string|null; message:string|null; status:string; created_at:string; items:{product_name:string;quantity:number;specifications:Record<string,string>;unit_price:string|null;line_total:string|null}[] };

function whatsappUrl(order:Order) {
  let phone = order.phone.replace(/\D/g, "");
  if (phone.startsWith("00")) phone = phone.slice(2);
  if (phone.startsWith("0")) phone = `383${phone.slice(1)}`;
  const text = `Përshëndetje ${order.customer_name}, porosia ka përfunduar dhe është në proces të ardhjes. Të gjitha të mirat nga Llapi Fert.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function formatOrderDate(value:string) {
  return new Intl.DateTimeFormat("sq-AL", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Belgrade" }).format(new Date(value));
}

function formatSpecification(value:Record<string,string>) {
  const labels:Record<string,string> = { diameter_mm:"Diametri", length_m:"Gjatësia", width_cm:"Gjerësia", height_cm:"Lartësia", thickness_cm:"Trashësia" };
  return Object.entries(value || {}).map(([key, detail]) => `${labels[key] || key.replaceAll("_", " ")}: ${detail}${key === "diameter_mm" ? " mm" : key === "length_m" ? " m" : key.endsWith("_cm") ? " cm" : ""}`).join(" · ");
}

async function createOrderPdf(order:Order) {
  const pdf = new jsPDF({ unit:"mm", format:"a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 16;
  const orange = [233, 134, 50] as [number, number, number];
  const dark = [20, 22, 24] as [number, number, number];
  const money = (value:string|null) => value === null ? "Konfirmohet nga ekipi" : `${Number(value).toFixed(2).replace(".",",")} €`;
  const date = (value:string|Date) => new Intl.DateTimeFormat("sq-AL", { dateStyle:"long", timeStyle:"short", timeZone:"Europe/Belgrade" }).format(new Date(value));
  const drawHeader = async (continued = false) => {
    pdf.setFillColor(...dark); pdf.rect(0,0,pageWidth,43,"F");
    pdf.setFillColor(...orange); pdf.rect(0,42,pageWidth,2,"F");
    try {
      const response = await fetch("/images/logo.png");
      const logoBlob = await response.blob();
      const logo = await new Promise<string>((resolve,reject) => { const reader=new FileReader(); reader.onload=()=>resolve(String(reader.result)); reader.onerror=()=>reject(reader.error); reader.readAsDataURL(logoBlob); });
      pdf.addImage(logo,"PNG",margin,8,32,25);
    } catch { pdf.setTextColor(255,255,255); pdf.setFont("helvetica","bold"); pdf.setFontSize(15); pdf.text("LLAPI FERT",margin,23); }
    pdf.setTextColor(255,255,255); pdf.setFont("helvetica","bold"); pdf.setFontSize(17); pdf.text(continued?"DETAJET E POROSISË":"FLETËPËRMBLEDHJE E POROSISË",pageWidth-margin,17,{align:"right"});
    pdf.setFont("helvetica","normal"); pdf.setFontSize(9); pdf.setTextColor(225,225,225); pdf.text(`Nr. LF-${order.id.slice(0,8).toUpperCase()}`,pageWidth-margin,25,{align:"right"});
    pdf.text(`Dokumenti u krijua: ${date(new Date())}`,pageWidth-margin,32,{align:"right"});
  };
  await drawHeader();
  let y = 55;
  pdf.setTextColor(...dark); pdf.setFont("helvetica","bold"); pdf.setFontSize(12); pdf.text("Të dhënat e porosisë",margin,y);
  y += 7; pdf.setDrawColor(...orange); pdf.setLineWidth(.6); pdf.line(margin,y,pageWidth-margin,y); y += 8;
  pdf.setFontSize(9); pdf.setFont("helvetica","bold"); pdf.text("Kompania / klienti",margin,y); pdf.text("Data dhe ora e porosisë",pageWidth/2+4,y);
  y += 5; pdf.setFont("helvetica","normal"); pdf.setFontSize(10); pdf.text(order.customer_name,margin,y); pdf.text(date(order.created_at),pageWidth/2+4,y);
  y += 8; pdf.setFont("helvetica","bold"); pdf.setFontSize(9); pdf.text("Telefoni",margin,y); pdf.text("Nr. biznesit",pageWidth/2+4,y);
  y += 5; pdf.setFont("helvetica","normal"); pdf.setFontSize(10); pdf.text(order.phone,margin,y); pdf.text(order.business_number||"—",pageWidth/2+4,y);
  y += 8; pdf.setFont("helvetica","bold"); pdf.setFontSize(9); pdf.text("Lokacioni",margin,y);
  y += 5; pdf.setFont("helvetica","normal"); pdf.setFontSize(10); pdf.text(order.location||"—",margin,y,{maxWidth:pageWidth-margin*2});
  y += 12; pdf.setFont("helvetica","bold"); pdf.setFontSize(12); pdf.text("Artikujt e porositur",margin,y);
  y += 6; pdf.setFillColor(...dark); pdf.rect(margin,y,pageWidth-margin*2,8,"F"); pdf.setTextColor(255,255,255); pdf.setFontSize(8); pdf.text("PRODUKTI / DIMENSIONET",margin+3,y+5.3); pdf.text("SASIA",pageWidth-63,y+5.3); pdf.text("NJËSIA",pageWidth-45,y+5.3); pdf.text("NËNTOTALI",pageWidth-margin-3,y+5.3,{align:"right"});
  y += 12; pdf.setTextColor(...dark);
  for (const item of order.items) {
    const specs=formatSpecification(item.specifications||{});
    const detail=specs?`${item.product_name} · ${specs}`:item.product_name;
    const lines=pdf.splitTextToSize(detail,pageWidth-2*margin-66) as string[];
    const rowHeight=Math.max(13,lines.length*4.5+5);
    if(y+rowHeight>260){pdf.addPage();await drawHeader(true);y=55;}
    if(order.items.indexOf(item)%2===0){pdf.setFillColor(248,246,243);pdf.rect(margin,y-4,pageWidth-margin*2,rowHeight,"F");}
    pdf.setFont("helvetica","normal");pdf.setFontSize(8.5);pdf.text(lines,margin+3,y);
    pdf.text(String(item.quantity),pageWidth-63,y);
    const unit=money(item.unit_price);pdf.text(unit.length>14?"—":unit,pageWidth-45,y);
    pdf.text(money(item.line_total),pageWidth-margin-3,y,{align:"right"});
    y+=rowHeight;
  }
  if(y+39>270){pdf.addPage();await drawHeader(true);y=55;}
  y+=3;pdf.setDrawColor(...orange);pdf.setLineWidth(.6);pdf.line(pageWidth-84,y,pageWidth-margin,y);y+=8;
  pdf.setFont("helvetica","bold");pdf.setFontSize(11);pdf.setTextColor(...dark);pdf.text("Totali i porosisë",pageWidth-84,y);pdf.setTextColor(...orange);pdf.text(order.items.every(item=>item.line_total!==null)?money(String(order.items.reduce((sum,item)=>sum+Number(item.line_total),0))):"Konfirmohet nga ekipi",pageWidth-margin,y,{align:"right"});
  if(order.message){y+=12;pdf.setTextColor(...dark);pdf.setFont("helvetica","bold");pdf.setFontSize(9);pdf.text("Kërkesa / shënimi i klientit",margin,y);y+=5;pdf.setFont("helvetica","normal");pdf.setFontSize(9);const msg=pdf.splitTextToSize(order.message,pageWidth-margin*2) as string[];pdf.text(msg,margin,y);y+=msg.length*4.5;}
  const noteY=Math.min(Math.max(y+12,245),263);
  pdf.setFillColor(248,243,237);pdf.roundedRect(margin,noteY,pageWidth-margin*2,22,2,2,"F");pdf.setFillColor(...orange);pdf.rect(margin,noteY,2,22,"F");
  pdf.setTextColor(...dark);pdf.setFont("helvetica","bold");pdf.setFontSize(8.5);pdf.text("NJOFTIM",margin+7,noteY+7);
  pdf.setFont("helvetica","normal");pdf.setFontSize(8);pdf.text(pdf.splitTextToSize("Ky dokument është vetëm përmbledhje e porosisë dhe nuk përbën faturë. Faturën e rregullt do ta pranoni me dorëzimin e porosisë.",pageWidth-margin*2-14) as string[],margin+7,noteY+13);
  pdf.setTextColor(120,120,120);pdf.setFontSize(7);pdf.text("Llapi Fert · Faleminderit për besimin tuaj",pageWidth/2,292,{align:"center"});
  pdf.save(`Llapi-Fert-Porosia-${order.id.slice(0,8)}.pdf`);
}

export default function AdminPanel({ products, categories, orders }: { products:Product[]; categories:{id:string;name:string}[]; orders:Order[] }) {
  const [notice,setNotice] = useState(""); const [edit,setEdit] = useState<Product|null>(null); const [tab,setTab] = useState("products"); const [orderStatuses,setOrderStatuses] = useState<Record<string,string>>(() => Object.fromEntries(orders.map(order=>[order.id,order.status])));
  async function productSubmit(e:React.FormEvent<HTMLFormElement>) { e.preventDefault(); const f=new FormData(e.currentTarget), body={name:f.get("name"),slug:f.get("slug"),description:f.get("description"),category_id:f.get("category_id"),image_url:f.get("image_url"),price:f.get("price")||null,price_label:f.get("price_label"),featured:f.get("featured")==="on"}; const r=await fetch("/api/admin/products",{method:edit?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(edit?{...body,id:edit.id}:body)}); const d=await r.json(); setNotice(d.message); if(r.ok)location.reload(); }
  async function remove(id:string) { if(!confirm("Të çaktivizohet ky produkt?"))return; const r=await fetch(`/api/admin/products?id=${id}`,{method:"DELETE"}); setNotice((await r.json()).message); if(r.ok)location.reload(); }
  async function status(id:string,value:string,order?:Order) { if(value==="completed"&&order)window.open(whatsappUrl(order),"_blank","noopener,noreferrer"); const r=await fetch("/api/admin/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status:value})}); const result=await r.json(); if(r.ok)setOrderStatuses(current=>({...current,[id]:value})); if(r.ok&&value==="completed"&&order){try{await createOrderPdf(order);setNotice(`${result.message} Përmbledhja e porosisë u shkarkua si PDF.`);}catch{setNotice(`${result.message} PDF-ja nuk u krijua; provo përsëri.`);}}else setNotice(result.message); }
  return <div className="admin-shell">
    <div className="admin-head"><div><span className="eyebrow">MENAXHIMI</span><h1>Paneli i administratorit</h1></div><button className="button button-outline" onClick={()=>signOut({callbackUrl:"/"})}>Dil nga llogaria</button></div>
    <div className="admin-tabs"><button className={tab==="products"?"active":""} onClick={()=>setTab("products")}>Produktet ({products.length})</button><button className={tab==="orders"?"active":""} onClick={()=>setTab("orders")}>Porositë ({orders.length})</button></div>
    {notice&&<p className="form-message">{notice}</p>}
    {tab==="products"?<div className="admin-columns"><div className="admin-list"><h2>Produktet në katalog</h2>{products.map(p=><div className="admin-item" key={p.id}><div><b>{p.name}</b><small>{p.category_name} · /{p.slug}</small></div><div><button onClick={()=>{setEdit(p);window.scrollTo({top:0,behavior:"smooth"})}}>Ndrysho</button><button className="danger" onClick={()=>remove(p.id)}>Fshi</button></div></div>)}</div>
      <form className="quote-form admin-form" onSubmit={productSubmit}><h2>{edit?"Ndrysho produktin":"Shto produkt"}</h2><label>Emri<input required name="name" defaultValue={edit?.name}/></label><label>Slug<input required name="slug" pattern="[a-z0-9-]+" defaultValue={edit?.slug} placeholder="gypa-betoni"/></label><label>Përshkrimi<textarea required name="description" defaultValue={edit?.description}/></label><label>Kategoria<select required name="category_id" defaultValue={edit?.category_id||""}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Rruga e fotos<input required name="image_url" defaultValue={edit?.image_url||"/images/gypa-betoni.jpg"}/></label><label>Çmimi (opsional)<input type="number" step="0.01" min="0" name="price" defaultValue={edit?.price||""}/></label><label>Etiketa e çmimit<input required name="price_label" defaultValue={edit?.price_label||"Çmimi konfirmohet nga ekipi"}/></label><label className="check-label"><input type="checkbox" name="featured" defaultChecked={edit?.featured}/> Produkt i veçuar</label><div className="admin-actions"><button className="button button-dark">{edit?"Ruaj ndryshimet":"Shto produkt"} ↗</button>{edit&&<button type="button" className="button button-outline" onClick={()=>setEdit(null)}>Anulo</button>}</div></form></div>
    :<div className="orders-list">{orders.length?orders.map(o=><article className="order-card" key={o.id}>
      <div className="order-top"><div><span className="eyebrow">Pranuar më {formatOrderDate(o.created_at)}</span><h3>{o.customer_name}</h3></div><select aria-label="Statusi i porosisë" value={orderStatuses[o.id]||o.status} onChange={e=>status(o.id,e.target.value,o)}><option value="new">E re</option><option value="contacted">Kontaktuar</option><option value="processing">Në proces</option><option value="completed">Përfunduar</option><option value="shipped">Nisur / në rrugë</option><option value="cancelled">Anuluar</option></select></div>
      <p>Tel: {o.phone} · Nr. biznesit: {o.business_number||"—"}</p><p>Lokacioni: {o.location||"—"}</p>
      <div className="admin-order-items"><strong>Detajet e porosisë</strong>{o.items.map((i,index)=><div className="admin-order-line" key={`${o.id}-${index}`}><b>{i.product_name}</b><span>Sasia: {i.quantity}</span>{formatSpecification(i.specifications)&&<span>{formatSpecification(i.specifications)}</span>}<span>Çmimi për njësi: {i.unit_price!==null?`${Number(i.unit_price).toFixed(2).replace(".",",")} €`:"Konfirmohet nga ekipi"} · Nëntotali: {i.line_total!==null?`${Number(i.line_total).toFixed(2).replace(".",",")} €`:"Konfirmohet nga ekipi"}</span></div>)}</div>
      <p><strong>Totali:</strong> {o.items.every(i=>i.line_total!==null)?`${o.items.reduce((sum,i)=>sum+Number(i.line_total),0).toFixed(2).replace(".",",")} €`:"Konfirmohet nga ekipi"}</p>{o.message&&<blockquote><strong>Kërkesa / shënimi i klientit:</strong><br/>{o.message}</blockquote>}
      {(orderStatuses[o.id]||o.status)==="completed"&&<a className="button button-outline whatsapp-link" target="_blank" rel="noreferrer" href={whatsappUrl(o)}>Hap mesazhin në WhatsApp ↗</a>}
    </article>) : <div className="empty-state">Nuk ka porosi ende.</div>}</div>}
  </div>;
}
