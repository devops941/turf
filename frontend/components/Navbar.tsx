"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, dashboardPathFor } from "@/lib/auth";
import { LayoutDashboard, LogOut, Menu, Shield, Store, Trophy } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [{ href: "/venues", label: "Explore Turfs", icon: Trophy }];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
            <Trophy className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900">
            Turf<span className="text-brand-600">Hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname?.startsWith(l.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {user?.role === "VENUE_OWNER" && (
            <Link
              href="/owner"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Owner Console
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link
                href={dashboardPathFor(user.role)}
                className="btn-ghost"
                title="Dashboard"
              >
                {user.role === "ADMIN" ? (
                  <Shield className="h-4 w-4" />
                ) : user.role === "VENUE_OWNER" ? (
                  <Store className="h-4 w-4" />
                ) : (
                  <LayoutDashboard className="h-4 w-4" />
                )}
                {user.name.split(" ")[0]}
              </Link>
              <button
                className="btn-ghost"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>

        <button className="btn-ghost md:hidden" onClick={() => setOpen((v) => !v)}>
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <Link href="/venues" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Explore Turfs
            </Link>
            {user ? (
              <>
                <Link
                  href={dashboardPathFor(user.role)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  My Dashboard
                </Link>
                <button
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  onClick={() => {
                    logout();
                    setOpen(false);
                    router.push("/");
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Sign in
                </Link>
                <Link href="/signup" className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            <Trophy className="h-4 w-4" />
          </span>
          <span className="font-display font-semibold text-slate-800">TurfHub</span>
        </div>
        <p className="text-xs text-slate-400">
          Multi-role turf booking platform. Payments and split payouts handled automatically.
        </p>
      </div>
    </footer>
  );
}
