import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models";

export const runtime = "nodejs";

const handler = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;
        await connectToDatabase();
        const user = await UserModel.findOne({ email });
        if (!user || !user.hashedPassword) return null;
        const ok = await bcrypt.compare(password, user.hashedPassword);
        if (!ok) return null;
        return {
          id: String(user._id),
          email: user.email,
          name: user.name || undefined,
        } as { id: string; email: string; name?: string };
      },
    }),
  ],
  session: { strategy: "jwt" },
});

export { handler as GET, handler as POST };
