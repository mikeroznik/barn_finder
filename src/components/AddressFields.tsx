"use client";

import { useState } from "react";
import { LocationPicker } from "./map";
import type { Address } from "@/lib/types";

interface NominatimResult {
  lat: string;
  lon: string;
}

async function geocode(a: { street: string; city: string; region: string; postal: string; country: string }) {
  const base = "https://nominatim.openstreetmap.org/search?format=json&limit=1";
  const structured = new URLSearchParams(
    Object.entries({ street: a.street, city: a.city, state: a.region, postalcode: a.postal }).filter(([, v]) => v.trim()),
  );
  const country = a.country.toLowerCase();
  const tries = [
    `${base}&${structured}&countrycodes=${country}`,
    `${base}&q=${encodeURIComponent([a.street, a.city, a.region, a.postal].filter(Boolean).join(", "))}&countrycodes=${country}`,
  ];
  for (const url of tries) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) continue;
    const json = (await res.json()) as NominatimResult[];
    if (json[0]) return { lat: Number(json[0].lat), lng: Number(json[0].lon) };
  }
  return null;
}

/**
 * Address inputs plus a "Find on map" lookup (OpenStreetMap Nominatim) and a
 * draggable pin. Coordinates are submitted as hidden latitude/longitude fields.
 */
export function AddressFields({ initial }: { initial?: Partial<Address> }) {
  const [street, setStreet] = useState(initial?.street ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [region, setRegion] = useState(initial?.region ?? "");
  const [postal, setPostal] = useState(initial?.postal_code ?? "");
  const [country, setCountry] = useState(initial?.country_code ?? "US");
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(
    initial?.latitude != null && initial?.longitude != null ? { lat: initial.latitude, lng: initial.longitude } : null,
  );
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function findOnMap() {
    if (!street || !city) {
      setStatus("Enter at least the street and city first.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const found = await geocode({ street, city, region, postal, country: country || "US" });
      if (found) {
        setPoint(found);
        setStatus("Found it. Drag the pin or tap the map if it's not exactly on the building.");
      } else {
        setStatus("Couldn't find that address. Check it, or place the pin yourself on the map below.");
        if (!point) setPoint({ lat: 39.8, lng: -98.6 });
      }
    } catch {
      setStatus("The map lookup is unavailable right now. You can still save and set the pin later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <fieldset className="space-y-3">
      <legend className="label">Address</legend>
      <div>
        <label htmlFor="street" className="label">
          Street<span className="text-danger"> *</span>
        </label>
        <input id="street" name="street" className="input" required maxLength={200} value={street} onChange={(e) => setStreet(e.target.value)} autoComplete="street-address" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className="label">
            City<span className="text-danger"> *</span>
          </label>
          <input id="city" name="city" className="input" required maxLength={100} value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
        </div>
        <div>
          <label htmlFor="region" className="label">
            State / province
          </label>
          <input id="region" name="region" className="input" maxLength={100} value={region} onChange={(e) => setRegion(e.target.value)} autoComplete="address-level1" />
        </div>
        <div>
          <label htmlFor="postal_code" className="label">
            ZIP / postal code
          </label>
          <input id="postal_code" name="postal_code" className="input" maxLength={20} value={postal} onChange={(e) => setPostal(e.target.value)} autoComplete="postal-code" />
        </div>
        <div>
          <label htmlFor="country_code" className="label">
            Country code
          </label>
          <input
            id="country_code"
            name="country_code"
            className="input uppercase"
            maxLength={2}
            pattern="[A-Za-z]{2}"
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            autoComplete="country"
          />
          <p className="hint">Two letters, e.g. US, CA, SE</p>
        </div>
      </div>

      <input type="hidden" name="latitude" value={point?.lat ?? ""} />
      <input type="hidden" name="longitude" value={point?.lng ?? ""} />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-secondary btn-sm" onClick={findOnMap} disabled={busy}>
          {busy ? "Looking up…" : point ? "Look up address again" : "Find on map"}
        </button>
        {!point && (
          <button type="button" className="text-sm font-medium text-muted underline" onClick={() => setPoint({ lat: 39.8, lng: -98.6 })}>
            Place pin manually
          </button>
        )}
      </div>
      {status && (
        <p className="text-sm text-muted" aria-live="polite">
          {status}
        </p>
      )}
      {point && (
        <div className="space-y-1">
          <LocationPicker lat={point.lat} lng={point.lng} onChange={(lat, lng) => setPoint({ lat, lng })} />
          <p className="hint">
            Pin: {point.lat.toFixed(5)}, {point.lng.toFixed(5)}. Drag it or tap the map to adjust.
          </p>
        </div>
      )}
    </fieldset>
  );
}
