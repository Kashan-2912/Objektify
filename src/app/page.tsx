"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ProductItem = {
  id: string;
  title: string;
  imageUrl?: string;
  linkUrl?: string;
  source?: string;
  priceText?: string;
};

type Selection = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ProductItem[]>([]);
  const [email, setEmail] = useState<string>("");
  const [credits, setCredits] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setSelection(null);
      setResults([]);
    }
  }, []);

  const displayedSize = useMemo(() => {
    const img = imgRef.current;
    if (!img) return null;
    return { w: img.clientWidth, h: img.clientHeight };
  }, [imageUrl]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    setImgNatural({ w: el.naturalWidth, h: el.naturalHeight });
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragStart({ x, y });
    setSelection({ x, y, width: 0, height: 0 });
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStart) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const sx = Math.min(dragStart.x, x);
    const sy = Math.min(dragStart.y, y);
    const w = Math.abs(x - dragStart.x);
    const h = Math.abs(y - dragStart.y);
    setSelection({ x: sx, y: sy, width: w, height: h });
  }, [dragStart]);

  const onMouseUp = useCallback(() => {
    setDragStart(null);
  }, []);

  const cropToBlob = useCallback(async (): Promise<Blob | null> => {
    if (!imageUrl || !selection || !imgRef.current || !displayedSize) return null;
    if (selection.width < 10 || selection.height < 10) return null;
    const imgEl = imgRef.current;
    const scaleX = imgEl.naturalWidth / displayedSize.w;
    const scaleY = imgEl.naturalHeight / displayedSize.h;
    const sx = Math.round(selection.x * scaleX);
    const sy = Math.round(selection.y * scaleY);
    const sw = Math.round(selection.width * scaleX);
    const sh = Math.round(selection.height * scaleY);
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        resolve();
      };
      img.src = imageUrl;
      img.crossOrigin = "anonymous";
    });
    return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92));
  }, [imageUrl, selection, displayedSize]);

  const onSearch = useCallback(async () => {
    if (!file && !imageUrl) return;
    setIsSearching(true);
    setResults([]);
    try {
      const form = new FormData();
      let blobToSend: Blob | null = null;
      if (selection) {
        blobToSend = await cropToBlob();
      }
      if (!blobToSend && file) {
        blobToSend = file;
      }
      if (!blobToSend) throw new Error("No image to send");
      const filename = (file && file.name) || "crop.jpg";
      form.append("image", blobToSend, filename);
      form.append("filename", filename);
      if (email) form.append("email", email);
      const res = await fetch("/api/visual-search", { method: "POST", body: form });
      if (res.status === 404) {
        // Try alternate route path if framework didn't register the first one
        const res2 = await fetch("/api/lens", { method: "POST", body: form });
        if (!res2.ok) {
          let message = "Search failed";
          try { const err = await res2.json(); message = err?.details || err?.error || message; } catch { try { message = await res2.text(); } catch {} }
          throw new Error(message || "Search failed");
        }
        const data2 = (await res2.json()) as { items: ProductItem[] };
        setResults(data2.items || []);
        setIsSearching(false);
        return;
      }
      if (!res.ok) {
        let message = "Search failed";
        try {
          const err = await res.json();
          message = err?.details || err?.error || message;
        } catch {
          try { message = await res.text(); } catch {}
        }
        throw new Error(message || "Search failed");
      }
      const data = (await res.json()) as { items: ProductItem[] };
      setResults(data.items || []);
      if (email) {
        try {
          const r = await fetch(`/api/user?email=${encodeURIComponent(email)}`);
          const j = await r.json();
          if (typeof j.credits === "number") setCredits(j.credits);
        } catch {}
      }
    } catch (err) {
      console.error(err);
      alert("Search failed. Check console for details.");
    } finally {
      setIsSearching(false);
    }
  }, [file, imageUrl, selection, cropToBlob, email]);

  const clearAll = useCallback(() => {
    setFile(null);
    setImageUrl(null);
    setSelection(null);
    setResults([]);
  }, []);

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <main className="max-w-5xl mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-6">Objektify</h1>
        {!imageUrl && (
          <div className="border border-black/[.08] dark:border-white/[.145] rounded-xl p-6">
            <p className="mb-3">Upload an image of the object you want to buy:</p>
            <input type="file" accept="image/*" onChange={onFileChange} />
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="email"
                placeholder="Your email (for credits & wishlist)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-transparent"
              />
              <button
                className="rounded-md border px-3 py-2 text-sm hover:bg-black/[.03] dark:hover:bg-white/[.06]"
                onClick={async () => {
                  if (!email) return alert("Enter email first");
                  try {
                    const r = await fetch(`/api/user?email=${encodeURIComponent(email)}`);
                    if (!r.ok) {
                      let msg = "Failed to fetch credits";
                      try { msg = await r.text(); } catch {}
                      alert(msg);
                      return;
                    }
                    let j: any = null;
                    try { j = await r.json(); } catch { j = {}; }
                    setCredits(typeof j.credits === "number" ? j.credits : 0);
                  } catch (e) {
                    console.error(e);
                    alert("Failed to fetch credits. Check server console.");
                  }
                }}
              >
                Check credits{credits !== null ? `: ${credits}` : ""}
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">Tip: After uploading, drag to select the object to focus search.</p>
          </div>
        )}

        {imageUrl && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <button
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-black/[.03] dark:hover:bg-white/[.06]"
                  onClick={clearAll}
                >
                  Reset
                </button>
                <button
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-black/[.03] dark:hover:bg-white/[.06] disabled:opacity-50"
                  disabled={isSearching}
                  onClick={onSearch}
                >
                  {isSearching ? "Searching..." : "Search products"}
                </button>
              </div>
              <div
                ref={containerRef}
                className="relative select-none inline-block max-w-full"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  onLoad={onImageLoad}
                  alt="uploaded"
                  className="max-w-full h-auto rounded-md border"
                  style={{ maxHeight: 520 }}
                />
                {selection && (
                  <div
                    style={{
                      position: "absolute",
                      left: selection.x,
                      top: selection.y,
                      width: selection.width,
                      height: selection.height,
                      border: "2px solid #60a5fa",
                      background: "rgba(96,165,250,0.15)",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-2">Drag to draw a rectangle around the object. Click Search products to find matches.</p>
            </div>
            <div>
              <h2 className="text-lg font-medium mb-3">Results</h2>
              {results.length === 0 && (
                <p className="text-sm text-neutral-500">No results yet.</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {results.map((item) => (
                  <a
                    key={item.id}
                    href={item.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border p-2 hover:shadow-sm transition"
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-36 object-cover rounded" loading="lazy" />
                    ) : (
                      <div className="w-full h-36 bg-neutral-100 dark:bg-neutral-800 rounded" />
                    )}
                    <div className="mt-2 text-sm line-clamp-2">{item.title || "Untitled"}</div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {(item.priceText ? item.priceText + " • " : "") + (item.source || "")}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
