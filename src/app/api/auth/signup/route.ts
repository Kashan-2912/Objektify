import { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json();
    if (!email || !password) return new Response("email and password required", { status: 400 });
    await connectToDatabase();
    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) return new Response("Email already registered", { status: 409 });
    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({ email: email.toLowerCase(), name, hashedPassword, credits: 5, wishlist: [] });
    return new Response("ok", { status: 201 });
  } catch (e: any) {
    return new Response(e?.message || "Unknown error", { status: 500 });
  }
}


