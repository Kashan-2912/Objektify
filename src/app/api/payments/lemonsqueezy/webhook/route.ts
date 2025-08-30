import { NextRequest } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models";

export const runtime = "nodejs";

function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.LEMON_WEBHOOK_SECRET || "";
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody, "utf8");
  const digest = hmac.digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-signature");
  if (!verifySignature(raw, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }
  try {
    const event = JSON.parse(raw);
    const type = event?.meta?.event_name || event?.event_name;
    const email = event?.data?.attributes?.user_email || event?.data?.attributes?.checkout_data?.custom?.user_email;
    // Map variants to credits; adjust to your Lemon Squeezy variants
    const variantId = String(event?.data?.attributes?.variant_id || "");
    const variantCredits: Record<string, number> = {
      [process.env.LEMON_VARIANT_SMALL_ID || "small"]: 20,
      [process.env.LEMON_VARIANT_MEDIUM_ID || "medium"]: 45,
      [process.env.LEMON_VARIANT_LARGE_ID || "large"]: 70,
    };
    const creditsToAdd = variantCredits[variantId] || 0;
    if (type === "order_created" || type === "subscription_payment_success") {
      if (email && creditsToAdd > 0) {
        await connectToDatabase();
        await UserModel.findOneAndUpdate(
          { email },
          { $inc: { credits: creditsToAdd } },
          { upsert: true, setDefaultsOnInsert: true }
        );
      }
    }
    return new Response("ok", { status: 200 });
  } catch (e: any) {
    return new Response(e?.message || "error", { status: 500 });
  }
}


