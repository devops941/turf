"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  CalendarX,
  Clock,
  MapPin,
  Star,
  Ticket,
  Trophy,
} from "lucide-react";
import { Navbar, Footer } from "@/components/Navbar";
import { Badge, EmptyState, Spinner, StatCard } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Booking } from "@/lib/types";

const FALLBACK =
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=400&q=70";

export default function DashboardPage() {
  const { show } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewFor, setReviewFor] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ items: Booking[] }>("/api/bookings/mine");
      setBookings(data.items);
    } catch {
      show("Could not load your bookings", "error");
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (b: Booking) => {
    if (!confirm("Cancel this booking? Confirmed bookings are refunded in full.")) return;
    try {
      const res = await api.post<{ refunded: number }>(`/api/bookings/${b.id}/cancel`);
      show(
        res.refunded > 0
          ? `Booking cancelled. Refund of ${formatCurrency(res.refunded)} initiated.`
          : "Booking cancelled.",
        "success"
      );
      load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not cancel", "error");
    }
  };

  const submitReview = async () => {
    if (!reviewFor) return;
    setSaving(true);
    try {
      await api.post("/api/reviews", {
        bookingId: reviewFor.id,
        rating,
        comment: comment || null,
      });
      show("Thanks for your review!", "success");
      setReviewFor(null);
      setComment("");
      setRating(5);
      load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not submit review", "error");
    } finally {
      setSaving(false);
    }
  };

  const upcoming = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING");
  const past = bookings.filter((b) => ["COMPLETED", "CANCELLED", "REFUNDED"].includes(b.status));
  const totalSpent = bookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
    .reduce((s, b) => s + b.amount, 0);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">My bookings</h1>
            <p className="mt-1 text-sm text-slate-500">Track your games and manage reservations.</p>
          </div>
          <Link href="/venues" className="btn-primary">
            <Trophy className="h-4 w-4" /> Book a new turf
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total bookings" value={bookings.length} icon={<Ticket className="h-5 w-5" />} />
          <StatCard
            label="Upcoming"
            value={upcoming.length}
            icon={<CalendarDays className="h-5 w-5" />}
            tone="blue"
          />
          <StatCard
            label="Total spent"
            value={formatCurrency(totalSpent)}
            icon={<Star className="h-5 w-5" />}
            tone="accent"
          />
        </div>

        {loading ? (
          <Spinner label="Loading bookings..." />
        ) : bookings.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<Ticket className="h-6 w-6" />}
              title="No bookings yet"
              message="Find a turf near you and lock in your first slot."
              action={
                <Link href="/venues" className="btn-primary mt-2">
                  Explore turfs
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-slate-900">Upcoming</h2>
              {upcoming.length === 0 ? (
                <p className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-soft">
                  No upcoming games.
                </p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {upcoming.map((b) => (
                    <BookingCard key={b.id} booking={b} onCancel={cancel} />
                  ))}
                </div>
              )}
            </section>

            {past.length > 0 && (
              <section>
                <h2 className="mb-3 font-display text-lg font-semibold text-slate-900">History</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {past.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      reviewed={b.reviewed}
                      onReview={() => setReviewFor(b)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {reviewFor && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-900/40 p-4">
          <div className="card w-full max-w-md p-6 animate-fade-up">
            <h3 className="font-display text-lg font-semibold text-slate-900">Rate your experience</h3>
            <p className="mt-1 text-sm text-slate-500">{reviewFor.venue?.name}</p>
            <div className="mt-4 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} onClick={() => setRating(i)}>
                  <Star
                    className={`h-8 w-8 ${
                      i <= rating ? "fill-accent-500 text-accent-500" : "text-slate-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              className="input mt-4 h-24 resize-none"
              placeholder="Share what you liked (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setReviewFor(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={submitReview} disabled={saving}>
                {saving ? "Submitting..." : "Submit review"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function BookingCard({
  booking,
  onCancel,
  onReview,
  reviewed,
}: {
  booking: Booking;
  onCancel?: (b: Booking) => void;
  onReview?: (b: Booking) => void;
  reviewed?: boolean;
}) {
  const canCancel = booking.status === "CONFIRMED" || booking.status === "PENDING";
  return (
    <div className="card flex gap-4 p-4">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
        <Image
          src={booking.venue?.images?.[0] || FALLBACK}
          alt={booking.venue?.name ?? "Venue"}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display font-semibold text-slate-900">
              {booking.venue?.name ?? "Venue"}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" /> {booking.venue?.city}
            </p>
          </div>
          <Badge status={booking.status} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> {formatDate(booking.slot?.date)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {booking.slot?.startTime}-{booking.slot?.endTime}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="font-numeric font-bold text-slate-900">
            {formatCurrency(booking.amount)}
          </span>
          <div className="flex gap-2">
            {canCancel && onCancel && (
              <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => onCancel(booking)}>
                <CalendarX className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
            {booking.status === "COMPLETED" && onReview && !reviewed && (
              <button className="btn-accent !px-3 !py-1.5 text-xs" onClick={() => onReview(booking)}>
                <Star className="h-3.5 w-3.5" /> Review
              </button>
            )}
            {reviewed && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" /> Reviewed
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
