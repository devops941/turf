"use client";

import { useEffect, useState } from "react";
import { Percent, Save, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { SplitSettings, Venue } from "@/lib/types";

interface AuditRow {
  id: string;
  action: string;
  details?: string;
  createdAt?: string;
}

export default function AdminSplitPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const { show } = useToast();
  const [settings, setSettings] = useState<SplitSettings | null>(null);
  const [history, setHistory] = useState<AuditRow[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  const [globalPct, setGlobalPct] = useState("10");
  const [venueId, setVenueId] = useState("");
  const [venuePct, setVenuePct] = useState("15");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [s, h, v] = await Promise.all([
      api.get<SplitSettings>("/api/payments/split"),
      api.get<{ items: AuditRow[] }>("/api/payments/split/history"),
      api.get<{ items: Venue[] }>("/api/venues/admin/all?status=APPROVED"),
    ]);
    setSettings(s);
    setGlobalPct(String(s.globalPercentage));
    setHistory(h.items);
    setVenues(v.items);
    if (v.items[0]) setVenueId(v.items[0].id);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveGlobal = async () => {
    setBusy(true);
    try {
      await api.put("/api/payments/split", {
        percentage: Number(globalPct),
        scope: "GLOBAL",
        note: note || null,
      });
      show(`Global commission set to ${globalPct}%.`, "success");
      setNote("");
      await load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not update", "error");
    } finally {
      setBusy(false);
    }
  };

  const saveVenue = async () => {
    if (!venueId) {
      show("Select a venue first", "error");
      return;
    }
    setBusy(true);
    try {
      await api.put("/api/payments/split", {
        percentage: Number(venuePct),
        scope: "VENUE",
        venueId,
        note: note || null,
      });
      show("Venue override saved.", "success");
      setNote("");
      await load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not update", "error");
    } finally {
      setBusy(false);
    }
  };

  const removeOverride = async (id: string) => {
    try {
      await api.del(`/api/payments/split/venue/${id}`);
      show("Override removed.", "success");
      await load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not remove", "error");
    }
  };

  return (
    <DashboardShell
      kind="admin"
      title="Split control"
      subtitle="Set the platform commission. Applies to new bookings only - historic splits stay frozen."
    >
      {loading ? (
        <Spinner label="Loading split settings..." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-brand-600" />
                <h2 className="font-display font-semibold text-slate-900">Global commission</h2>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Current default:{" "}
                <span className="font-semibold text-slate-800">{settings?.globalPercentage}%</span>{" "}
                of each booking.
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="w-40">
                  <label className="label">Percentage</label>
                  <div className="relative">
                    <input
                      className="input pr-8"
                      type="number"
                      min={0}
                      max={100}
                      step="0.5"
                      value={globalPct}
                      onChange={(e) => setGlobalPct(e.target.value)}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      %
                    </span>
                  </div>
                </div>
                <button className="btn-primary" onClick={saveGlobal} disabled={busy}>
                  <Save className="h-4 w-4" /> Update global
                </button>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-display font-semibold text-slate-900">Per-venue override</h2>
              <p className="mt-2 text-sm text-slate-500">
                Overrides take priority over the global percentage for that venue.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-[1.6fr_1fr]">
                <div>
                  <label className="label">Venue</label>
                  <select className="input" value={venueId} onChange={(e) => setVenueId(e.target.value)}>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Commission %</label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    value={venuePct}
                    onChange={(e) => setVenuePct(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="label">Note (optional)</label>
                <input
                  className="input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Reason for this change"
                />
              </div>
              <button className="btn-accent mt-4" onClick={saveVenue} disabled={busy}>
                <Save className="h-4 w-4" /> Save override
              </button>
            </div>

            <div className="card overflow-hidden">
              <div className="border-b border-slate-100 p-4">
                <h2 className="font-display font-semibold text-slate-900">Active overrides</h2>
              </div>
              {(settings?.venueOverrides ?? []).length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No venue overrides - all venues use the global rate.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px]">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="table-head">Venue</th>
                        <th className="table-head">Commission</th>
                        <th className="table-head">Effective from</th>
                        <th className="table-head"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {settings!.venueOverrides.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/60">
                          <td className="table-cell font-semibold text-slate-800">{o.venueName}</td>
                          <td className="table-cell font-numeric font-semibold text-accent-700">
                            {o.percentage}%
                          </td>
                          <td className="table-cell text-slate-500">{formatDateTime(o.effectiveFrom)}</td>
                          <td className="table-cell text-right">
                            <button
                              className="btn-ghost !px-3 !py-1.5 text-xs text-red-600"
                              onClick={() => o.venueId && removeOverride(o.venueId)}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-display font-semibold text-slate-900">Change history</h2>
            <p className="mt-1 text-xs text-slate-500">Audit trail of commission changes.</p>
            <div className="mt-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-slate-500">No changes recorded.</p>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between">
                      <Badge status="PROCESSING">{h.action.replace(/_/g, " ")}</Badge>
                      <span className="text-xs text-slate-400">{formatDateTime(h.createdAt)}</span>
                    </div>
                    {h.details && <p className="mt-2 text-xs text-slate-500">{h.details}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
