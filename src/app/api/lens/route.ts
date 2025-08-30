import { NextRequest } from "next/server";

type ProductItem = {
  id: string;
  title: string;
  imageUrl?: string;
  linkUrl?: string;
  source?: string;
  priceText?: string;
};

type UnknownRecord = Record<string, unknown>;

export const runtime = "nodejs";

export async function GET() {
  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const image = form.get("image");
    if (!(image instanceof Blob)) {
      return new Response(JSON.stringify({ error: "Missing image" }), { status: 400 });
    }

    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing SERPAPI_KEY env. Create SerpApi key and set it." }),
        { status: 500 }
      );
    }

    const hostedUrl = await uploadToCatbox(image, (form.get("filename") as string) || "upload.jpg");
    if (!hostedUrl) {
      return new Response(JSON.stringify({ error: "Failed to host image for Google Lens" }), { status: 502 });
    }

    const params = new URLSearchParams();
    params.set("engine", "google_lens");
    params.set("api_key", apiKey);
    params.set("no_cache", "true");
    params.set("hl", "en");
    params.set("gl", "us");
    params.set("url", hostedUrl);

    const url = `https://serpapi.com/search.json?${params.toString()}`;
    const resp = await fetch(url, { method: "GET" });

    if (!resp.ok) {
      let details: unknown = undefined;
      try { details = await resp.json(); } catch { try { details = await resp.text(); } catch { details = undefined; } }
      return new Response(
        JSON.stringify({ error: "SerpApi error", details, hostedUrl }),
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const items: ProductItem[] = simplifySerpApiLens(data);

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

function simplifySerpApiLens(data: unknown): ProductItem[] {
  if (!data || typeof data !== "object" || data === null) return [];
  const d = data as UnknownRecord;
  const items: ProductItem[] = [];

  const push = (v: Record<string, unknown>, fallbackTitle = "Item") => {
    const id = get<string | number>(v, "position") || get<string>(v, "link") || get<string>(v, "thumbnail") || Math.random().toString(36).slice(2);
    const title = get<string>(v, "title") || get<string>(v, "name") || get<string>(v, "snippet") || fallbackTitle;
    const imageUrl = get<string>(v, "thumbnail") || get<string>(v, "image") || get<string>(v, "thumbnail_url") || get<string>(v, "original");
    const linkUrl = get<string>(v, "link") || get<string>(v, "source") || get<string>(v, "redirect_link") || get<string>(v, "product_link");
    const source = get<string>(v, "displayed_link") || get<string>(v, "source") || get<string>(v, "seller") || get<string>(v, "domain");
    const price = get<string | number>(v, "price") || get<string>(v, "price_str") || get<number>(v, "extracted_price");
    const priceText = typeof price === "number" ? String(price) : price;
    items.push({ id: String(id), title: String(title), imageUrl, linkUrl, source, priceText });
  };

  for (const v of getArray(d, "shopping_results")) push(v, "Product");
  for (const v of getArray(d, "visual_matches")) push(v, "Visual match");
  for (const v of getArray(d, "image_results")) push(v, "Similar image");
  for (const v of getArray(d, "organic_results")) push(v, "Result");

  const seen = new Set<string>();
  const out: ProductItem[] = [];
  for (const it of items) {
    const key = it.linkUrl || it.imageUrl || it.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out.slice(0, 48);
}

async function uploadToCatbox(image: Blob, filename: string): Promise<string | null> {
  try {
    const fd = new FormData();
    fd.set("reqtype", "fileupload");
    fd.set("fileToUpload", new File([image], filename, { type: image.type || "image/jpeg" }));
    const r = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: fd });
    const text = await r.text();
    if (!r.ok) return null;
    if (!/^https?:\/\//.test(text)) return null;
    return text.trim();
  } catch {
    return null;
  }
}

function get<T = unknown>(obj: Record<string, unknown>, key: string): T | undefined {
  const val = obj[key];
  return (val as T) ?? undefined;
}

function getArray(obj: UnknownRecord, key: string): UnknownRecord[] {
  const val = obj[key];
  return Array.isArray(val) ? (val as UnknownRecord[]) : [];
}


