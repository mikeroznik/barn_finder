"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so maps only render in the browser.
const loading = () => <div className="h-full min-h-48 w-full animate-pulse rounded-xl bg-surface-2" />;

export const PinMap = dynamic(() => import("./PinMap"), { ssr: false, loading });
export const LocationPicker = dynamic(() => import("./LocationPicker"), { ssr: false, loading });
export type { Pin } from "./PinMap";
