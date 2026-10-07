export function formatCurrency(value: number | undefined | null): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value?: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export const STATUS_STYLES: Record<string, string> = {
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
};

export function statusClass(status: string | undefined): string {
  if (!status) return "bg-slate-100 text-slate-600";
  return STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
}

export const SPORTS = [
  "Football",
  "Cricket",
  "Badminton",
  "Tennis",
  "Basketball",
  "Volleyball",
  "Futsal",
  "Hockey",
  "Pickleball",
  "Table Tennis",
];
