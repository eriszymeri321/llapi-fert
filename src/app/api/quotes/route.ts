import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { calculateQuote } from "@/lib/pricing";

const schema = z.object({
  companyName: z.string().trim().min(2).max(120),
  businessNumber: z.string().trim().min(3).max(40),
  phone: z.string().trim().min(6).max(40),
  location: z.string().trim().min(2).max(200),
  whatsappOptIn: z.literal(true),
  items: z.array(z.object({ product: z.uuid(), quantity: z.coerce.number().int().min(1).max(100000), specifications: z.record(z.string(), z.string()).default({}) })).min(1).max(50),
  message: z.string().trim().max(2000).optional().nullable()
});

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ message: "Pamja paraprake është aktive. Lidhni Neon për të pranuar dhe ruajtur porosi." }, { status: 503 });
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Kontrolloni të dhënat e kompanisë dhe dimensionet e porosisë." }, { status: 400 });
    const values = parsed.data;
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const productIds = values.items.map(item => item.product).filter((id, index, all) => all.indexOf(id) === index);
      const found = await client.query("SELECT id,slug FROM products WHERE id=ANY($1::uuid[]) AND active=true", [productIds]);
      const products = new Map<string, { id: string; slug: string }>(found.rows.map((product: { id: string; slug: string }) => [product.id, product]));
      const pricedItems = values.items.map(item => {
        const product = products.get(item.product);
        return product ? { item, product, quote: calculateQuote(product.slug, item.quantity, item.specifications) } : null;
      });
      if (pricedItems.some(item => !item || !item.quote)) {
        await client.query("ROLLBACK");
        return NextResponse.json({ message: "Një produkt ose dimension nuk është i vlefshëm." }, { status: 400 });
      }
      const order = await client.query(
        "INSERT INTO orders(customer_name,phone,email,message,business_number,location,whatsapp_opt_in) VALUES($1,$2,NULL,$3,$4,$5,$6) RETURNING id",
        [values.companyName, values.phone, values.message || null, values.businessNumber, values.location, values.whatsappOptIn]
      );
      for (const entry of pricedItems) {
        if (!entry) continue;
        await client.query(
          "INSERT INTO order_items(order_id,product_id,quantity,specifications,unit_price,line_total) VALUES($1,$2,$3,$4::jsonb,$5,$6)",
          [order.rows[0].id, entry.product.id, entry.item.quantity, JSON.stringify(entry.item.specifications), entry.quote!.unitPrice, entry.quote!.lineTotal]
        );
      }
      await client.query("COMMIT");
      const total = pricedItems.every(item => item?.quote?.lineTotal !== null)
        ? `Vlerësimi i porosisë: ${pricedItems.reduce((sum, item) => sum + (item?.quote?.lineTotal || 0), 0).toFixed(2).replace(".", ",")} €.`
        : "Çmimi për disa dimensione do të konfirmohet nga ekipi.";
      return NextResponse.json({ message: `Porosia u dërgua me sukses. ${total} Do t'ju kontaktojmë së shpejti.` }, { status: 201 });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  } catch (error) {
    console.error("Order submission failed", error);
    return NextResponse.json({ message: "Porosia nuk u dërgua. Ju lutemi provoni përsëri më vonë." }, { status: 500 });
  }
}
