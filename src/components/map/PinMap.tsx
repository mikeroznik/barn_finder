"use client";

import L from "leaflet";
import Link from "next/link";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

export interface Pin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  href?: string;
  kind?: "rink" | "place" | "user";
}

const COLORS = { rink: "#c8102e", place: "#1d3a6e", user: "#2563eb" } as const;

export function pinIcon(kind: Pin["kind"] = "rink", size = 18) {
  const color = COLORS[kind];
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)"></span>`,
  });
}

export const OSM_TILES = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

function FitToPins({ pins, maxZoom }: { pins: Pin[]; maxZoom: number }) {
  const map = useMap();
  const key = pins.map((p) => `${p.id}:${p.lat}:${p.lng}`).join("|");
  useEffect(() => {
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], maxZoom);
    } else {
      map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng])), { padding: [32, 32], maxZoom });
    }
    // Refit only when the set of pins changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map, maxZoom]);
  return null;
}

export default function PinMap({
  pins,
  className = "h-[60vh]",
  maxZoom = 14,
}: {
  pins: Pin[];
  className?: string;
  maxZoom?: number;
}) {
  return (
    <MapContainer center={[39.8, -98.6]} zoom={4} scrollWheelZoom className={`w-full rounded-xl ${className}`}>
      <TileLayer url={OSM_TILES.url} attribution={OSM_TILES.attribution} />
      <FitToPins pins={pins} maxZoom={maxZoom} />
      {pins.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon(p.kind)} title={p.title}>
          <Popup>
            <div className="min-w-40">
              <p className="font-semibold">{p.title}</p>
              {p.subtitle && <p className="text-xs opacity-75">{p.subtitle}</p>}
              {p.href && (
                <Link href={p.href} className="mt-1 inline-block font-semibold underline">
                  View details
                </Link>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
