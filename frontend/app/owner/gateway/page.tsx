"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  PlugZap,
  Save,
  ShieldCheck,
  Split,
  Store,
  Trash2,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge, EmptyState, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { api, ApiError, API_URL } from "@/lib/api";
import type { Venue, VenueGatewayConfigView } from "@/lib/types";

const PROVIDERS = [
  { value: "RAZORPAY", label: "Razorpay" },
  { value: "STRIPE", label: "Stripe" },
  { value: "CASHFREE", label: "Cashfree" },
  { value: "SANDBOX", label: "Sandbox (offline simulation)" },
];

export default function OwnerGatewayPage() {
  return (
    <RequireRole roles={["VENUE_OWNER"]}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const { show } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueId, setVenueId] = useState("");
  const [config, setConfig] = useState<VenueGatewayConfigView | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState({
    provider: "RAZORPAY",
    apiKey: "",
    secretKey: "",
    webhookSecret: "",
    webhookUrl: "",
    platformAccountId: "",
    isActive: true,
  });

  useEffect(() => {
    api
      .get<{ items: Venue[] }>("/api/venues/mine")
      .then((d) => {
        setVenues(d.items);
        if (d.items[0]) setVenueId(d.items[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const load = async (id: string) => {
    const c = await api.get<VenueGatewayConfigView>(`/api/payments/venue-gateway/${id}`);
    setConfig(c);
    setForm({
      provider: c.provider,
      apiKey: c.apiKey,
      secretKey: "",
      webhookSecret: "",
      webhookUrl: c.webhookUrl ?? "",
      platformAccountId: c.platformAccountId ?? "",
      isActive: c.isActive,
    });
  };

  useEffect(() => {
    if (!venueId) return;
    setLoading(true);
    load(venueId).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/api/payments/venue-gateway/${venueId}`, {
        provider: form.provider,
        apiKey: form.apiKey,
        secretKey: form.secretKey || null,
        webhookSecret: form.webhookSecret || null,
        webhookUrl: form.webhookUrl || null,
        platformAccountId: form.platformAccountId || null,
        isActive: form.isActive,
      });
      show("Your gateway is saved. Players now pay into it.", "success");
      await load(venueId);
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not save", "error");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const res = await api.post<{ ok: boolean; message: string }>(
        `/api/payments/venue-gateway/${venueId}/test`
      );
      show(res.message, res.ok ? "success" : "error");
      await load(venueId);
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Test failed", "error");
    } finally {
      setTesting(false);
    }
  };

  const remove = async () => {
    try {
      await api.del(`/api/payments/venue-gateway/${venueId}`);
      show("Gateway removed. This venue falls back to the platform gateway.", "success");
      await load(venueId);
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not remove", "error");
    }
  };

  const webhookUrl = `${API_URL}/api/webhooks/payment`;

  return (
    <DashboardShell
      kind="owner"
      title="Payment gateway"
      subtitle="Connect your own gateway. Players pay into it and the platform share is split out automatically."
      action={
        <Badge status={config?.configured ? (config.isActive ? "ACTIVE" : "PENDING") : "PENDING"}>
          {config?.configured ? config.provider : "PLATFORM FALLBACK"}
        </Badge>
      }
    >
      {loading ? (
        <Spinner label="Loading your gateway..." />
      ) : venues.length === 0 ? (
        <EmptyState
          icon={<Store className="h-6 w-6" />}
          title="Add a venue first"
          message="You need at least one turf before you can connect a payment gateway."
        />
      ) : (
        <div className="space-y-6">
          <div className="card p-6">
            <label className="label">Venue</label>
            <select
              className="input max-w-md"
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} - {v.city}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              Each turf can use its own gateway. Turfs without one fall back to the platform
              gateway.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="card space-y-5 p-6">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-600" />
                <h2 className="font-display font-semibold text-slate-900">
                  Your gateway credentials
                </h2>
              </div>

              <div>
                <label className="label">Provider</label>
                <select
                  className="input"
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">API / public key</label>
                  <input
                    className="input"
                    value={form.apiKey}
                    onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                    placeholder="rzp_live_..."
                  />
                </div>
                <div>
                  <label className="label">
                    Secret key{" "}
                    {config?.hasSecretKey && (
                      <span className="normal-case text-slate-400">
                        (stored: {config.secretKeyMasked})
                      </span>
                    )}
                  </label>
                  <input
                    className="input"
                    type="password"
                    value={form.secretKey}
                    onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
                    placeholder="Leave blank to keep current"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">
                    Webhook secret{" "}
                    {config?.hasWebhookSecret && (
                      <span className="normal-case text-slate-400">
                        (stored: {config.webhookSecretMasked})
                      </span>
                    )}
                  </label>
                  <input
                    className="input"
                    type="password"
                    value={form.webhookSecret}
                    onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
                    placeholder="Leave blank to keep current"
                  />
                </div>
                <div>
                  <label className="label">Webhook URL</label>
                  <input
                    className="input"
                    value={form.webhookUrl}
                    onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
                    placeholder={webhookUrl}
                  />
                </div>
              </div>

              <div>
                <label className="label">Platform payout account</label>
                <input
                  className="input"
                  value={form.platformAccountId}
                  onChange={(e) => setForm({ ...form, platformAccountId: e.target.value })}
                  placeholder="acct_... (where the platform commission is routed)"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  On your gateway, the platform&apos;s commission is routed to this account after
                  each booking.
                </p>
              </div>

              <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-600"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <span className="text-sm text-slate-700">
                  Use this gateway for bookings at this venue
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
                <button className="btn-primary" onClick={save} disabled={saving}>
                  <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save gateway"}
                </button>
                <button
                  className="btn-ghost"
                  onClick={test}
                  disabled={testing || !config?.configured}
                >
                  <PlugZap className="h-4 w-4" /> {testing ? "Testing..." : "Test connection"}
                </button>
                {config?.configured && (
                  <button className="btn-ghost text-red-600" onClick={remove}>
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                )}
              </div>

              <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
                Secrets are encrypted at rest (AES-256-GCM) and never returned to the browser -
                only masked values are shown.
              </p>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center gap-2">
                  <Split className="h-5 w-5 text-brand-600" />
                  <h2 className="font-display font-semibold text-slate-900">
                    How the split works
                  </h2>
                </div>
                <ol className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      1
                    </span>
                    The player pays the full amount into <strong>your</strong> gateway.
                  </li>
                  <li className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      2
                    </span>
                    Your share stays with you - no transfer needed.
                  </li>
                  <li className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      3
                    </span>
                    The platform commission is routed from your gateway to the platform account.
                  </li>
                </ol>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-slate-500" />
                  <h2 className="font-display font-semibold text-slate-900">Webhook endpoint</h2>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Point your gateway&apos;s webhook here. Events for this venue are verified with
                  your webhook secret.
                </p>
                <code className="mt-3 block break-all rounded-xl bg-slate-900 p-3 font-mono text-xs text-brand-300">
                  POST {webhookUrl}
                </code>
              </div>

              <div className="card p-6">
                <h2 className="font-display font-semibold text-slate-900">Status</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Mode</dt>
                    <dd className="font-semibold text-slate-800">
                      {config?.configured && config.isActive
                        ? "Your gateway"
                        : "Platform gateway"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Secret key</dt>
                    <dd className="font-semibold text-slate-800">
                      {config?.hasSecretKey ? "Configured" : "Not set"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Webhook secret</dt>
                    <dd className="font-semibold text-slate-800">
                      {config?.hasWebhookSecret ? "Configured" : "Not set"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Last test</dt>
                    <dd>
                      {config?.lastTestStatus ? (
                        <Badge status={config.lastTestStatus === "OK" ? "PAID" : "FAILED"}>
                          {config.lastTestStatus}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">Never</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
