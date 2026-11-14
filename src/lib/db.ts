import { Pool } from "pg";

const globalForPg = globalThis as unknown as { pgPool?: Pool };
export const db = globalForPg.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL?.includes("neon.tech") ? { rejectUnauthorized: false } : undefined, max: 10 });
if (process.env.NODE_ENV !== "production") globalForPg.pgPool = db;
