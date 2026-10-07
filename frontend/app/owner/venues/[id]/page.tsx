"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarPlus, Clock, Lock, Unlock } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge, SectionTitle, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, todayISO } from "@/lib/format";
import type { Slot, Venue } from "@/lib/types";

export default function OwnerVenueDetail() {
  return (
    <RequireRole roles={["VENUE_OWNER"]}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { show } = useToast();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [genBusy, setGenBusy] = useState(false);
  const [gen, setGen] = useState({ startTime: "06:00", endTime: "23:00", durationMinutes: "60", price: "" });

  useEffect(() => {
    api
      .get<Venue>(`/api/venues/${id}`)
      .then((v) => {
        setVenue(v);
        setGen((g) => ({ ...g, startTime: v.openTime, endTime: v.closeTime, price: String(v.basePrice) }));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const loadSlots = useCallback(async () => {
    const data = await api.get<{ items: Slot[] }>(`/api/venues/${id}/slots?date=${date}`);
    setSlots(data.items);
  }, [id, date]);

  useEffect(() => {
    if (venue) loadSlots();
  }, [venue, loadSlots]);

  const generate = async () => {
    setGenBusy(true);
    try {
      const res = await api.post<{ created: number }>(`/api/venues/${id}/slots/generate`, {
        date,
        startTime: gen.startTime,
        endTime: gen.endTime,
        durationMinutes: Number(gen.durationMinutes),
        price: gen.price ? Number(gen.price) : null,
      });
      show(`${res.created} slot(s) created.`, "success");
      loadSlots();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not generate slots", "error");
    } finally {
      setGenBusy(false);
    }
  };

  const toggle = async (slot: Slot) => {
    const next = slot.status === "OPEN" ? "BLOCKED" : "OPEN";
    try {
      await api.patch(`/api/slots/${slot.id}/status`, { status: next });
      loadSlots();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not update slot", "error");
    }
  };

  if (loading) {
    return (
      <DashboardShell kind="owner" title="Turf">
        <Spinner />
      </DashboardShell>
    );
  }
  if (!venue) {
    return (
      <DashboardShell kind="owner" title="Turf not found">
        <Link href="/owner/venues" className="btn-primary">
          Back
        </Link>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      kind="owner"
      title={venue.name}
      subtitle={`${venue.address}, ${venue.city}`}
      action={<Badge status={venue.status} />}
    >
      <Link href="/owner/venues" className="btn-ghost mb-4">
        <ArrowLeft className="h-4 w-4" /> All turfs
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card p-6">
          <SectionTitle
            title="Slot calendar"
            subtitle="Publish bookable slots for a date, then block or reopen them."
          />
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="date"
              className="input max-w-[190px]"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <span className="text-xs text-slate-400">{slots.length} slots on this date</span>
          </div>

          {slots.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              No slots for {date}. Generate them using the panel on the right.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-xl border p-3 ${
                    s.status === "OPEN"
                      ? "border-brand-100 bg-brand-50/40"
                      : s.status === "BOOKED"
                        ? "border-slate-200 bg-slate-50"
                        : s.status === "HELD"
                          ? "border-amber-100 bg-amber-50"
                          : "border-red-100 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-numeric text-sm font-semibold text-slate-800">
                      {s.startTime}
                    </span>
                    <Badge status={s.status} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{formatCurrency(s.price)}</span>
                    {s.status !== "BOOKED" && s.status !== "HELD" && (
                      <button
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                        onClick={() => toggle(s)}
                      >
                        {s.status === "OPEN" ? (
                          <span className="inline-flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Block
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Unlock className="h-3 w-3" /> Open
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-display font-semibold text-slate-900">Generate slots</h2>
            <p className="mt-1 text-xs text-slate-500">For {date}</p>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start</label>
                  <input className="input" type="time" value={gen.startTime} onChange={(e) => setGen({ ...gen, startTime: e.target.value })} />
                </div>
                <div>
                  <label className="label">End</label>
                  <input className="input" type="time" value={gen.endTime} onChange={(e) => setGen({ ...gen, endTime: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Duration (min)</label>
                  <select
                    className="input"
                    value={gen.durationMinutes}
                    onChange={(e) => setGen({ ...gen, durationMinutes: e.target.value })}
                  >
                    {[30, 45, 60, 90, 120].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Price / slot</label>
                  <input
                    className="input"
                    type="number"
                    value={gen.price}
                    onChange={(e) => setGen({ ...gen, price: e.target.value })}
                  />
                </div>
              </div>
              <button className="btn-primary w-full" onClick={generate} disabled={genBusy}>
                <CalendarPlus className="h-4 w-4" />
                {genBusy ? "Generating..." : "Generate slots"}
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-display font-semibold text-slate-900">Venue details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Base price</dt>
                <dd className="font-semibold text-slate-800">{formatCurrency(venue.basePrice)}/hr</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Hours</dt>
                <dd className="inline-flex items-center gap-1 font-semibold text-slate-800">
                  <Clock className="h-3.5 w-3.5" />
                  {venue.openTime}-{venue.closeTime}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Sports</dt>
                <dd className="text-right font-semibold text-slate-800">
                  {venue.sportTypes?.join(", ")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Rating</dt>
                <dd className="font-semibold text-slate-800">
                  {venue.rating > 0 ? `${venue.rating} (${venue.reviewCount})` : "New"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
