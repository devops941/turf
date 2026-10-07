"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, Send, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge, EmptyState, Spinner, StatCard } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Payout } from "@/lib/types";

export default function AdminPayoutsPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const { show } = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter === "ALL" ? "" : `?status=${filter}`;
      const data = await api.get<{ items: Payout[] }>(`/api/payments/payouts${q}`);
      setPayouts(data.items);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const settle = async (p: Payout) => {
    try {
      const res = await api.post<{ status: string }>(`/api/payments/payouts/${p.id}/settle`);
      show(`Payout ${res.status}.`, res.status === "PAID" ? "success" : "info");
      load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not settle", "error");
    }
  };

  const settleAll = async () => {
    setSettling(true);
    try {
      const res = await api.post<{ settled: number }>("/api/payments/payouts/settle-all");
      show(`${res.settled} payout(s) settled.`, "success");
      load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not settle", "error");
    } finally {
      setSettling(false);
    }
  };

  const pendingTotal = payouts
    .filter((p) => p.status === "PENDING" || p.status === "PROCESSING")
    .reduce((s, p) => s + p.amount, 0);
  const paidTotal = payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);

  return (
    <DashboardShell
      kind="admin"
      title="Payouts"
      subtitle="Venue and platform payouts generated from captured transactions."
      action={
        <button className="btn-primary" onClick={settleAll} disabled={settling}>
          <Send className="h-4 w-4" /> {settling ? "Settling..." : "Settle all pending"}
        </button>
      }
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={formatCurrency(pendingTotal)} tone="blue" />
        <StatCard label="Settled" value={formatCurrency(paidTotal)} />
        <StatCard label="Total entries" value={payouts.length} tone="slate" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["ALL", "PENDING", "PROCESSING", "PAID", "FAILED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`badge border px-3 py-1.5 ${
              filter === f
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading payouts..." />
      ) : payouts.length === 0 ? (
        <EmptyState icon={<Wallet className="h-6 w-6" />} title="No payouts in this view" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-head">Created</th>
                  <th className="table-head">Beneficiary</th>
                  <th className="table-head">Venue</th>
                  <th className="table-head">Amount</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Reference</th>
                  <th className="table-head"></th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="table-cell text-slate-500">{formatDateTime(p.createdAt)}</td>
                    <td className="table-cell">
                      <Badge status={p.beneficiaryType === "ADMIN" ? "ADMIN" : "VENUE_OWNER"}>
                        {p.beneficiaryType}
                      </Badge>
                    </td>
                    <td className="table-cell">{p.venueName ?? "-"}</td>
                    <td className="table-cell font-numeric font-semibold">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="table-cell">
                      <Badge status={p.status} />
                    </td>
                    <td className="table-cell font-mono text-xs text-slate-400">
                      {p.gatewayRef ?? "-"}
                    </td>
                    <td className="table-cell text-right">
                      {(p.status === "PENDING" || p.status === "FAILED") && (
                        <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => settle(p)}>
                          <Banknote className="h-3.5 w-3.5" /> Settle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
