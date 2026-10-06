import type { Address } from "./types";

export type Units = "mi" | "km";

const EARTH_RADIUS_KM = 6371;
const KM_PER_MILE = 1.609344;

export interface LatLng {
  lat: number;
  lng: number;
}

export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number, units: Units): string {
  const value = units === "mi" ? km / KM_PER_MILE : km;
  const digits = value < 10 ? 1 : 0;
  return `${value.toFixed(digits)} ${units}`;
}

export function pointOf(a: Pick<Address, "latitude" | "longitude">): LatLng | null {
  return a.latitude != null && a.longitude != null ? { lat: a.latitude, lng: a.longitude } : null;
}

export function formatAddress(a: Pick<Address, "street" | "city" | "region" | "postal_code" | "country_code">): string {
  const cityLine = [a.city, [a.region, a.postal_code].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const country = a.country_code && a.country_code !== "US" ? a.country_code : "";
  return [a.street, cityLine, country].filter(Boolean).join(", ");
}

/** Opens the address in Google Maps (no API key needed). */
export function googleMapsUrl(name: string, a: Parameters<typeof formatAddress>[0]): string {
  const query = `${name}, ${formatAddress(a)}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Default units from the browser locale: miles for US, UK, Liberia, Myanmar. */
export function defaultUnits(locale: string | undefined): Units {
  const region = locale?.split("-")[1]?.toUpperCase();
  return region && ["US", "GB", "LR", "MM"].includes(region) ? "mi" : "km";
}
