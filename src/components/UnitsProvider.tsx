"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { defaultUnits, type Units } from "@/lib/geo";

const STORAGE_KEY = "barnfinder.units";

const UnitsContext = createContext<{ units: Units; setUnits: (u: Units) => void }>({
  units: "mi",
  setUnits: () => {},
});

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [units, setUnitsState] = useState<Units>("mi");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {}
    // Syncing from browser-only state after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUnitsState(stored === "mi" || stored === "km" ? stored : defaultUnits(navigator.language));
  }, []);

  function setUnits(u: Units) {
    setUnitsState(u);
    try {
      localStorage.setItem(STORAGE_KEY, u);
    } catch {}
  }

  return <UnitsContext value={{ units, setUnits }}>{children}</UnitsContext>;
}

export function useUnits() {
  return useContext(UnitsContext);
}

export function UnitsToggle() {
  const { units, setUnits } = useUnits();
  return (
    <div role="group" aria-label="Distance units" className="inline-flex rounded-lg border border-border p-0.5 text-xs">
      {(["mi", "km"] as const).map((u) => (
        <button
          key={u}
          type="button"
          aria-pressed={units === u}
          onClick={() => setUnits(u)}
          className={`rounded-md px-2.5 py-1 font-semibold ${units === u ? "bg-primary text-on-primary" : "text-muted"}`}
        >
          {u}
        </button>
      ))}
    </div>
  );
}
