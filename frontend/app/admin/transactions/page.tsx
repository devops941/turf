"use client";

import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge, EmptyState, Spinner, StatCard } from "@/components/ui";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export default function AdminTransactionsPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ items: Transaction[] }>("/api/payments/transactions")
      .then((d) => setTxns(d.items))
      .finally(() => setLoading(false));
  }, []);

  const captured = txns.filter((t) => t.status === "CAPTURED");
  const gmv = captured.reduce((s, t) => s + t.amount, 0);
  const commission = captured.reduce((s, t) => s + t.adminShare, 0);
  const venueShare = captured.reduce((s, t) => s + t.venueShare, 0);

  return (
    <DashboardShell kind="admin" title="Transactions" subtitle="Every captured payment and its split.">
      {loading ? (
        <Spinner label="Loading transactions..." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Gross value" value={formatCurrency(gmv)} tone="accent" />
            <StatCard label="Platform commission" value={formatCurrency(commission)} />
            <StatCard label="Venue share" value={formatCurrency(venueShare)} tone="blue" />
          </div>

          {txns.length === 0 ? (
            <EmptyState icon={<Receipt className="h-6 w-6" />} title="No transactions yet" />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="table-head">Date</th>
                      <th className="table-head">Order</th>
                      <th className="table-head">Venue</th>
                      <th className="table-head">Amount</th>
                      <th className="table-head">Split %</th>
                      <th className="table-head">Venue share</th>
                      <th className="table-head">Admin share</th>
                      <th className="table-head">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/60">
                        <td className="table-cell text-slate-500">{formatDateTime(t.createdAt)}</td>
                        <td className="table-cell font-mono text-xs">{t.orderId}</td>
                        <td className="table-cell">{t.venueName ?? "-"}</td>
                        <td className="table-cell font-numeric font-semibold">
                          {formatCurrency(t.amount)}
                        </td>
                        <td className="table-cell">{t.splitPercentage}%</td>
                        <td className="table-cell font-numeric text-brand-700">
                          {formatCurrency(t.venueShare)}
                        </td>
                        <td className="table-cell font-numeric text-accent-700">
                          {formatCurrency(t.adminShare)}
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
          )}
        </div>
      )}
    </DashboardShell>
  );
}
