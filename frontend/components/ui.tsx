import type { ReactNode } from "react";

export function Badge({ status, children }: { status?: string; children?: ReactNode }) {
  const cls = status ? statusClass(status) : "bg-slate-100 text-slate-600";
  return <span className={`badge ${cls}`}>{children ?? status}</span>;
}

function statusClass(status: string): string {
  const map: Record<string, string> = {
    OPEN: "bg-brand-50 text-brand-700",
    HELD: "bg-amber-50 text-amber-700",
    BOOKED: "bg-slate-100 text-slate-500",
    BLOCKED: "bg-red-50 text-red-600",
    PENDING: "bg-amber-50 text-amber-700",
    CONFIRMED: "bg-brand-50 text-brand-700",
    COMPLETED: "bg-blue-50 text-blue-700",
    CANCELLED: "bg-red-50 text-red-600",
    REFUNDED: "bg-purple-50 text-purple-700",
    CAPTURED: "bg-brand-50 text-brand-700",
    PROCESSING: "bg-blue-50 text-blue-700",
    PAID: "bg-brand-50 text-brand-700",
    FAILED: "bg-red-50 text-red-600",
    APPROVED: "bg-brand-50 text-brand-700",
    SUSPENDED: "bg-red-50 text-red-600",
    ACTIVE: "bg-brand-50 text-brand-700",
    USER: "bg-slate-100 text-slate-600",
    VENUE_OWNER: "bg-blue-50 text-blue-700",
    ADMIN: "bg-accent-50 text-accent-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-600";
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "brand" | "accent" | "blue" | "slate";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    accent: "bg-accent-50 text-accent-700",
    blue: "bg-blue-50 text-blue-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="stat-value mt-2">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {icon && <span className={`rounded-xl p-2.5 ${tones[tone]}`}>{icon}</span>}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
  icon,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon && <span className="rounded-2xl bg-slate-50 p-4 text-slate-400">{icon}</span>}
      <h3 className="font-display text-lg font-semibold text-slate-800">{title}</h3>
      {message && <p className="max-w-md text-sm text-slate-500">{message}</p>}
      {action}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill={i <= Math.round(rating) ? "#f59e0b" : "#e2e8f0"}
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}
