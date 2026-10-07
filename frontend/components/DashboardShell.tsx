"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Percent,
  Receipt,
  Store,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const OWNER_NAV: NavItem[] = [
  { href: "/owner", label: "Overview", icon: LayoutDashboard },
  { href: "/owner/venues", label: "My Turfs", icon: Store },
  { href: "/owner/bookings", label: "Bookings", icon: Ticket },
  { href: "/owner/earnings", label: "Earnings", icon: Wallet },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/venues", label: "Venues", icon: Store },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/gateway", label: "Payment Gateway", icon: CreditCard },
  { href: "/admin/split", label: "Split Control", icon: Percent },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt },
  { href: "/admin/payouts", label: "Payouts", icon: Wallet },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function DashboardShell({
  kind,
  title,
  subtitle,
  action,
  children,
}: {
  kind: "owner" | "admin";
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const nav = kind === "owner" ? OWNER_NAV : ADMIN_NAV;
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="card sticky top-20 p-3">
            <div className="mb-3 rounded-xl bg-gradient-to-br from-brand-600 to-emerald-500 p-4 text-white">
              <p className="text-xs text-brand-50/80">
                {kind === "owner" ? "Venue Owner" : "Administrator"}
              </p>
              <p className="mt-0.5 truncate font-display font-semibold">{user?.name}</p>
            </div>
            <nav className="space-y-1">
              {nav.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/owner" && item.href !== "/admin" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>
            {action}
          </div>

          {/* Mobile nav */}
          <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-soft"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
