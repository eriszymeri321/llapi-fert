import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendOrderCompletionMessage } from "@/lib/whatsapp";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return (session?.user as { role?: string } | undefined)?.role === "admin";
}

const schema = z.object({ id: z.uuid(), status: z.enum(["new", "contacted", "processing", "completed", "shipped", "cancelled"]) });

export async function PATCH(req: Request) {
  if (!await isAdmin()) return NextResponse.json({ message: "Nuk keni autorizim." }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Të dhënat nuk janë të vlefshme." }, { status: 400 });

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const found = await client.query("SELECT customer_name,phone,status,whatsapp_opt_in,completion_message_sent_at FROM orders WHERE id=$1 FOR UPDATE", [parsed.data.id]);
    const order = found.rows[0];
    if (!order) {
      await client.query("ROLLBACK");
      return NextResponse.json({ message: "Porosia nuk u gjet." }, { status: 404 });
    }

    await client.query("UPDATE orders SET status=$2,updated_at=now() WHERE id=$1", [parsed.data.id, parsed.data.status]);
    if (parsed.data.status !== "completed" || order.completion_message_sent_at) {
      await client.query("COMMIT");
      return NextResponse.json({ message: parsed.data.status === "completed" ? "Porosia është përfunduar; mesazhi WhatsApp ishte dërguar më herët." : "Statusi u përditësua." });
    }

    if (!order.whatsapp_opt_in) {
      const error = "Klienti nuk ka dhënë pëlqimin për njoftime në WhatsApp.";
      await client.query("UPDATE orders SET completion_message_error=$2 WHERE id=$1", [parsed.data.id, error]);
      await client.query("COMMIT");
      return NextResponse.json({ message: `Porosia u përfundua. ${error}`, whatsappSent: false });
    }

    let result;
    try {
      result = await sendOrderCompletionMessage({ phone: order.phone, companyName: order.customer_name });
    } catch (error) {
      result = { sent: false as const, error: error instanceof Error ? error.message.slice(0, 400) : "Dërgimi në WhatsApp dështoi." };
    }
    if (result.sent) {
      await client.query("UPDATE orders SET completion_message_sent_at=now(),completion_message_id=$2,completion_message_error=NULL WHERE id=$1", [parsed.data.id, result.messageId]);
      await client.query("COMMIT");
      return NextResponse.json({ message: `Porosia u përfundua dhe mesazhi u dërgua automatikisht në WhatsApp të ${order.customer_name}.`, whatsappSent: true });
    }

    await client.query("UPDATE orders SET completion_message_error=$2 WHERE id=$1", [parsed.data.id, result.error]);
    await client.query("COMMIT");
    return NextResponse.json({ message: `Porosia u përfundua, por WhatsApp nuk u dërgua: ${result.error}`, whatsappSent: false });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Order status update failed", error);
    return NextResponse.json({ message: "Statusi nuk u përditësua." }, { status: 500 });
  } finally { client.release(); }
}
