"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, IndianRupee, Plus, Store, TrendingUp } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { StatCard, Spinner, EmptyState, Badge } from "@/components/ui";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Booking, Earnings, Venue } from "@/lib/types";

export default function OwnerOverview() {
  return (
    <RequireRole roles={["VENUE_OWNER"]}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const v = await api.get<{ items: Venue[] }>("/api/venues/mine");
        setVenues(v.items);
        const e = await api.get<Earnings>("/api/payments/earnings/mine");
        setEarnings(e);

        // Gather bookings across this owner's venues.
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
    })();
  }, []);

  const approved = venues.filter((v) => v.status === "APPROVED").length;
  const upcoming = bookings.filter((b) => b.status === "CONFIRMED").length;

  return (
    <DashboardShell
      kind="owner"
      title="Owner console"
      subtitle="Manage your turfs, bookings and payouts."
      action={
        <Link href="/owner/venues/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Add turf
        </Link>
      }
    >
      {loading ? (
        <Spinner label="Loading your console..." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total turfs"
              value={venues.length}
              hint={`${approved} approved`}
              icon={<Store className="h-5 w-5" />}
            />
            <StatCard
              label="Upcoming bookings"
              value={upcoming}
              icon={<CalendarDays className="h-5 w-5" />}
              tone="blue"
            />
            <StatCard
              label="Gross earnings"
              value={formatCurrency(earnings?.grossEarnings ?? 0)}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="accent"
            />
            <StatCard
              label="Pending payouts"
              value={formatCurrency(earnings?.pendingPayouts ?? 0)}
              hint={`${formatCurrency(earnings?.settledPayouts ?? 0)} settled`}
              icon={<IndianRupee className="h-5 w-5" />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="font-display font-semibold text-slate-900">Your turfs</h2>
              <div className="mt-4 space-y-3">
                {venues.length === 0 ? (
                  <EmptyState
                    icon={<Store className="h-6 w-6" />}
                    title="No turfs yet"
                    message="Add your first venue to start receiving bookings."
                    action={
                      <Link href="/owner/venues/new" className="btn-primary mt-2">
                        Add turf
                      </Link>
                    }
                  />
                ) : (
                  venues.slice(0, 4).map((v) => (
                    <Link
                      key={v.id}
                      href={`/owner/venues/${v.id}`}
                      className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{v.name}</p>
                        <p className="text-xs text-slate-500">
                          {v.city} · {formatCurrency(v.basePrice)}/hr
                        </p>
                      </div>
                      <Badge status={v.status} />
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-display font-semibold text-slate-900">Recent bookings</h2>
              <div className="mt-4 space-y-3">
                {bookings.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    No bookings yet.
                  </p>
                ) : (
                  bookings.slice(0, 5).map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {b.user?.name ?? "Player"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(b.slot?.date)} · {b.slot?.startTime}-{b.slot?.endTime}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-numeric font-semibold text-slate-800">
                          {formatCurrency(b.amount)}
                        </p>
                        <Badge status={b.status} />
                      </div>
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
