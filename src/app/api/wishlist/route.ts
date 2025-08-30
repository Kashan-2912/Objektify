import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { UserModel, IUser } from "@/lib/models";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return new Response(JSON.stringify({ error: "email required" }), { status: 400 });
  await connectToDatabase();
  const user: IUser | null = await UserModel.findOne({ email }).lean<IUser>();
  return new Response(JSON.stringify({ wishlist: user?.wishlist || [] }), { status: 200 });
}

export async function POST(req: NextRequest) {
  const { email, item } = await req.json();
  if (!email || !item?.id || !item?.title) {
    return new Response(JSON.stringify({ error: "email and item required" }), { status: 400 });
  }
  await connectToDatabase();
  const user: IUser | null = await UserModel.findOneAndUpdate(
    { email },
    { $addToSet: { wishlist: item } },
    { upsert: true, setDefaultsOnInsert: true, new: true }
  ).lean<IUser>();
  return new Response(JSON.stringify({ wishlist: user?.wishlist || [] }), { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const { email, id } = await req.json();
  if (!email || !id) return new Response(JSON.stringify({ error: "email and id required" }), { status: 400 });
  await connectToDatabase();
  const user: IUser | null = await UserModel.findOneAndUpdate(
    { email },
    { $pull: { wishlist: { id } } },
    { new: true }
  ).lean<IUser>();
  return new Response(JSON.stringify({ wishlist: user?.wishlist || [] }), { status: 200 });
}


