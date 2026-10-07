"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Ticket } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge, EmptyState, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Booking, Venue } from "@/lib/types";

export default function OwnerBookingsPage() {
  return (
    <RequireRole roles={["VENUE_OWNER"]}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const { show } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const v = await api.get<{ items: Venue[] }>("/api/venues/mine");
      setVenues(v.items);
      const all: Booking[] = [];
      for (const venue of v.items) {
        const b = await api.get<{ items: Booking[] }>(`/api/bookings/venue/${venue.id}`);
        all.push(...b.items);
      }
      all.sort((a, b) => (a.createdAt! < b.createdAt! ? 1 : -1));
      setBookings(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const complete = async (b: Booking) => {
    try {
      await api.post(`/api/bookings/${b.id}/complete`);
      show("Booking marked completed.", "success");
      load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not update", "error");
    }
  };

  const filtered = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <DashboardShell kind="owner" title="Bookings" subtitle="All reservations across your turfs.">
      <div className="mb-4 flex flex-wrap gap-2">
        {["ALL", "CONFIRMED", "COMPLETED", "PENDING", "CANCELLED"].map((f) => (
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
        <Spinner label="Loading bookings..." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Ticket className="h-6 w-6" />} title="No bookings in this view" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-head">Player</th>
                  <th className="table-head">Venue</th>
                  <th className="table-head">Date & time</th>
                  <th className="table-head">Amount</th>
                  <th className="table-head">Status</th>
                  <th className="table-head"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const venue = venues.find((v) => v.id === b.venueId);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60">
                      <td className="table-cell">
                        <p className="font-semibold text-slate-800">{b.user?.name ?? "Player"}</p>
                        <p className="text-xs text-slate-400">{b.user?.email}</p>
                      </td>
                      <td className="table-cell">{venue?.name ?? "-"}</td>
                      <td className="table-cell">
                        {formatDate(b.slot?.date)}
                        <span className="block text-xs text-slate-400">
                          {b.slot?.startTime}-{b.slot?.endTime}
                        </span>
                      </td>
                      <td className="table-cell font-numeric font-semibold">
                        {formatCurrency(b.amount)}
                      </td>
                      <td className="table-cell">
                        <Badge status={b.status} />
                      </td>
                      <td className="table-cell text-right">
                        {b.status === "CONFIRMED" && (
                          <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => complete(b)}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
