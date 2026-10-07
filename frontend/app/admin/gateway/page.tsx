"use client";

import { useEffect, useState } from "react";
import { CreditCard, PlugZap, Save, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { api, ApiError, API_URL } from "@/lib/api";
import type { GatewayConfigView } from "@/lib/types";

const PROVIDERS = [
  { value: "SANDBOX", label: "Sandbox (offline simulation)" },
  { value: "RAZORPAY", label: "Razorpay" },
  { value: "STRIPE", label: "Stripe" },
  { value: "CASHFREE", label: "Cashfree" },
];

export default function AdminGatewayPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const { show } = useToast();
  const [config, setConfig] = useState<GatewayConfigView | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState({
    provider: "SANDBOX",
    apiKey: "",
    secretKey: "",
    webhookSecret: "",
    webhookUrl: "",
  });

  const load = async () => {
    const c = await api.get<GatewayConfigView>("/api/payments/gateway-config");
    setConfig(c);
    setForm({
      provider: c.provider,
      apiKey: c.apiKey,
      secretKey: "",
      webhookSecret: "",
      webhookUrl: c.webhookUrl ?? "",
    });
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/api/payments/gateway-config", {
        provider: form.provider,
        apiKey: form.apiKey,
        secretKey: form.secretKey || null,
        webhookSecret: form.webhookSecret || null,
        webhookUrl: form.webhookUrl || null,
      });
      show("Gateway configuration saved.", "success");
      await load();
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
        "/api/payments/gateway-config/test"
      );
      show(res.message, res.ok ? "success" : "error");
      await load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Test failed", "error");
    } finally {
      setTesting(false);
    }
  };

  const webhookUrl = `${API_URL}/api/webhooks/payment`;

  return (
    <DashboardShell
      kind="admin"
      title="Payment gateway"
      subtitle="Switch providers or rotate keys without a redeploy."
      action={<Badge status={config?.isActive ? "ACTIVE" : "PENDING"}>{config?.provider ?? "SANDBOX"}</Badge>}
    >
      {loading ? (
        <Spinner label="Loading gateway config..." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="card space-y-5 p-6">
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
                    <span className="normal-case text-slate-400">(stored: {config.secretKeyMasked})</span>
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

            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" onClick={save} disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save configuration"}
              </button>
              <button className="btn-ghost" onClick={test} disabled={testing}>
                <PlugZap className="h-4 w-4" /> {testing ? "Testing..." : "Test connection"}
              </button>
            </div>

            <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
              Secrets are encrypted at rest (AES-256-GCM). They are never returned to the browser -
              only masked values are shown.
            </p>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-600" />
                <h2 className="font-display font-semibold text-slate-900">Webhook endpoint</h2>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Point your gateway&apos;s webhook to this URL. Every event is verified against the
                webhook secret before the booking is confirmed.
              </p>
              <code className="mt-3 block break-all rounded-xl bg-slate-900 p-3 font-mono text-xs text-brand-300">
                POST {webhookUrl}
              </code>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-slate-500" />
                <h2 className="font-display font-semibold text-slate-900">Status</h2>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Provider</dt>
                  <dd className="font-semibold text-slate-800">{config?.provider}</dd>
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
      )}
    </DashboardShell>
  );
}
