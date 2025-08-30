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

    // Type guard to ensure user is not an array and has credits property
    let credits = 0;
    if (user && !Array.isArray(user) && typeof user.credits === "number") {
      credits = user.credits;
    }

    return new Response(JSON.stringify({ credits }), { status: 200 });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}


