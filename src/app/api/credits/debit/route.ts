import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, amount } = await req.json();
    if (!email || typeof amount !== "number") {
      return new Response(JSON.stringify({ error: "email and amount required" }), { status: 400 });
    }
    await connectToDatabase();
    const user = await UserModel.findOneAndUpdate(
      { email },
      { $inc: { credits: -Math.abs(amount) } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    return new Response(JSON.stringify({ credits: user?.credits ?? 0 }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500 });
  }
}


