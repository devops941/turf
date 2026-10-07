"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import { SPORTS } from "@/lib/format";

export default function NewVenuePage() {
  return (
    <RequireRole roles={["VENUE_OWNER"]}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const router = useRouter();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    basePrice: "",
    openTime: "06:00",
    closeTime: "23:00",
    images: "",
    amenities: "",
  });
  const [sports, setSports] = useState<string[]>(["Football"]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggleSport = (s: string) =>
    setSports((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sports.length === 0) {
      show("Pick at least one sport", "error");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        sportTypes: sports,
        address: form.address,
        city: form.city,
        state: form.state || null,
        pincode: form.pincode || null,
        basePrice: Number(form.basePrice),
        openTime: form.openTime,
        closeTime: form.closeTime,
        images: form.images
          ? form.images.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        amenities: form.amenities
          ? form.amenities.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
      };
      const venue = await api.post<{ id: string }>("/api/venues", payload);
      show("Turf submitted for admin approval.", "success");
      router.push(`/owner/venues/${venue.id}`);
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not create turf", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardShell kind="owner" title="Add a turf" subtitle="New listings go live after admin approval.">
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card space-y-4 p-6">
          <div>
            <label className="label">Turf name</label>
            <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Greenfield Arena" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input h-24 resize-none"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Surface, lighting, facilities..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Address</label>
              <input className="input" required value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" required value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" value={form.state} onChange={(e) => set("state", e.target.value)} />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input className="input" value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Image URLs (comma separated)</label>
            <input className="input" value={form.images} onChange={(e) => set("images", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="label">Amenities (comma separated)</label>
            <input className="input" value={form.amenities} onChange={(e) => set("amenities", e.target.value)} placeholder="Floodlights, Parking, Washroom" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <label className="label">Sports offered</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SPORTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSport(s)}
                  className={`badge border ${
                    sports.includes(s)
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="card space-y-4 p-6">
            <div>
              <label className="label">Base price per hour (₹)</label>
              <input className="input" type="number" min={1} required value={form.basePrice} onChange={(e) => set("basePrice", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Opens</label>
                <input className="input" type="time" value={form.openTime} onChange={(e) => set("openTime", e.target.value)} />
              </div>
              <div>
                <label className="label">Closes</label>
                <input className="input" type="time" value={form.closeTime} onChange={(e) => set("closeTime", e.target.value)} />
              </div>
            </div>
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Submitting..." : "Submit for approval"}
            </button>
          </div>
        </div>
      </form>
    </DashboardShell>
  );
}
