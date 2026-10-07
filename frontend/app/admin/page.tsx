"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CreditCard,
  IndianRupee,
  Percent,
  Store,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge, Spinner, StatCard } from "@/components/ui";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Analytics, GatewayConfigView, SplitSettings, Venue } from "@/lib/types";

export default function AdminOverview() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [gateway, setGateway] = useState<GatewayConfigView | null>(null);
  const [split, setSplit] = useState<SplitSettings | null>(null);
  const [pending, setPending] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [a, g, s, v] = await Promise.all([
          api.get<Analytics>("/api/admin/analytics"),
          api.get<GatewayConfigView>("/api/payments/gateway-config"),
          api.get<SplitSettings>("/api/payments/split"),
          api.get<{ items: Venue[] }>("/api/venues/admin/all?status=PENDING"),
        ]);
        setAnalytics(a);
        setGateway(g);
        setSplit(s);
        setPending(v.items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <DashboardShell kind="admin" title="Platform overview" subtitle="Monitor venues, revenue and payouts.">
      {loading ? (
        <Spinner label="Loading analytics..." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Gross bookings value"
              value={formatCurrency(analytics?.gmv ?? 0)}
              hint={`${analytics?.totalBookings ?? 0} bookings`}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="accent"
            />
            <StatCard
              label="Commission earned"
              value={formatCurrency(analytics?.commissionEarned ?? 0)}
              icon={<IndianRupee className="h-5 w-5" />}
            />
            <StatCard
              label="Venues"
              value={analytics?.totalVenues ?? 0}
              hint={`${analytics?.pendingVenues ?? 0} awaiting approval`}
              icon={<Store className="h-5 w-5" />}
              tone="blue"
            />
            <StatCard
              label="Failed payment rate"
              value={`${analytics?.failedPaymentRate ?? 0}%`}
              icon={<BarChart3 className="h-5 w-5" />}
              tone="slate"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Link href="/admin/gateway" className="card p-5 hover:shadow-lift">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Active gateway
                  </p>
                  <p className="font-display text-lg font-bold text-slate-900">
                    {gateway?.provider ?? "SANDBOX"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {gateway?.isActive ? "Configured and ready." : "Using sandbox defaults."}
              </p>
              <p className="mt-2 text-xs font-semibold text-brand-700">Manage gateway →</p>
            </Link>

            <Link href="/admin/split" className="card p-5 hover:shadow-lift">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-50 text-accent-700">
                  <Percent className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Global commission
                  </p>
                  <p className="font-display text-lg font-bold text-slate-900">
                    {split?.globalPercentage ?? 10}%
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {split?.venueOverrides.length ?? 0} venue-specific override(s).
              </p>
              <p className="mt-2 text-xs font-semibold text-accent-700">Control split →</p>
            </Link>

            <Link href="/admin/payouts" className="card p-5 hover:shadow-lift">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <Ticket className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Payouts
                  </p>
                  <p className="font-display text-lg font-bold text-slate-900">Ledger</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">Settle pending venue and admin payouts.</p>
              <p className="mt-2 text-xs font-semibold text-blue-700">Open payouts →</p>
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="font-display font-semibold text-slate-900">Pending approvals</h2>
              <div className="mt-4 space-y-3">
                {pending.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    Nothing waiting for review.
                  </p>
                ) : (
                  pending.slice(0, 5).map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{v.name}</p>
                        <p className="text-xs text-slate-500">
                          {v.city} · {v.owner?.name}
                        </p>
                      </div>
                      <Badge status={v.status} />
                    </div>
                  ))
                )}
              </div>
              <Link href="/admin/venues" className="btn-ghost mt-4 w-full">
                Review all venues
              </Link>
            </div>

            <div className="card p-5">
              <h2 className="font-display font-semibold text-slate-900">Top venues by revenue</h2>
              <div className="mt-4 space-y-3">
                {(analytics?.topVenues ?? []).length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    No revenue recorded yet.
                  </p>
                ) : (
                  analytics!.topVenues.map((t, i) => (
                    <div key={t.venueId} className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                        {i + 1}
                      </span>
                      <span className="flex-1 font-medium text-slate-700">{t.name}</span>
                      <span className="font-numeric font-semibold text-slate-900">
                        {formatCurrency(t.revenue)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
