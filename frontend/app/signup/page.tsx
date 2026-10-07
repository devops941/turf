"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, Trophy, Users } from "lucide-react";
import { useAuth, dashboardPathFor } from "@/lib/auth";
import { useToast } from "@/components/Toast";
import { ApiError } from "@/lib/api";
import type { Role } from "@/lib/types";

function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { show } = useToast();
  const initialRole = (params.get("role") as Role) || "USER";

  const [role, setRole] = useState<Role>(initialRole === "VENUE_OWNER" ? "VENUE_OWNER" : "USER");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await signup({ ...form, role });
      show("Account created. Welcome to TurfHub!", "success");
      router.push(dashboardPathFor(user.role));
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not create account", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h1 className="font-display text-2xl font-bold text-slate-900">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Choose how you want to use TurfHub.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          { value: "USER" as Role, label: "Player", icon: Users, hint: "Book turfs" },
          { value: "VENUE_OWNER" as Role, label: "Venue Owner", icon: Store, hint: "List turfs" },
        ].map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            className={`rounded-2xl border-2 p-4 text-left transition ${
              role === r.value ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <r.icon className={`h-5 w-5 ${role === r.value ? "text-brand-600" : "text-slate-400"}`} />
            <p className="mt-2 font-semibold text-slate-800">{r.label}</p>
            <p className="text-xs text-slate-500">{r.hint}</p>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label">Full name</label>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Arjun Sharma"
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label">Phone (optional)</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+91 90000 00000"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Creating account..." : `Create ${role === "VENUE_OWNER" ? "owner" : "player"} account`}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
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
          <h2 className="font-display text-3xl font-bold">Join the marketplace.</h2>
          <p className="mt-3 max-w-md text-brand-50/90">
            Players book instantly. Owners list turfs and get paid automatically.
          </p>
        </div>
        <p className="text-xs text-brand-50/70">Free to start - no listing fees.</p>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <Suspense fallback={null}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
