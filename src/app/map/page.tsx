"use client";

import { useState } from "react";
import Link from "next/link";
import PropertyMap, { type SelectedItem, type TrailFilter } from "@/components/PropertyMap";
import DetailPanel from "@/components/DetailPanel";

const FILTERS: { id: TrailFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "walking", label: "Walking" },
  { id: "4wd", label: "4WD" },
  { id: "gravel", label: "Gravel" },
];

export default function MapPage() {
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [filter, setFilter] = useState<TrailFilter>("all");

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

      <PropertyMap onSelect={setSelected} trailFilter={filter} />

      {/* Filter chips — float bottom-center so they don't compete with the
          back button, compass, or live-location FAB */}
      {!selected && (
        <div
          className="pointer-events-auto absolute z-10 left-1/2 -translate-x-1/2 flex gap-1.5"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}
        >
          {FILTERS.map((f) => {
            const active = f.id === filter;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={
                  "ios-press rounded-full px-3.5 py-2 text-[13px] font-semibold leading-none transition-colors " +
                  (active
                    ? "bg-[#F0E2C2] text-[#1A1310] shadow-[0_4px_14px_rgba(184,153,104,0.4)]"
                    : "ios-glass-strong text-[#F0E2C2]")
                }
                aria-pressed={active}
              >
                {f.label}
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
