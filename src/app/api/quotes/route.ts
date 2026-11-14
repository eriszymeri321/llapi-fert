import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { calculateQuote } from "@/lib/pricing";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  email: z.string().trim().email().max(254),
  product: z.uuid(),
  quantity: z.coerce.number().int().min(1).max(100000),
  specifications: z.record(z.string(), z.string()).default({}),
  message: z.string().trim().max(2000).optional().nullable()
});

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ message: "Pamja paraprake është aktive. Lidhni Neon për të pranuar dhe ruajtur kërkesa." }, { status: 503 });
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Kontrolloni të dhënat dhe dimensionet e formularit." }, { status: 400 });
    const values = parsed.data;
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const found = await client.query("SELECT id,slug FROM products WHERE id=$1 AND active=true", [values.product]);
      const product = found.rows[0];
      if (!product) {
        await client.query("ROLLBACK");
        return NextResponse.json({ message: "Produkti i zgjedhur nuk është i disponueshëm." }, { status: 400 });
      }
      const quote = calculateQuote(product.slug, values.quantity, values.specifications);
      if (!quote) {
        await client.query("ROLLBACK");
        return NextResponse.json({ message: "Dimensioni i zgjedhur nuk është i vlefshëm." }, { status: 400 });
      }
      const order = await client.query(
        "INSERT INTO orders(customer_name,phone,email,message) VALUES($1,$2,lower($3),$4) RETURNING id",
        [values.name, values.phone, values.email, values.message || null]
      );
      await client.query(
        "INSERT INTO order_items(order_id,product_id,quantity,specifications,unit_price,line_total) VALUES($1,$2,$3,$4::jsonb,$5,$6)",
        [order.rows[0].id, product.id, values.quantity, JSON.stringify(values.specifications), quote.unitPrice, quote.lineTotal]
      );
      await client.query("COMMIT");
      const total = quote.lineTotal === null ? "Çmimi do të konfirmohet nga ekipi." : `Vlerësimi: ${quote.lineTotal.toFixed(2).replace(".", ",")} €.`;
      return NextResponse.json({ message: `Kërkesa u dërgua me sukses. ${total} Do t'ju kontaktojmë së shpejti.`, quote }, { status: 201 });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Quote submission failed", error);
    return NextResponse.json({ message: "Kërkesa nuk u dërgua. Ju lutemi provoni përsëri më vonë." }, { status: 500 });
  }
}
