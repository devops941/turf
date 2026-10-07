import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock,
  CreditCard,
  Flame,
  MapPin,
  Percent,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Navbar, Footer } from "@/components/Navbar";
import { API_URL } from "@/lib/api";
import { SPORTS } from "@/lib/format";
import type { Venue } from "@/lib/types";

async function getFeatured(): Promise<Venue[]> {
  try {
    const res = await fetch(`${API_URL}/api/venues?sort=rating&limit=3`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=70";

const TICKER = [
  "Live slot availability",
  "Instant online payment",
  "Verified venues",
  "Automatic split payouts",
  "Zero manual reconciliation",
  "Settle in under 24h",
  "Reviews you can trust",
];

const MARQUEE_IMG = [
  "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&w=800&q=70",
  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=70",
];

const STEPS = [
  {
    n: "01",
    icon: Search,
    title: "Find your turf",
    body: "Filter by sport, city, price and rating. See genuine photos and what other players said.",
  },
  {
    n: "02",
    icon: CalendarCheck,
    title: "Lock the slot",
    body: "Pick a time on the live calendar. We hold it for 10 minutes while you check out.",
  },
  {
    n: "03",
    icon: Zap,
    title: "Play & settle",
    body: "Pay online and turn up. Owners and the platform are paid automatically, instantly.",
  },
];

export default async function HomePage() {
  const featured = await getFeatured();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ================= HERO — night match ================= */}
      <section className="relative isolate overflow-hidden bg-slate-950">
        {/* floodlight glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(60%_55%_at_15%_0%,rgba(34,197,94,0.35),transparent_60%),radial-gradient(50%_50%_at_90%_10%,rgba(249,115,22,0.28),transparent_55%),radial-gradient(70%_60%_at_50%_120%,rgba(16,185,129,0.25),transparent_60%)]"
        />
        {/* pitch lines */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px] opacity-[0.18] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_top,black,transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full border border-white/10"
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 sm:pb-32 sm:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            {/* left copy */}
            <div className="animate-fade-up text-white">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-200 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-brand-400" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
                </span>
                Live availability
              </span>

              <h1 className="mt-7 font-display text-[3.15rem] font-extrabold leading-[0.92] tracking-tight sm:text-7xl lg:text-[5.2rem]">
                Find the turf.
                <br />
                <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-accent-400 bg-clip-text text-transparent">
                  Own the night.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
                Book floodlit pitches near you in seconds. Pay online, get instant
                confirmation, and let automatic split payouts settle everything behind
                the scenes.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/venues"
                  className="btn bg-brand-500 px-6 py-3.5 text-base text-slate-950 shadow-lift hover:bg-brand-400"
                >
                  Book a pitch <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/signup?role=VENUE_OWNER"
                  className="btn border border-white/20 bg-white/5 px-6 py-3.5 text-base text-white backdrop-blur hover:bg-white/10"
                >
                  <Play className="h-4 w-4 fill-current" /> List your venue
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400">
                {["Free to browse", "No booking fees", "Cancel up to 6h before"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-2">
                    <Check className="h-4 w-4 text-brand-400" /> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* right: floating venue cards + booking widget */}
            <div className="relative animate-fade-up lg:h-[520px]">
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                {/* main card */}
                <div className="animate-float overflow-hidden rounded-[28px] border border-white/10 shadow-lift">
                  <Image
                    src="https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=75"
                    alt="Floodlit football turf at night"
                    width={1200}
                    height={900}
                    className="h-72 w-full object-cover sm:h-[360px]"
                    priority
                  />
                </div>

                {/* rating chip */}
                <div className="absolute -right-2 top-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white shadow-lift backdrop-blur sm:-right-6">
                  <Star className="h-4 w-4 fill-accent-400 text-accent-400" />
                  <div className="leading-tight">
                    <p className="font-numeric text-sm font-bold">4.9</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">rating</p>
                  </div>
                </div>

                {/* players chip */}
                <div className="absolute -left-2 top-28 flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-white shadow-lift backdrop-blur sm:-left-8">
                  <Users className="h-4 w-4 text-brand-400" />
                  <p className="text-xs font-semibold">
                    2,400 <span className="text-slate-400">playing tonight</span>
                  </p>
                </div>

                {/* booking widget */}
                <div className="relative z-10 -mt-8 ml-auto mr-0 w-[92%] rounded-2xl border border-slate-100 bg-white p-4 shadow-lift sm:absolute sm:bottom-0 sm:-left-4 sm:mt-0 sm:w-[340px]">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-sm font-bold text-slate-900">
                      Greenfield Arena
                    </p>
                    <span className="badge bg-brand-50 text-brand-700">
                      <Clock className="h-3 w-3" /> 06–23
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {["18:00", "19:00", "20:00"].map((t, i) => (
                      <span
                        key={t}
                        className={`rounded-xl border px-2 py-2 text-center font-numeric text-xs font-semibold ${
                          i === 1
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-slate-200 text-slate-500"
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="font-numeric text-lg font-bold text-slate-900">
                      ₹1,200
                      <span className="text-xs font-normal text-slate-400"> /hour</span>
                    </span>
                    <span className="badge bg-slate-900 text-white">
                      <ShieldCheck className="h-3 w-3" /> Split payout
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ticker strip */}
        <div className="relative border-y border-white/10 bg-slate-900/60">
          <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-hidden px-4 py-3 sm:px-6">
            <span className="hidden shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-400 sm:flex">
              <Flame className="h-4 w-4" /> Tonight
            </span>
            <div className="flex min-w-0 flex-1 gap-8 overflow-x-auto no-scrollbar">
              {TICKER.map((t) => (
                <span
                  key={t}
                  className="shrink-0 whitespace-nowrap text-xs font-medium text-slate-300"
                >
                  <span className="mr-2 text-brand-400">●</span>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= SPORT RAIL ================= */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <span className="hidden shrink-0 pr-2 text-xs font-semibold uppercase tracking-widest text-slate-400 sm:block">
              Pick a sport
            </span>
            {SPORTS.map((s) => (
              <Link
                key={s}
                href={`/venues?sport=${encodeURIComponent(s)}`}
                className="group flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 transition group-hover:bg-brand-500" />
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= STATS SCOREBOARD ================= */}
      <section className="relative overflow-hidden bg-slate-950 py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(40%_60%_at_10%_20%,rgba(34,197,94,0.28),transparent_60%),radial-gradient(40%_60%_at_90%_80%,rgba(249,115,22,0.22),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid divide-slate-800 sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
            {[
              { v: "500+", k: "Verified turfs", icon: MapPin },
              { v: "42k", k: "Games booked", icon: Trophy },
              { v: "<24h", k: "Payout settlement", icon: Wallet },
              { v: "0", k: "Manual reconciliations", icon: Percent },
            ].map((s) => (
              <div key={s.k} className="flex flex-col items-start gap-2 px-2 py-6 sm:px-8">
                <s.icon className="h-5 w-5 text-brand-400" />
                <p className="font-numeric text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                  {s.v}
                </p>
                <p className="text-sm text-slate-400">{s.k}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MARQUEE GALLERY ================= */}
      <section className="overflow-hidden bg-white py-16">
        <div className="mx-auto mb-8 max-w-7xl px-4 sm:px-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-600">
            Under the lights
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Where the game happens
          </h2>
        </div>
        <div className="relative flex overflow-hidden">
          <div className="flex w-max animate-marquee gap-4">
            {[...MARQUEE_IMG, ...MARQUEE_IMG].map((src, i) => (
              <div
                key={i}
                className="relative h-44 w-64 shrink-0 overflow-hidden rounded-2xl sm:h-56 sm:w-80"
              >
                <Image src={src} alt="Sports turf" fill sizes="320px" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent sm:w-32" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent sm:w-32" />
        </div>
      </section>

      {/* ================= FEATURED ================= */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                Top rated
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Popular picks near you
              </h2>
            </div>
            <Link href="/venues" className="btn-ghost">
              Browse all turfs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((v) => (
              <Link
                key={v.id}
                href={`/venues/${v.id}`}
                className="card card-hover group overflow-hidden"
              >
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={v.images?.[0] || FALLBACK_IMG}
                    alt={v.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/0 to-transparent" />
                  <span className="absolute left-3 top-3 badge bg-white/95 text-slate-900 backdrop-blur">
                    <Star className="h-3 w-3 fill-accent-500 text-accent-500" />
                    {v.rating || "New"}
                  </span>
                  <span className="absolute bottom-3 left-3 badge bg-slate-950/70 text-white backdrop-blur">
                    <Clock className="h-3 w-3" /> {v.openTime}–{v.closeTime}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-brand-700">
                      {v.name}
                    </h3>
                    <span className="shrink-0 font-numeric text-lg font-bold text-slate-900">
                      ₹{v.basePrice}
                      <span className="text-xs font-normal text-slate-400">/hr</span>
                    </span>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" /> {v.city}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {v.sportTypes?.slice(0, 2).map((s) => (
                      <span key={s} className="badge bg-brand-50 text-brand-700">
                        {s}
                      </span>
                    ))}
                    <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-700 opacity-0 transition group-hover:opacity-100">
                      Book <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ================= HOW IT WORKS ================= */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent-600">
              How it works
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              From search to kick-off in three steps
            </h2>
          </div>

          <div className="relative mt-14 grid gap-8 lg:grid-cols-3">
            <div
              aria-hidden
              className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent lg:block"
            />
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <div className="relative z-10 flex items-center gap-4">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-slate-950 font-numeric text-xl font-extrabold text-white shadow-lift">
                    {s.n}
                  </span>
                  <s.icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= THREE ROLES ================= */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              Built for everyone
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Every side of the game
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[
              {
                icon: Users,
                title: "For Players",
                points: [
                  "Search by sport, city and price",
                  "Book and pay in seconds",
                  "Manage, cancel and review bookings",
                ],
                cta: { label: "Start booking", href: "/venues" },
                tone: "from-brand-600 to-emerald-500",
              },
              {
                icon: Trophy,
                title: "For Venue Owners",
                points: [
                  "Publish turfs and slot timings",
                  "Track bookings and earnings live",
                  "Automatic split payouts, no chasing",
                ],
                cta: { label: "List your venue", href: "/signup?role=VENUE_OWNER" },
                tone: "from-slate-900 to-slate-700",
                featured: true,
              },
              {
                icon: ShieldCheck,
                title: "For Admins",
                points: [
                  "Approve venues and users",
                  "Configure payment gateways",
                  "Control commission splits",
                ],
                cta: { label: "Admin console", href: "/login" },
                tone: "from-accent-500 to-accent-600",
              },
            ].map((r) => (
              <div
                key={r.title}
                className={`card flex flex-col p-7 ${r.featured ? "ring-2 ring-slate-900" : ""}`}
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${r.tone} text-white`}
                >
                  <r.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-slate-900">{r.title}</h3>
                <ul className="mt-4 flex-1 space-y-2.5">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href={r.cta.href}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-all hover:gap-2.5"
                >
                  {r.cta.label} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SPLIT PAYOUT SPOTLIGHT ================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-[32px] bg-slate-950 px-6 py-14 sm:px-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(50%_70%_at_80%_20%,rgba(34,197,94,0.3),transparent_60%),radial-gradient(40%_60%_at_10%_90%,rgba(249,115,22,0.25),transparent_60%)]"
          />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div className="text-white">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-200">
                <CreditCard className="h-3.5 w-3.5" /> Payments
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Money splits itself.
                <br />
                You just play.
              </h2>
              <p className="mt-4 max-w-md text-slate-300">
                Choose a payment gateway, set the commission once, and every booking is
                split between the venue owner and the platform automatically. No invoices,
                no spreadsheets.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/signup?role=VENUE_OWNER"
                  className="btn bg-brand-500 text-slate-950 hover:bg-brand-400"
                >
                  Start earning <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/venues"
                  className="btn border border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  See it in action
                </Link>
              </div>
            </div>

            {/* payout visual */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
                <span>Booking #4821</span>
                <span className="text-brand-400">Paid</span>
              </div>
              <p className="mt-3 font-numeric text-3xl font-extrabold text-white">₹1,200</p>
              <div className="mt-5 space-y-3">
                {[
                  { label: "Venue owner", pct: 80, amount: "₹960", tone: "bg-brand-500" },
                  { label: "Platform fee", pct: 20, amount: "₹240", tone: "bg-accent-500" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-slate-300">{row.label}</span>
                      <span className="font-numeric font-semibold text-white">
                        {row.amount} · {row.pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${row.tone}`}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 flex items-center gap-2 text-xs text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-accent-400" />
                Settled automatically the moment payment clears.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= VALUE PROPS ================= */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarCheck, title: "Live slots", body: "Real availability, updated as you look." },
            { icon: CreditCard, title: "Pay online", body: "Secure checkout with your gateway." },
            { icon: Percent, title: "Transparent split", body: "Everyone paid automatically." },
            { icon: Wallet, title: "Fast payouts", body: "Earnings settled without chasing." },
          ].map((f) => (
            <div key={f.title} className="card card-hover p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display font-bold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="card relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-600 to-emerald-500 p-10 text-center sm:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_80%,white,transparent_30%)]"
          />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Your next game is a tap away.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-brand-50/90">
              Join thousands of players booking floodlit pitches every week.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/venues"
                className="btn bg-white px-6 py-3.5 text-base text-brand-700 shadow-lift hover:bg-brand-50"
              >
                Find a turf <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="btn border border-white/40 bg-white/10 px-6 py-3.5 text-base text-white hover:bg-white/20"
              >
                Create free account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
