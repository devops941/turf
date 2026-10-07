"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Filter, MapPin, Search, SlidersHorizontal, Star } from "lucide-react";
import { Navbar, Footer } from "@/components/Navbar";
import { EmptyState, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { SPORTS, formatCurrency } from "@/lib/format";
import type { Venue } from "@/lib/types";

const FALLBACK =
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=70";

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: "",
    city: "",
    sport: "",
    maxPrice: "",
    minRating: "",
    sort: "rating",
  });

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.city) params.set("city", filters.city);
    if (filters.sport) params.set("sport", filters.sport);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.minRating) params.set("minRating", filters.minRating);
    params.set("sort", filters.sort);
    try {
      const data = await api.get<{ items: Venue[] }>(`/api/venues?${params.toString()}`);
      setVenues(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api
      .get<{ cities: string[] }>("/api/venues/meta/cities")
      .then((d) => setCities(d.cities))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h1 className="font-display text-2xl font-bold text-slate-900">Explore turfs</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? "Searching..." : `${venues.length} venues available`}
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="Search venue, area or city"
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              />
            </div>
            <select
              className="input"
              value={filters.city}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={filters.sport}
              onChange={(e) => setFilters((f) => ({ ...f, sport: e.target.value }))}
            >
              <option value="">All sports</option>
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            >
              <option value="rating">Top rated</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Refine
            </span>
            <input
              className="input max-w-[150px]"
              type="number"
              placeholder="Max price"
              value={filters.maxPrice}
              onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
            />
            <select
              className="input max-w-[170px]"
              value={filters.minRating}
              onChange={(e) => setFilters((f) => ({ ...f, minRating: e.target.value }))}
            >
              <option value="">Any rating</option>
              <option value="3">3★ &amp; up</option>
              <option value="4">4★ &amp; up</option>
              <option value="4.5">4.5★ &amp; up</option>
            </select>
            {(filters.q || filters.city || filters.sport || filters.maxPrice || filters.minRating) && (
              <button
                className="btn-ghost"
                onClick={() =>
                  setFilters({ q: "", city: "", sport: "", maxPrice: "", minRating: "", sort: filters.sort })
                }
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {loading ? (
          <Spinner label="Loading venues..." />
        ) : venues.length === 0 ? (
          <EmptyState
            icon={<Filter className="h-6 w-6" />}
            title="No venues match your filters"
            message="Try widening your search - remove a filter or pick another city."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <Link key={v.id} href={`/venues/${v.id}`} className="card group overflow-hidden">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={v.images?.[0] || FALLBACK}
                    alt={v.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                    {v.sportTypes?.slice(0, 2).map((s) => (
                      <span key={s} className="badge bg-white/90 text-slate-700 backdrop-blur">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-semibold text-slate-900">{v.name}</h3>
                    {v.rating > 0 && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-accent-600">
                        <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" />
                        {v.rating}
                        <span className="text-xs font-normal text-slate-400">({v.reviewCount})</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" /> {v.address}, {v.city}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="font-numeric font-bold text-slate-900">
                      {formatCurrency(v.basePrice)}
                      <span className="text-xs font-normal text-slate-400"> /hour</span>
                    </span>
                    <span className="text-xs font-semibold text-brand-700 group-hover:underline">
                      Book now →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
