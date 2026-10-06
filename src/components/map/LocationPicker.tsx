"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { OSM_TILES, pinIcon } from "./PinMap";

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 16));
  }, [lat, lng, map]);
  return null;
}

function ClickToPlace({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onChange(e.latlng.lat, e.latlng.lng) });
  return null;
}

/** Map with one draggable pin. Tap the map or drag the pin to adjust. */
export default function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer center={[lat, lng]} zoom={16} className="h-64 w-full rounded-xl">
      <TileLayer url={OSM_TILES.url} attribution={OSM_TILES.attribution} />
      <Recenter lat={lat} lng={lng} />
      <ClickToPlace onChange={onChange} />
      <Marker
        position={[lat, lng]}
        icon={pinIcon("rink", 24)}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const p = e.target.getLatLng();
            onChange(p.lat, p.lng);
          },
        }}
      />
    </MapContainer>
  );
}
