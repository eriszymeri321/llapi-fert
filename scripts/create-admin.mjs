import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import pg from "pg";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL mungon. Vendose Neon connection string në .env.local dhe provo përsëri.");
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes("neon.tech") ? { rejectUnauthorized: false } : undefined });

function askHidden(question) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") throw new Error("Kjo komandë duhet nisur në terminal interaktiv.");
  return new Promise((resolve, reject) => {
    stdout.write(question);
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    const finish = (error) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      stdout.write("\n");
      error ? reject(error) : resolve(value);
    };
    const onData = (chunk) => {
      const key = chunk.toString("utf8");
      if (key === "\u0003") return finish(new Error("U anulua."));
      if (key === "\r" || key === "\n") return finish();
      if (key === "\u007f" || key === "\b") value = value.slice(0, -1);
      else if (!key.startsWith("\u001b")) value += key;
    };
    stdin.on("data", onData);
  });
}

const rl = createInterface({ input: stdin, output: stdout });
try {
  const name = (await rl.question("Emri i administratorit: ")).trim();
  const email = (await rl.question("Emaili i administratorit: ")).trim().toLowerCase();
  rl.close();
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Emri ose emaili nuk është i vlefshëm.");
  const password = await askHidden("Fjalëkalimi (minimum 12 karaktere; nuk do të shfaqet): ");
  if (password.length < 12) throw new Error("Përdor fjalëkalim me së paku 12 karaktere.");
  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query("INSERT INTO profiles(name,email,password_hash,role) VALUES($1,$2,$3,'admin')", [name, email, passwordHash]);
  console.log(`Administratori ${email} u krijua. Hyr te /login.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Krijimi dështoi.");
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}
