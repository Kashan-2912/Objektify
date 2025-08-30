"use client";
import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function ClientHeader() {
  const { data: session, status } = useSession();
  const [credits, setCredits] = useState<number | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email) { setCredits(null); return; }
    (async () => {
      try {
        const r = await fetch(`/api/user?email=${encodeURIComponent(email)}`);
        const j = await r.json();
        if (typeof j.credits === "number") setCredits(j.credits);
      } catch {}
    })();
  }, [session?.user?.email]);

  if (status === "loading") return <div className="text-sm">…</div>;

  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/auth/signin" className="rounded-md border px-3 py-1.5 text-sm">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/wishlist" className="rounded-md border px-3 py-1.5">Wishlist</Link>
      <div className="relative">
        <button className="rounded-md border px-3 py-1.5" onClick={()=>setShowPicker((v)=>!v)}>Buy credits</button>
        {showPicker && (
          <div className="absolute right-0 mt-2 w-56 rounded-md border bg-background p-2 shadow-sm z-50">
            <PackButton label="Small • 20 credits" variantId={process.env.NEXT_PUBLIC_LEMON_VARIANT_SMALL_ID} email={session.user?.email || ""} onDone={()=>setShowPicker(false)} />
            <PackButton label="Medium • 45 credits" variantId={process.env.NEXT_PUBLIC_LEMON_VARIANT_MEDIUM_ID} email={session.user?.email || ""} onDone={()=>setShowPicker(false)} />
            <PackButton label="Large • 70 credits" variantId={process.env.NEXT_PUBLIC_LEMON_VARIANT_LARGE_ID} email={session.user?.email || ""} onDone={()=>setShowPicker(false)} />
          </div>
        )}
      </div>
      <span className="hidden sm:inline">{session.user?.email}</span>
      <span>Credits: {credits ?? "—"}</span>
      <button className="rounded-md border px-3 py-1.5" onClick={()=>signOut()}>Sign out</button>
    </div>
  );
}

function PackButton({ label, variantId, email, onDone }:{ label: string; variantId?: string; email: string; onDone: ()=>void }) {
  const disabled = !variantId;
  return (
    <button
      disabled={disabled}
      className="w-full text-left rounded-md border px-3 py-2 text-sm mb-2 last:mb-0 disabled:opacity-50"
      onClick={async ()=>{
        if (!variantId) return;
        const r = await fetch("/api/payments/lemonsqueezy/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantId, email }) });
        const j = await r.json();
        onDone();
        if (j?.url) window.location.href = j.url;
        else alert("Unable to create checkout. Check server logs.");
      }}
    >
      {label}
    </button>
  );
}


