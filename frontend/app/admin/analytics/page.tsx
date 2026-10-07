"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Spinner, StatCard } from "@/components/ui";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Analytics } from "@/lib/types";

export default function AdminAnalyticsPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Analytics>("/api/admin/analytics")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardShell kind="admin" title="Analytics">
        <Spinner />
      </DashboardShell>
    );
  }
  if (!data) return null;

  const maxRevenue = Math.max(1, ...data.topVenues.map((v) => v.revenue));
  const confirmationRate = data.totalBookings
    ? Math.round((data.confirmedBookings / data.totalBookings) * 100)
    : 0;

  return (
    <DashboardShell kind="admin" title="Analytics" subtitle="Platform health and revenue performance.">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Gross bookings value"
            value={formatCurrency(data.gmv)}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="accent"
          />
          <StatCard label="Commission" value={formatCurrency(data.commissionEarned)} />
          <StatCard
            label="Confirmation rate"
            value={`${confirmationRate}%`}
            hint={`${data.confirmedBookings}/${data.totalBookings} bookings`}
            icon={<BarChart3 className="h-5 w-5" />}
            tone="blue"
          />
          <StatCard
            label="Failed payment rate"
            value={`${data.failedPaymentRate}%`}
            tone="slate"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="font-display font-semibold text-slate-900">Revenue by venue</h2>
            <div className="mt-5 space-y-4">
              {data.topVenues.length === 0 ? (
                <p className="text-sm text-slate-500">No revenue yet.</p>
              ) : (
                data.topVenues.map((v) => (
                  <div key={v.venueId}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{v.name}</span>
                      <span className="font-numeric font-semibold text-slate-900">
                        {formatCurrency(v.revenue)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400"
                        style={{ width: `${(v.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-display font-semibold text-slate-900">Venue mix</h2>
            <div className="mt-5 space-y-4">
              {[
                { label: "Approved venues", value: data.approvedVenues, color: "bg-brand-500" },
                { label: "Pending approval", value: data.pendingVenues, color: "bg-amber-500" },
                {
                  label: "Suspended / other",
                  value: data.totalVenues - data.approvedVenues - data.pendingVenues,
                  color: "bg-slate-300",
                },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-numeric font-semibold text-slate-900">{row.value}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${row.color}`}
                      style={{
                        width: `${data.totalVenues ? (row.value / data.totalVenues) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
