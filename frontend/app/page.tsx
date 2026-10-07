import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  CreditCard,
  MapPin,
  Percent,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { Navbar, Footer } from "@/components/Navbar";
import { API_URL } from "@/lib/api";
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

export default async function HomePage() {
  const featured = await getFeatured();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-emerald-500">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_0%,white,transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="text-white animate-fade-up">
              <span className="badge bg-white/15 text-white backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Real-time availability
              </span>
              <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
                Book your game. <br />
                We&apos;ll handle the rest.
              </h1>
              <p className="mt-4 max-w-lg text-brand-50/90">
                Discover verified sports turfs near you, lock a slot in seconds, and pay
                online. Venue owners get automatic split payouts - no manual reconciliation.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/venues" className="btn bg-white text-brand-700 hover:bg-brand-50 shadow-lift">
                  Find a turf <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/signup?role=VENUE_OWNER" className="btn bg-brand-800/40 text-white ring-1 ring-white/40 hover:bg-brand-800/60">
                  List your venue
                </Link>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
                {[
                  { k: "Turfs", v: "500+" },
                  { k: "Bookings", v: "42k" },
                  { k: "Payout time", v: "<24h" },
                ].map((s) => (
                  <div key={s.k} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <dt className="text-xs text-brand-50/80">{s.k}</dt>
                    <dd className="font-numeric text-xl font-bold">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative animate-fade-up">
              <div className="overflow-hidden rounded-3xl shadow-lift ring-1 ring-white/30">
                <Image
                  src="https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=70"
                  alt="Floodlit football turf"
                  width={1200}
                  height={800}
                  className="h-80 w-full object-cover sm:h-[420px]"
                  priority
                />
              </div>
              <div className="absolute -bottom-5 -left-4 card flex items-center gap-3 p-3.5 shadow-lift">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs text-slate-400">Payment secured</p>
                  <p className="text-sm font-semibold text-slate-800">Split payout automatic</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarCheck, title: "Live slots", body: "See real availability and book instantly." },
            { icon: CreditCard, title: "Pay online", body: "Secure checkout with your preferred gateway." },
            { icon: Percent, title: "Transparent split", body: "Owners and platform paid automatically." },
            { icon: Wallet, title: "Fast payouts", body: "Earnings settled without manual follow-ups." },
          ].map((f) => (
            <div key={f.title} className="card p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">Top rated turfs</h2>
              <p className="mt-1 text-sm text-slate-500">Popular picks from our verified venues.</p>
            </div>
            <Link href="/venues" className="btn-ghost">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((v) => (
              <Link key={v.id} href={`/venues/${v.id}`} className="card group overflow-hidden">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={v.images?.[0] || FALLBACK_IMG}
                    alt={v.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-slate-900">{v.name}</h3>
                    <span className="text-sm font-semibold text-accent-600">★ {v.rating || "New"}</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" /> {v.city}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="font-numeric font-bold text-slate-900">
                      ₹{v.basePrice}
                      <span className="text-xs font-normal text-slate-400"> /hour</span>
                    </span>
                    <span className="badge bg-brand-50 text-brand-700">
                      <Clock className="h-3 w-3" /> {v.openTime}-{v.closeTime}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Three roles */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center font-display text-2xl font-bold text-slate-900">
            Built for every side of the game
          </h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              {
                icon: Users,
                title: "For Players",
                points: ["Search by sport, city and price", "Book and pay in seconds", "Manage and review bookings"],
              },
              {
                icon: Trophy,
                title: "For Venue Owners",
                points: ["Publish turfs and slot timings", "Track bookings and earnings", "Automatic split payouts"],
              },
              {
                icon: ShieldCheck,
                title: "For Admins",
                points: ["Approve venues and users", "Configure payment gateways", "Control commission splits"],
              },
            ].map((r) => (
              <div key={r.title} className="card p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-emerald-500 text-white">
                  <r.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">{r.title}</h3>
                <ul className="mt-3 space-y-2">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
