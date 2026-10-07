"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Navbar, Footer } from "@/components/Navbar";
import { EmptyState, SectionTitle, Spinner, Stars } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { formatCurrency, todayISO } from "@/lib/format";
import type { Review, Slot, Venue } from "@/lib/types";

const FALLBACK =
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=70";

export default function VenueDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const { show } = useToast();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotLoading, setSlotLoading] = useState(false);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [booking, setBooking] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const v = await api.get<Venue>(`/api/venues/${id}`);
        setVenue(v);
        const r = await api.get<{ items: Review[] }>(`/api/reviews/venue/${id}`);
        setReviews(r.items);
      } catch {
        show("Could not load this venue", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, show]);

  const loadSlots = useCallback(async () => {
    setSlotLoading(true);
    setSelected(null);
    try {
      const data = await api.get<{ items: Slot[] }>(`/api/venues/${id}/slots?date=${date}`);
      setSlots(data.items);
    } catch {
      setSlots([]);
    } finally {
      setSlotLoading(false);
    }
  }, [id, date]);

  useEffect(() => {
    if (venue) loadSlots();
  }, [venue, loadSlots]);

  const book = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "USER") {
      show("Only player accounts can book slots.", "error");
      return;
    }
    if (!selected) return;

    setBooking(true);
    try {
      const res = await api.post<{ booking: { id: string } }>("/api/bookings", {
        slotId: selected.id,
      });
      show("Slot held for you - complete payment to confirm.", "success");
      router.push(`/checkout/${res.booking.id}`);
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not start booking", "error");
      loadSlots();
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <Spinner label="Loading venue..." />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-16">
          <EmptyState
            title="Venue not found"
            message="This venue may have been removed."
            action={
              <Link href="/venues" className="btn-primary">
                Back to explore
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const images = venue.images?.length ? venue.images : [FALLBACK];
  const days = [0, 1, 2, 3, 4, 5, 6].map((o) => todayISO(o));

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <button onClick={() => router.back()} className="btn-ghost mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Left: gallery + info */}
          <div className="space-y-6">
            <div>
              <div className="relative h-72 overflow-hidden rounded-2xl sm:h-96">
                <Image
                  src={images[activeImg]}
                  alt={venue.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute left-4 top-4 flex gap-2">
                  {venue.sportTypes?.map((s) => (
                    <span key={s} className="badge bg-white/90 text-slate-700 backdrop-blur">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                        i === activeImg ? "ring-brand-500" : "ring-transparent"
                      }`}
                    >
                      <Image src={img} alt="" fill sizes="96px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-slate-900">{venue.name}</h1>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    {venue.address}, {venue.city}
                    {venue.state ? `, ${venue.state}` : ""} {venue.pincode}
                  </p>
                </div>
                {venue.rating > 0 && (
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Stars rating={venue.rating} size={16} />
                      <span className="font-numeric font-bold text-slate-800">{venue.rating}</span>
                    </div>
                    <p className="text-xs text-slate-400">{venue.reviewCount} reviews</p>
                  </div>
                )}
              </div>

              {venue.description && (
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{venue.description}</p>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <Clock className="h-5 w-5 text-brand-600" />
                  <div>
                    <p className="text-xs text-slate-400">Open hours</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {venue.openTime} - {venue.closeTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <Sparkles className="h-5 w-5 text-accent-500" />
                  <div>
                    <p className="text-xs text-slate-400">Starting at</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatCurrency(venue.basePrice)} / hour
                    </p>
                  </div>
                </div>
              </div>

              {venue.amenities?.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amenities
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {venue.amenities.map((a) => (
                      <span key={a} className="badge bg-slate-100 text-slate-600">
                        <CheckCircle2 className="h-3 w-3" /> {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {reviews.length > 0 && (
              <div className="card p-6">
                <SectionTitle title="Reviews" subtitle={`${reviews.length} player reviews`} />
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-800">{r.user?.name ?? "Player"}</p>
                        <Stars rating={r.rating} />
                      </div>
                      {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: booking */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="card p-5">
              <h2 className="font-display text-lg font-semibold text-slate-900">Select a slot</h2>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {days.map((d) => {
                  const dt = new Date(d + "T00:00:00");
                  const active = d === date;
                  return (
                    <button
                      key={d}
                      onClick={() => setDate(d)}
                      className={`shrink-0 rounded-xl px-3 py-2 text-center transition ${
                        active ? "bg-brand-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <p className="text-[10px] uppercase">
                        {dt.toLocaleDateString("en-IN", { weekday: "short" })}
                      </p>
                      <p className="font-numeric text-sm font-bold">{dt.getDate()}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4">
                {slotLoading ? (
                  <div className="py-8">
                    <Spinner />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                    No slots published for this date yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((s) => {
                      const available = s.status === "OPEN";
                      const isSelected = selected?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          disabled={!available}
                          onClick={() => setSelected(s)}
                          className={`rounded-xl border px-2 py-2.5 text-center transition ${
                            isSelected
                              ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                              : available
                                ? "border-slate-200 hover:border-brand-300 hover:bg-brand-50/50"
                                : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                          }`}
                        >
                          <p className={`font-numeric text-sm font-semibold ${available ? "text-slate-800" : ""}`}>
                            {s.startTime}
                          </p>
                          <p className={`text-[11px] ${available ? "text-slate-500" : ""}`}>
                            {formatCurrency(s.price)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {slots.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-3 w-3 rounded border border-slate-300" /> Available
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-brand-500" /> Selected
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-slate-200" /> Booked
                  </span>
                </div>
              )}

              <div className="mt-5 border-t border-slate-100 pt-4">
                {selected ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" /> {selected.date}
                      </span>
                      <span>
                        {selected.startTime} - {selected.endTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Total</span>
                      <span className="font-numeric text-xl font-bold text-slate-900">
                        {formatCurrency(selected.price)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Pick an open slot to continue.</p>
                )}

                <button
                  className="btn-primary mt-4 w-full"
                  disabled={!selected || booking}
                  onClick={book}
                >
                  {booking ? "Holding slot..." : user ? "Proceed to pay" : "Sign in to book"}
                </button>
                <p className="mt-2 text-center text-xs text-slate-400">
                  Slot is held for 10 minutes while you pay.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
