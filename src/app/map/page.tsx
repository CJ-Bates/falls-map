"use client";

import { useState } from "react";
import Link from "next/link";
import PropertyMap, { type SelectedItem, type Basemap } from "@/components/PropertyMap";
import DetailPanel from "@/components/DetailPanel";

const BASEMAPS: { id: Basemap; label: string }[] = [
  { id: "topo",      label: "Topo" },
  { id: "satellite", label: "Satellite" },
  { id: "apple",     label: "Standard" },
];

// Trail color legend, keyed to the surface->color match in PropertyMap.tsx
const LEGEND: { color: string; label: string; sublabel: string }[] = [
  { color: "#C9A974", label: "Gravel",   sublabel: "any vehicle" },
  { color: "#D9531E", label: "4WD",      sublabel: "truck or SUV" },
  { color: "#F0E2C2", label: "Walking",  sublabel: "on foot only" },
];

export default function MapPage() {
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [basemap, setBasemap] = useState<Basemap>("topo");

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#2A1F18]">
      {/* iOS-style floating header */}
      <header
        className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 px-3 pb-2"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <Link
          href="/"
          aria-label="Back to home"
          className="ios-glass-strong ios-press grid h-10 w-10 place-items-center rounded-full text-[#F0E2C2]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <div className="ios-glass-strong flex-1 rounded-full px-4 py-2 leading-tight">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[#B89968]">Property Map</div>
          <div className="font-sketch text-lg text-[#F0E2C2] leading-none mt-0.5">The Falls at Lions Den</div>
        </div>
      </header>

      <PropertyMap onSelect={setSelected} basemap={basemap} />

      {/* Legend — bottom-left, just above the scale bar */}
      {!selected && (
        <div
          className="ios-glass-strong pointer-events-none absolute z-10 rounded-2xl px-3 py-2 text-[#F0E2C2]"
          style={{
            left: "12px",
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 56px)",
          }}
          aria-label="Trail legend"
        >
          <div className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mb-1">Trails</div>
          <ul className="space-y-1.5">
            {LEGEND.map((row) => (
              <li key={row.label} className="flex items-center gap-2 text-[12px] leading-none">
                <span
                  className="block h-1 w-6 rounded-full flex-shrink-0"
                  style={{ background: row.color, boxShadow: `0 0 6px ${row.color}80` }}
                />
                <span className="font-semibold">{row.label}</span>
                <span className="text-[11px] text-[#F0E2C2]/65">· {row.sublabel}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Basemap switcher — bottom-center */}
      {!selected && (
        <div
          className="pointer-events-auto absolute z-10 left-1/2 -translate-x-1/2 flex gap-1.5"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}
        >
          {BASEMAPS.map((b) => {
            const active = b.id === basemap;
            return (
              <button
                key={b.id}
                onClick={() => setBasemap(b.id)}
                className={
                  "ios-press rounded-full px-3.5 py-2 text-[13px] font-semibold leading-none transition-colors " +
                  (active
                    ? "bg-[#F0E2C2] text-[#1A1310] shadow-[0_4px_14px_rgba(184,153,104,0.4)]"
                    : "ios-glass-strong text-[#F0E2C2]")
                }
                aria-pressed={active}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <button
          aria-label="Close detail panel"
          onClick={() => setSelected(null)}
          className="fixed inset-x-0 top-0 z-[15] cursor-default bg-transparent"
          style={{ height: "45svh" }}
        />
      )}
      <DetailPanel item={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
