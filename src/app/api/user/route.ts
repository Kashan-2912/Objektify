import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return new Response(JSON.stringify({ error: "email required" }), { status: 400 });
  await connectToDatabase();
  const user = await UserModel.findOne({ email }).lean();
  return new Response(JSON.stringify({ credits: user?.credits ?? 0, user }), { status: 200 });
}


