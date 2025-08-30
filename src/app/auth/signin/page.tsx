"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      alert(res.error || "Sign in failed");
      return;
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm border rounded-xl p-6 space-y-3">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <input className="w-full border rounded-md px-3 py-2" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full border rounded-md px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button disabled={loading} className="w-full rounded-md border px-3 py-2 hover:bg-black/[.03] dark:hover:bg-white/[.06]">{loading?"Signing in...":"Sign in"}</button>
        <button type="button" onClick={()=>signIn("google")} className="w-full rounded-md border px-3 py-2 hover:bg-black/[.03] dark:hover:bg-white/[.06]">Sign in with Google</button>
      </form>
    </div>
  );
}


