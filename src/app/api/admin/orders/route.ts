import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return (session?.user as { role?: string } | undefined)?.role === "admin";
}

export async function PATCH(req: Request) {
  if (!await isAdmin()) return NextResponse.json({ message: "Nuk keni autorizim." }, { status: 403 });
  const parsed = z.object({ id: z.uuid(), status: z.enum(["new", "contacted", "processing", "completed", "shipped", "cancelled"]) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Të dhënat nuk janë të vlefshme." }, { status: 400 });
  const result = await db.query("UPDATE orders SET status=$2,updated_at=now() WHERE id=$1 RETURNING id", [parsed.data.id, parsed.data.status]);
  if (!result.rowCount) return NextResponse.json({ message: "Porosia nuk u gjet." }, { status: 404 });
  return NextResponse.json({ message: "Statusi i porosisë u përditësua." });
}
