"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Store } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge, EmptyState, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Venue } from "@/lib/types";

export default function OwnerVenuesPage() {
  return (
    <RequireRole roles={["VENUE_OWNER"]}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ items: Venue[] }>("/api/venues/mine")
      .then((d) => setVenues(d.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell
      kind="owner"
      title="My turfs"
      subtitle="Create and manage your venue listings."
      action={
        <Link href="/owner/venues/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Add turf
        </Link>
      }
    >
      {loading ? (
        <Spinner label="Loading turfs..." />
      ) : venues.length === 0 ? (
        <EmptyState
          icon={<Store className="h-6 w-6" />}
          title="No turfs yet"
          message="Add your first venue. An admin will review and approve it."
          action={
            <Link href="/owner/venues/new" className="btn-primary mt-2">
              Add turf
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <Link key={v.id} href={`/owner/venues/${v.id}`} className="card p-4 hover:shadow-lift">
              <div className="flex items-start justify-between">
                <h3 className="font-display font-semibold text-slate-900">{v.name}</h3>
                <Badge status={v.status} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {v.address}, {v.city}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {v.sportTypes?.map((s) => (
                  <span key={s} className="badge bg-slate-100 text-slate-600">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="font-numeric font-semibold text-slate-800">
                  {formatCurrency(v.basePrice)}/hr
                </span>
                <span className="text-xs text-slate-400">
                  {v.openTime}-{v.closeTime}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
