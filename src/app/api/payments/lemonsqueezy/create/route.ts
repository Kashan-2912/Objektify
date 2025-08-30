import { NextRequest } from "next/server";

export const runtime = "nodejs";

function buildCheckoutUrl(variantOrUuid: string, email: string) {
  const overrideDomain = (process.env.LEMON_CHECKOUT_DOMAIN || "").trim().replace(/\/$/, "");
  const baseDomain = overrideDomain || `https://${(process.env.LEMON_STORE_SUBDOMAIN || "store").trim()}.lemonsqueezy.com`;
  const isUuid = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i.test(variantOrUuid);
  const path = isUuid ? `/buy/${encodeURIComponent(variantOrUuid)}` : `/checkout/buy/${encodeURIComponent(variantOrUuid)}`;
  const base = `${baseDomain}${path}`;
  const qs = new URLSearchParams();
  qs.set("checkout[email]", email);
  qs.set("checkout[custom][user_email]", email);
  // Optional: embed=true if you plan to use overlay
  // qs.set("checkout[embed]", "true");
  return `${base}?${qs.toString()}`;
}

export async function POST(req: NextRequest) {
  try {
    const { variantId, email } = await req.json();
    if (!variantId || !email) return new Response(JSON.stringify({ error: "variantId and email required" }), { status: 400 });
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const origin = (
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : `${proto}://${host}`)
    ).replace(/\/$/, "");
    const baseUrl = buildCheckoutUrl(String(variantId), String(email));
    const sep = baseUrl.includes("?") ? "&" : "?";
    const success = encodeURIComponent(`${origin}/?payment=success`);
    const cancel = encodeURIComponent(`${origin}/?payment=cancel`);
    const url = `${baseUrl}${sep}checkout%5Bsuccess_url%5D=${success}&checkout%5Bcancel_url%5D=${cancel}`;
    return new Response(JSON.stringify({ url }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}


