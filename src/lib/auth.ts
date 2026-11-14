import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [CredentialsProvider({ name: "Email", credentials: { email: { label: "Email", type: "email" }, password: { label: "Fjalëkalimi", type: "password" } }, async authorize(credentials) {
    if (!credentials?.email || !credentials.password) return null;
    const { rows } = await db.query("SELECT id,name,email,password_hash,role FROM profiles WHERE email=lower($1)", [credentials.email]);
    const user = rows[0]; if (!user || !await bcrypt.compare(credentials.password, user.password_hash)) return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role } as any;
  }})],
  callbacks: { async jwt({ token, user }) { if (user) token.role = (user as any).role; return token; }, async session({ session, token }) { if (session.user) (session.user as any).role = token.role; return session; } }
};
