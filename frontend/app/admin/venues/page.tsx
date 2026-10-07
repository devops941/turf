"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Store, XCircle } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge, EmptyState, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Venue } from "@/lib/types";

export default function AdminVenuesPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const { show } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter === "ALL" ? "" : `?status=${filter}`;
      const data = await api.get<{ items: Venue[] }>(`/api/venues/admin/all${q}`);
      setVenues(data.items);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (v: Venue, status: string) => {
    try {
      await api.patch(`/api/venues/${v.id}/status`, { status });
      show(`${v.name} set to ${status}.`, "success");
      load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not update", "error");
    }
  };

  return (
    <DashboardShell kind="admin" title="Venues" subtitle="Approve, suspend or review venue listings.">
      <div className="mb-4 flex flex-wrap gap-2">
        {["PENDING", "APPROVED", "SUSPENDED", "ALL"].map((f) => (
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
        <Spinner label="Loading venues..." />
      ) : venues.length === 0 ? (
        <EmptyState icon={<Store className="h-6 w-6" />} title="No venues in this view" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-head">Venue</th>
                  <th className="table-head">Owner</th>
                  <th className="table-head">City</th>
                  <th className="table-head">Price</th>
                  <th className="table-head">Rating</th>
                  <th className="table-head">Status</th>
                  <th className="table-head"></th>
                </tr>
              </thead>
              <tbody>
                {venues.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60">
                    <td className="table-cell">
                      <p className="font-semibold text-slate-800">{v.name}</p>
                      <p className="text-xs text-slate-400">{v.sportTypes?.join(", ")}</p>
                    </td>
                    <td className="table-cell">
                      <p className="text-slate-700">{v.owner?.name ?? "-"}</p>
                      <p className="text-xs text-slate-400">{v.owner?.email}</p>
                    </td>
                    <td className="table-cell">{v.city}</td>
                    <td className="table-cell font-numeric">{formatCurrency(v.basePrice)}</td>
                    <td className="table-cell">{v.rating > 0 ? `${v.rating}★` : "New"}</td>
                    <td className="table-cell">
                      <Badge status={v.status} />
                    </td>
                    <td className="table-cell">
                      <div className="flex justify-end gap-2">
                        {v.status !== "APPROVED" && (
                          <button
                            className="btn-primary !px-3 !py-1.5 text-xs"
                            onClick={() => setStatus(v, "APPROVED")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </button>
                        )}
                        {v.status !== "SUSPENDED" && (
                          <button
                            className="btn-danger !px-3 !py-1.5 text-xs"
                            onClick={() => setStatus(v, "SUSPENDED")}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Suspend
                          </button>
                        )}
                      </div>
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
