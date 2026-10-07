"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Lock,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Navbar, Footer } from "@/components/Navbar";
import { Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Booking } from "@/lib/types";

interface Order {
  provider: string;
  gatewayOrderId: string;
  publicKey: string;
  amount: number;
  amountMinor: number;
  currency: string;
  sandbox: boolean;
}

export default function CheckoutPage() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params.bookingId;
  const router = useRouter();
  const { show } = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const b = await api.get<Booking>(`/api/bookings/${bookingId}`);
        setBooking(b);
        // Re-create/re-fetch a gateway order view for display. The backend
        // returns order details at booking creation; for a refresh we show the
        // stored order id and re-verify at pay time.
        setOrder({
          provider: "SANDBOX",
          gatewayOrderId: b.orderId,
          publicKey: "",
          amount: b.amount,
          amountMinor: Math.round(b.amount * 100),
          currency: "INR",
          sandbox: true,
        });
      } catch {
        show("Could not load this booking", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId, show]);

  const pay = async () => {
    if (!booking) return;
    setPaying(true);
    try {
      const res = await api.post<{ booking: Booking }>(
        `/api/bookings/${bookingId}/verify-payment`,
        { orderId: booking.orderId, paymentId: `pay_${Date.now()}` }
      );
      setDone(true);
      show("Payment successful - booking confirmed!", "success");
      setTimeout(() => router.push("/dashboard"), 1600);
      return res;
    } catch (err) {
      if (err instanceof ApiError && err.status === 202) {
        show("Awaiting gateway webhook confirmation. This can take a moment.", "info");
        setTimeout(() => router.push("/dashboard"), 2500);
      } else {
        show(err instanceof ApiError ? err.message : "Payment failed", "error");
      }
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <Spinner label="Preparing checkout..." />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-slate-500">Booking not found.</p>
          <Link href="/venues" className="btn-primary mt-4">
            Explore turfs
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold text-slate-900">Booking confirmed!</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your slot at {booking.venue?.name ?? "the venue"} is locked in. Redirecting to your
            bookings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <button onClick={() => router.back()} className="btn-ghost mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="font-display text-2xl font-bold text-slate-900">Complete your payment</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your slot is on hold. Finish payment before the hold expires.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="font-display font-semibold text-slate-900">Order summary</h2>
              <div className="mt-4 space-y-3 text-sm">
                <Row label="Venue" value={booking.venue?.name ?? "-"} />
                <Row
                  label="Date & time"
                  value={
                    booking.slot
                      ? `${booking.slot.date} · ${booking.slot.startTime}-${booking.slot.endTime}`
                      : "-"
                  }
                />
                <Row label="Order ID" value={booking.orderId} mono />
                <Row label="Gateway" value={order?.provider ?? "-"} />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="font-semibold text-slate-700">Amount payable</span>
                <span className="font-numeric text-2xl font-bold text-slate-900">
                  {formatCurrency(booking.amount)}
                </span>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-display font-semibold text-slate-900">Payment method</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border-2 border-brand-500 bg-brand-50/50 p-4">
                  <CreditCard className="h-5 w-5 text-brand-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">Card / UPI / Netbanking</p>
                    <p className="text-xs text-slate-500">
                      Processed securely via {order?.provider ?? "gateway"}
                    </p>
                  </div>
                  <span className="badge bg-brand-600 text-white">Selected</span>
                </div>
                {order?.sandbox && (
                  <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
                    Sandbox gateway is active. No real money moves - payments are simulated and
                    split payouts are recorded in the ledger.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="card p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <Lock className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Secure checkout</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {formatCurrency(booking.amount)} will be captured and split automatically between
                the venue and the platform.
              </p>
              <button className="btn-primary mt-5 w-full" onClick={pay} disabled={paying}>
                <Wallet className="h-4 w-4" />
                {paying ? "Processing..." : `Pay ${formatCurrency(booking.amount)}`}
              </button>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4" />
                PCI-DSS compliant · your card details never touch our servers
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                <Clock className="h-4 w-4" />
                <span>
                  Hold expires{" "}
                  {booking.holdExpiresAt
                    ? new Date(booking.holdExpiresAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "in 10 minutes"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
