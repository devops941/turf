"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Volleyball,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Venue } from "@/lib/types";

/* ------------------------------------------------------------------ content */

const TICKER = [
  "Live slots in 40+ cities",
  "Owner payouts split automatically",
  "Instant confirmation",
  "Verified turfs only",
  "Zero booking fees",
  "Floodlights checked nightly",
];

const STEPS = [
  {
    n: "01",
    title: "Find your pitch",
    body: "Filter by city, sport and time. Real-time availability means what you see is what you get.",
    icon: MapPin,
  },
  {
    n: "02",
    title: "Lock the slot",
    body: "Pick a slot, pay in seconds. Bookings confirm instantly and sync to the venue's calendar.",
    icon: Zap,
  },
  {
    n: "03",
    title: "Play under lights",
    body: "Turn up, play, done. Earn loyalty points and rebook your favourite surface in one tap.",
    icon: Volleyball,
  },
];

const REASONS = [
  {
    title: "Dynamic gateways",
    body: "Every venue can plug in its own payment provider. Payouts split automatically - no chasing invoices.",
    icon: Zap,
    accent: "volt",
  },
  {
    title: "Real-time slots",
    body: "A booking engine that never double-books. Held slots expire on their own, so the calendar stays honest.",
    icon: Clock,
    accent: "flame",
  },
  {
    title: "Trust, verified",
    body: "Every turf is inspected and approved. Weather-safe surfaces, checked floodlights, fair pricing.",
    icon: ShieldCheck,
    accent: "volt",
  },
  {
    title: "One tap rebook",
    body: "Your people, your pitch, your time - saved. Rebook last week's game in a single tap.",
    icon: CalendarDays,
    accent: "flame",
  },
];

const STATS = [
  { value: "2.4k", label: "Turfs live" },
  { value: "180k", label: "Games played" },
  { value: "4.9", label: "Avg rating" },
  { value: "40+", label: "Cities" },
];

const SPORTS = ["Football", "Cricket", "Badminton", "Pickleball", "Tennis", "Basketball"];

const TESTIMONIALS = [
  {
    quote:
      "We stopped chasing payments entirely. Every booking, the split just lands. The turf runs itself now.",
    name: "Ravi Kumar",
    role: "Owner, Greenfield Arena",
  },
  {
    quote:
      "Found a floodlit 5-a-side at 11pm on a Tuesday. Booked it in four taps. This is how it should work.",
    name: "Arjun Sharma",
    role: "Weekend captain",
  },
];

/* ------------------------------------------------------------ tiny utilities */

/** Poster line with an animated sweep highlight on load. */
function PosterSweep({ children, delay = 0 }: { children: string; delay?: number }) {
  return (
    <span
      className="relative inline-block bg-gradient-to-r from-volt-200 via-white to-volt-200 bg-[length:200%_100%] bg-clip-text text-transparent"
      style={{ animation: `sweep 6s linear infinite`, animationDelay: `${delay}s` }}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------------- page */

export default function HomePage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    api
      .get<{ items: Venue[] }>("/api/venues?limit=5")
      .then((d) => setVenues(d.items.slice(0, 5)))
      .catch(() => setVenues([]));
  }, []);

  useEffect(() => {
    if (venues.length < 2) return;
    const id = setInterval(() => setActive((a) => (a + 1) % venues.length), 5200);
    return () => clearInterval(id);
  }, [venues.length]);

  const featured = venues[active];

  return (
    <div className="min-h-screen bg-ink-950 text-white [font-family:var(--font-grotesk)] selection:bg-volt-400 selection:text-ink-950">
      <RevealOnScroll />
      <Navbar />

      <main>
        {/* ============================================================ HERO */}
        <section className="grain relative overflow-hidden border-b border-white/10">
          {/* floodlight glows + pitch markings */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -left-40 -top-40 h-[42rem] w-[42rem] rounded-full bg-volt-400/20 blur-[120px]" />
            <div className="absolute -right-32 top-10 h-[34rem] w-[34rem] rounded-full bg-flame-500/20 blur-[130px]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-volt-400/70 to-transparent" />
            <div
              className="absolute inset-0 opacity-[0.14]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
                backgroundSize: "64px 64px",
                maskImage: "radial-gradient(ellipse at 50% 0%, black 40%, transparent 78%)",
              }}
            />
            <div className="absolute right-[8%] top-1/2 hidden h-72 w-72 -translate-y-1/2 rounded-full border border-white/10 lg:block">
              <div className="absolute inset-8 rounded-full border border-white/10" />
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />
            </div>
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
            {/* left: poster type */}
            <div className="flex flex-col justify-center">
              <div className="mb-7 flex flex-wrap items-center gap-3">
                <span className="eyebrow flex items-center gap-2 rounded-full border border-volt-400/40 bg-volt-400/10 px-3.5 py-1.5 text-volt-300">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-volt-400" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-volt-400" />
                  </span>
                  Live now
                </span>
                <span className="eyebrow text-white/40">Est. 2024 · India</span>
              </div>

              <h1 className="text-poster text-[clamp(3.1rem,10vw,7.6rem)]">
                <span className="block text-white">Own the</span>
                <PosterSweep>night.</PosterSweep>
                <span className="mt-1 block text-white/25">Play the turf.</span>
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/60">
                India&apos;s fairest way to book a pitch. Real slots, verified venues, and payouts
                that split themselves - so owners get paid the moment you play.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="/venues"
                  className="group inline-flex items-center gap-2 rounded-full bg-volt-400 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-ink-950 transition hover:bg-volt-300"
                >
                  Explore turfs
                  <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link
                  href="/signup"
                  className="link-underline text-sm font-semibold uppercase tracking-wide text-white/80 hover:text-white"
                >
                  List your turf
                </Link>
              </div>

              <dl className="mt-12 grid max-w-lg grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <dt className="text-poster text-3xl text-volt-400">{s.value}</dt>
                    <dd className="eyebrow mt-1 text-white/40">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* right: live venue card, editorial numbered frame */}
            <div className="relative">
              <div className="absolute -left-4 -top-4 hidden select-none text-poster text-[10rem] leading-none text-white/[0.04] lg:block">
                {String(active + 1).padStart(2, "0")}
              </div>

              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-ink-900/80 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                  <span className="eyebrow text-volt-300">Tonight&apos;s pick</span>
                  <span className="eyebrow text-white/35">
                    {featured ? `${active + 1} / ${venues.length}` : "-- / --"}
                  </span>
                </div>

                <div className="relative h-52 overflow-hidden bg-ink-800">
                  {featured?.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.images[0]}
                      alt={featured.name}
                      className="h-full w-full object-cover opacity-80 transition duration-700"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-white/20">
                      <Volleyball className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/20 to-transparent" />
                  {featured && (
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-ink-950/70 px-2.5 py-1 text-xs font-semibold text-volt-300 backdrop-blur">
                      <Star className="h-3 w-3 fill-volt-400 text-volt-400" />
                      {featured.rating ? featured.rating.toFixed(1) : "New"}
                    </span>
                  )}
                </div>

                <div className="space-y-4 p-5">
                  {featured ? (
                    <>
                      <div>
                        <h2 className="font-display text-xl font-bold text-white">
                          {featured.name}
                        </h2>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/50">
                          <MapPin className="h-3.5 w-3.5 text-volt-400" />
                          {featured.city}
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/10 pt-4">
                        <div>
                          <p className="eyebrow text-white/35">From</p>
                          <p className="font-numeric text-lg font-bold text-white">
                            {formatCurrency(featured.basePrice)}
                            <span className="text-sm font-medium text-white/40">/hr</span>
                          </p>
                        </div>
                        <Link
                          href={`/venues/${featured.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-volt-300"
                        >
                          Book now <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="py-6 text-center text-sm text-white/40">
                      Loading live turfs…
                    </div>
                  )}
                </div>
              </div>

              {/* floating confirm chip */}
              <div className="absolute -bottom-5 -left-5 hidden items-center gap-2.5 rounded-2xl border border-white/10 bg-ink-900/95 px-4 py-3 shadow-xl sm:flex">
                <CheckCircle2 className="h-4 w-4 text-volt-400" />
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-white">Slot confirmed</p>
                  <p className="eyebrow text-white/35">Split paid out</p>
                </div>
              </div>
            </div>
          </div>

          {/* ticker */}
          <div className="relative border-t border-white/10 bg-ink-950/60 py-3">
            <div className="flex overflow-hidden">
              {[0, 1].map((row) => (
                <div
                  key={row}
                  aria-hidden={row === 1}
                  className="animate-ticker flex shrink-0 items-center gap-3 whitespace-nowrap pr-3"
                >
                  {[...TICKER, ...TICKER].map((t, i) => (
                    <span key={i} className="flex items-center gap-3">
                      <span className="eyebrow text-white/55">{t}</span>
                      <span className="text-volt-400">✦</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= SPORTS */}
        <section className="border-b border-white/10 bg-ink-900">
          <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <span className="eyebrow text-white/35">Disciplines</span>
              {SPORTS.map((s) => (
                <Link
                  key={s}
                  href="/venues"
                  className="text-poster text-xl text-white/30 transition hover:text-volt-400"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ==================================================== HOW IT WORKS */}
        <section className="grain relative border-b border-white/10 bg-ink-950">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
            <div className="reveal flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="eyebrow text-volt-400">The ritual</span>
                <h2 className="text-poster mt-4 text-[clamp(2.4rem,6vw,4.5rem)] text-white">
                  Three steps.
                  <br />
                  <span className="text-white/25">Game on.</span>
                </h2>
              </div>
              <p className="max-w-sm text-white/50">
                From wanting a game to walking onto the pitch in under a minute. No calls, no
                waiting rooms, no maybes.
              </p>
            </div>

            <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div
                  key={s.n}
                  className="reveal group relative bg-ink-900 p-8 transition hover:bg-ink-800"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <span className="text-poster text-6xl text-white/10 transition group-hover:text-volt-400/40">
                    {s.n}
                  </span>
                  <s.icon className="mt-6 h-6 w-6 text-volt-400" />
                  <h3 className="mt-4 font-display text-lg font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================================================== WHY / BENTO */}
        <section className="border-b border-white/10 bg-ink-900">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
            <div className="reveal max-w-2xl">
              <span className="eyebrow text-flame-400">Why players & owners stay</span>
              <h2 className="text-poster mt-4 text-[clamp(2.4rem,6vw,4.5rem)] text-white">
                Built for the
                <span className="text-white/25"> beautiful game.</span>
              </h2>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {/* big feature */}
              <div className="reveal group relative overflow-hidden rounded-3xl border border-volt-400/25 bg-gradient-to-br from-volt-400/15 via-ink-800 to-ink-900 p-8 md:col-span-2">
                <div
                  aria-hidden
                  className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-volt-400/20 blur-3xl transition group-hover:bg-volt-400/30"
                />
                <div className="relative">
                  <span className="eyebrow inline-flex items-center gap-2 rounded-full bg-volt-400/15 px-3 py-1.5 text-volt-300">
                    <Sparkles className="h-3.5 w-3.5" /> Flagship
                  </span>
                  <h3 className="text-poster mt-6 text-4xl text-white sm:text-5xl">
                    One platform.
                    <br />
                    Every payout, split.
                  </h3>
                  <p className="mt-4 max-w-md text-white/55">
                    Venue owners connect their own gateway; the platform&apos;s cut routes out
                    automatically on every single booking. Money moves itself.
                  </p>
                  <div className="mt-8 space-y-3">
                    {[
                      ["Player pays", "₹480"],
                      ["Owner keeps", "₹432"],
                      ["Platform share", "₹48 · auto-routed"],
                    ].map(([k, v], i) => (
                      <div
                        key={k}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-ink-950/60 px-4 py-2.5"
                        style={{ marginLeft: `${i * 14}px` }}
                      >
                        <span className="text-sm text-white/50">{k}</span>
                        <span className="font-numeric text-sm font-bold text-volt-300">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {REASONS.map((r) => (
                <div
                  key={r.title}
                  className="reveal group rounded-3xl border border-white/10 bg-ink-950 p-7 transition hover:-translate-y-1 hover:border-white/25"
                >
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-2xl ${
                      r.accent === "volt"
                        ? "bg-volt-400/15 text-volt-400"
                        : "bg-flame-500/15 text-flame-400"
                    }`}
                  >
                    <r.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold text-white">{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =============================================== FEATURED VENUES */}
        <FeaturedVenues venues={venues} />

        {/* ==================================================== TESTIMONIALS */}
        <section className="border-b border-white/10 bg-ink-950">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
            <span className="eyebrow reveal text-volt-400">From the touchline</span>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {TESTIMONIALS.map((t) => (
                <figure
                  key={t.name}
                  className="reveal relative rounded-3xl border border-white/10 bg-ink-900 p-8"
                >
                  <span className="text-poster absolute right-6 top-2 text-7xl text-white/5">
                    &rdquo;
                  </span>
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-volt-400 text-volt-400" />
                    ))}
                  </div>
                  <blockquote className="text-lg leading-relaxed text-white/75">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-volt-400 text-sm font-bold text-ink-950">
                      {t.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="eyebrow text-white/35">{t.role}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ CTA */}
        <section className="relative overflow-hidden bg-ink-950">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
            <div className="grain relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 p-10 text-center sm:p-16">
              <div
                aria-hidden
                className="absolute inset-x-0 -top-24 mx-auto h-64 w-[36rem] rounded-full bg-volt-400/20 blur-[100px]"
              />
              <div className="relative">
                <span className="eyebrow text-volt-300">Kick-off awaits</span>
                <h2 className="text-poster mt-5 text-[clamp(2.6rem,8vw,6rem)] text-white">
                  The pitch is
                  <br />
                  <span className="text-volt-400">ready.</span>
                </h2>
                <p className="mx-auto mt-6 max-w-lg text-white/55">
                  Join thousands of players booking smarter - and owners getting paid on autopilot.
                </p>
                <div className="mt-9 flex flex-wrap justify-center gap-4">
                  <Link
                    href="/venues"
                    className="group inline-flex items-center gap-2 rounded-full bg-volt-400 px-8 py-4 text-sm font-bold uppercase tracking-wide text-ink-950 transition hover:bg-volt-300"
                  >
                    Book a slot
                    <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white transition hover:border-volt-400 hover:text-volt-300"
                  >
                    Become an owner
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================ FOOTER */}
      <footer className="border-t border-white/10 bg-ink-950">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <p className="text-poster text-2xl text-white">TurfHub</p>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
                The fairest way to find, book and run a sports turf. Play more. Admin never.
              </p>
            </div>
            <FooterCol
              title="Play"
              links={[
                ["Explore turfs", "/venues"],
                ["Create account", "/signup"],
                ["Sign in", "/login"],
              ]}
            />
            <FooterCol
              title="Run a turf"
              links={[
                ["List your venue", "/signup"],
                ["Owner console", "/owner"],
                ["Payouts", "/owner/earnings"],
              ]}
            />
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
            <p className="eyebrow text-white/30">© {new Date().getFullYear()} TurfHub</p>
            <p className="eyebrow text-white/30">Built for the night shift</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="eyebrow text-white/35">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-white/60 transition hover:text-volt-300">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------------------- async featured-venues block */

function FeaturedVenues({ venues }: { venues: Venue[] }) {
  if (!venues.length) return null;
  return (
    <section className="grain relative border-b border-white/10 bg-ink-900">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="reveal flex items-end justify-between gap-6">
          <div>
            <span className="eyebrow text-volt-400">Tonight near you</span>
            <h2 className="text-poster mt-4 text-[clamp(2.4rem,6vw,4.5rem)] text-white">
              Turfs worth
              <span className="text-white/25"> the trip.</span>
            </h2>
          </div>
          <Link
            href="/venues"
            className="hidden items-center gap-1.5 text-sm font-semibold text-volt-300 transition hover:text-volt-200 sm:inline-flex"
          >
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 flex snap-x gap-5 overflow-x-auto pb-3 no-scrollbar">
          {venues.map((v, i) => (
            <Link
              key={v.id}
              href={`/venues/${v.id}`}
              className="reveal group w-[300px] shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 bg-ink-950 transition hover:-translate-y-1.5 hover:border-volt-400/40"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="relative h-44 overflow-hidden bg-ink-800">
                {v.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.images?.[0]}
                    alt={v.name}
                    className="h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-white/20">
                    <Volleyball className="h-10 w-10" />
                  </div>
                )}
                <span className="absolute left-4 top-4 rounded-full bg-ink-950/70 px-2.5 py-1 text-xs font-semibold text-volt-300 backdrop-blur">
                  {formatCurrency(v.basePrice)}/hr
                </span>
              </div>
              <div className="space-y-3 p-5">
                <div>
                  <h3 className="font-display font-bold text-white">{v.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-white/45">
                    <MapPin className="h-3.5 w-3.5 text-volt-400" />
                    {v.city}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="flex items-center gap-1 text-sm text-white/70">
                    <Star className="h-3.5 w-3.5 fill-volt-400 text-volt-400" />
                    {v.rating ? v.rating.toFixed(1) : "New"}
                  </span>
                  <span className="eyebrow text-white/35 transition group-hover:text-volt-300">
                    Book →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
