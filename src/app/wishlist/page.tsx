"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type WishlistItem = {
  id: string;
  title: string;
  imageUrl?: string;
  linkUrl?: string;
  source?: string;
  priceText?: string;
  createdAt?: string;
};

export default function WishlistPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const email = session?.user?.email || "";

  useEffect(() => {
    if (!email) return;
    (async () => {
      const r = await fetch(`/api/wishlist?email=${encodeURIComponent(email)}`);
      const j = await r.json();
      setItems(Array.isArray(j.wishlist) ? j.wishlist : []);
    })();
  }, [email]);

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <main className="max-w-5xl mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-6">Your Wishlist</h1>
        {!email && <p className="text-sm text-neutral-500">Sign in to view your wishlist.</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border p-2">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="w-full h-36 object-cover rounded" />
              ) : (
                <div className="w-full h-36 bg-neutral-100 dark:bg-neutral-800 rounded" />
              )}
              <div className="mt-2 text-sm line-clamp-2">{item.title}</div>
              <div className="text-xs text-neutral-500 mt-1">{(item.priceText ? item.priceText + " • " : "") + (item.source || "")}</div>
              {item.linkUrl && (
                <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block rounded-md border px-2 py-1 text-xs">Open</a>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}


