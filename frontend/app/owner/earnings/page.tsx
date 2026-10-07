"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge, EmptyState, Spinner, StatCard } from "@/components/ui";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Earnings } from "@/lib/types";

export default function OwnerEarningsPage() {
  return (
    <RequireRole roles={["VENUE_OWNER"]}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const [data, setData] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Earnings>("/api/payments/earnings/mine")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell
      kind="owner"
      title="Earnings & payouts"
      subtitle="Automatic split payouts - no manual reconciliation."
    >
      {loading ? (
        <Spinner label="Loading earnings..." />
      ) : !data ? (
        <EmptyState title="No earnings data" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Gross earnings" value={formatCurrency(data.grossEarnings)} tone="accent" />
            <StatCard label="Pending payouts" value={formatCurrency(data.pendingPayouts)} tone="blue" />
            <StatCard label="Settled" value={formatCurrency(data.settledPayouts)} />
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <h2 className="font-display font-semibold text-slate-900">Payout ledger</h2>
              <span className="text-xs text-slate-400">{data.payouts.length} entries</span>
            </div>
            {data.payouts.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={<Wallet className="h-6 w-6" />} title="No payouts yet" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="table-head">Date</th>
                      <th className="table-head">Beneficiary</th>
                      <th className="table-head">Amount</th>
                      <th className="table-head">Status</th>
                      <th className="table-head">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="table-cell">{formatDateTime(p.createdAt)}</td>
                        <td className="table-cell">{p.beneficiaryType}</td>
                        <td className="table-cell font-numeric font-semibold">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="table-cell">
                          <Badge status={p.status} />
                        </td>
                        <td className="table-cell font-mono text-xs text-slate-400">
                          {p.gatewayRef ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 p-4">
              <h2 className="font-display font-semibold text-slate-900">Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="table-head">Order</th>
                    <th className="table-head">Gross</th>
                    <th className="table-head">Commission</th>
                    <th className="table-head">Your share</th>
                    <th className="table-head">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="table-cell font-mono text-xs">{t.orderId}</td>
                      <td className="table-cell font-numeric">{formatCurrency(t.amount)}</td>
                      <td className="table-cell text-slate-500">
                        {t.splitPercentage}% · {formatCurrency(t.adminShare)}
                      </td>
                      <td className="table-cell font-numeric font-semibold text-brand-700">
                        {formatCurrency(t.venueShare)}
                      </td>
                      <td className="table-cell">
                        <Badge status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
