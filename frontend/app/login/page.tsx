"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { useAuth, dashboardPathFor } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { ApiError } from "@/lib/api";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const { show } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(email, password);
      show(`Welcome back, ${user.name.split(" ")[0]}!`, "success");
      router.push(dashboardPathFor(user.role));
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not sign in", "error");
    } finally {
      setBusy(false);
    }
  };

  const quick = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="w-full max-w-md">
      <h1 className="font-display text-2xl font-bold text-slate-900">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">Welcome back. Enter your details to continue.</p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-8 rounded-2xl border border-dashed border-slate-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Demo accounts</p>
        <div className="mt-3 grid gap-2">
          {[
            { label: "Player", e: "player@turf.local", p: "Player@123" },
            { label: "Venue Owner", e: "owner@turf.local", p: "Owner@123" },
            { label: "Admin", e: "admin@crm.local", p: "Admin@123" },
          ].map((d) => (
            <button
              key={d.label}
              type="button"
              onClick={() => quick(d.e, d.p)}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-left text-sm hover:bg-slate-100"
            >
              <span className="font-medium text-slate-700">{d.label}</span>
              <span className="font-mono text-xs text-slate-400">{d.e}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-brand-700 to-emerald-500 p-10 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
            <Trophy className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold">TurfHub</span>
        </Link>
        <div>
          <h2 className="font-display text-3xl font-bold">Your next game is one tap away.</h2>
          <p className="mt-3 max-w-md text-brand-50/90">
            Sign in to book slots, manage your turf, or administer the platform.
          </p>
        </div>
        <p className="text-xs text-brand-50/70">Multi-role marketplace - players, owners, admins.</p>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
