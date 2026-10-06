"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PinMap, type Pin } from "@/components/map";
import { useUnits } from "@/components/UnitsProvider";
import { distanceKm, formatAddress, formatDistance, pointOf, type LatLng } from "@/lib/geo";
import type { RinkSummary } from "@/lib/types";

function haystack(r: RinkSummary) {
  return `${r.name} ${formatAddress(r)} ${r.postal_code ?? ""}`.toLowerCase();
}

export function RinkBrowser({
  rinks,
  initialQuery,
  initialView,
}: {
  rinks: RinkSummary[];
  initialQuery: string;
  initialView: "list" | "map";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { units } = useUnits();
  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState(initialView);
  const [here, setHere] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  function syncUrl(nextQuery: string, nextView: "list" | "map") {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextView === "map") params.set("view", "map");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function locate() {
    if (!("geolocation" in navigator)) {
      setLocError("Your browser can't share its location.");
      return;
    }
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError("Location not available. Allow location access to sort by distance.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matched = rinks.filter((r) => {
      const h = haystack(r);
      return terms.every((t) => h.includes(t));
    });
    const withDistance = matched.map((r) => {
      const p = pointOf(r);
      return { rink: r, km: here && p ? distanceKm(here, p) : null };
    });
    if (here) withDistance.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
    return withDistance;
  }, [rinks, query, here]);

  const pins: Pin[] = results.flatMap(({ rink }) => {
    const p = pointOf(rink);
    return p
      ? [{ id: rink.id, lat: p.lat, lng: p.lng, title: rink.name, subtitle: formatAddress(rink), href: `/rinks/${rink.id}` }]
      : [];
  });
  if (here) pins.push({ id: "you", lat: here.lat, lng: here.lng, title: "You are here", kind: "user" });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h1 className="h1">Find a rink</h1>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            syncUrl(query, view);
          }}
        >
          <label htmlFor="rink-search" className="sr-only">
            Search by rink name or address
          </label>
          <input
            id="rink-search"
            type="search"
            className="input"
            placeholder="Rink name, street, city, state or ZIP"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => syncUrl(query, view)}
            autoComplete="off"
          />
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="View" className="inline-flex rounded-lg border border-border p-0.5">
            {(["list", "map"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => {
                  setView(v);
                  syncUrl(query, v);
                }}
                className={`min-h-9 rounded-md px-4 text-sm font-semibold capitalize ${
                  view === v ? "bg-primary text-on-primary" : "text-muted"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button type="button" className="btn-secondary btn-sm" onClick={locate} disabled={locating}>
            {locating ? "Locating…" : here ? "Update my location" : "Nearest to me"}
          </button>
          <span className="text-sm text-muted" aria-live="polite">
            {results.length} {results.length === 1 ? "rink" : "rinks"}
          </span>
        </div>
        {locError && <p className="text-sm text-danger">{locError}</p>}
      </div>

      {view === "map" ? (
        <PinMap pins={pins} className="h-[65vh]" maxZoom={here ? 11 : 13} />
      ) : results.length === 0 ? (
        <div className="card text-center">
          <p className="font-medium">No rinks match “{query}”.</p>
          <p className="mt-1 text-sm text-muted">
            Try part of the name or address, or{" "}
            <Link href="/rinks/new" className="link">
              add the rink
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {results.map(({ rink, km }) => (
            <li key={rink.id}>
              <Link href={`/rinks/${rink.id}`} className="card block h-full transition-colors hover:border-primary">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold leading-snug">{rink.name}</h2>
                  {km != null && <span className="badge shrink-0">{formatDistance(km, units)}</span>}
                </div>
                <p className="mt-1 text-sm text-muted">{formatAddress(rink)}</p>
                {rink.sheet_count != null && (
                  <p className="mt-2 text-xs font-medium text-muted">
                    {rink.sheet_count} {rink.sheet_count === 1 ? "sheet" : "sheets"} of ice
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
