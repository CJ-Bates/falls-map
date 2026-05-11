"use client";

import { useState } from "react";
import Link from "next/link";
import PropertyMap, { type SelectedItem, type Basemap } from "@/components/PropertyMap";
import DetailPanel from "@/components/DetailPanel";

// ---------- basemap thumbnails ------------------------------------------------
// Tiny SVG previews that hint at each basemap's character. They sit inside
// a square card with a cream selected-state ring.
function ThumbTopo() {
  return (
    <svg viewBox="0 0 80 60" preserveAspectRatio="none" className="h-full w-full">
      <rect width="80" height="60" fill="#E8D5A8" />
      <path d="M0 18 Q 20 10, 40 18 T 80 16" stroke="#8B6F47" strokeWidth="1.2" fill="none" opacity="0.75" />
      <path d="M0 30 Q 20 22, 40 30 T 80 28" stroke="#8B6F47" strokeWidth="1.2" fill="none" opacity="0.85" />
      <path d="M0 42 Q 20 34, 40 42 T 80 40" stroke="#8B6F47" strokeWidth="1.2" fill="none" opacity="0.6" />
      <ellipse cx="60" cy="48" rx="14" ry="6" fill="#7d8f5a" opacity="0.55" />
      <circle cx="22" cy="46" r="3.5" fill="#2E6FA0" opacity="0.7" />
    </svg>
  );
}
function ThumbSatellite() {
  return (
    <svg viewBox="0 0 80 60" preserveAspectRatio="none" className="h-full w-full">
      <rect width="80" height="60" fill="#2c3a25" />
      <ellipse cx="22" cy="18" rx="18" ry="11" fill="#4a5e3a" />
      <ellipse cx="58" cy="38" rx="22" ry="14" fill="#3e5230" />
      <ellipse cx="20" cy="48" rx="14" ry="7" fill="#2e6fa0" />
      <path d="M0 32 L80 28" stroke="#8b7e5e" strokeWidth="0.6" opacity="0.6" />
    </svg>
  );
}
function ThumbStandard() {
  return (
    <svg viewBox="0 0 80 60" preserveAspectRatio="none" className="h-full w-full">
      <rect width="80" height="60" fill="#f4f0e6" />
      <rect x="0" y="32" width="80" height="3" fill="#d5cdb0" />
      <rect x="36" y="0" width="3" height="60" fill="#d5cdb0" />
      <rect x="8" y="6" width="24" height="20" fill="#e8e0c8" rx="2" />
      <rect x="44" y="38" width="28" height="18" fill="#e8e0c8" rx="2" />
      <circle cx="55" cy="14" r="2.2" fill="#B23A1F" />
    </svg>
  );
}

const BASEMAPS: { id: Basemap; label: string; Thumb: () => React.ReactElement }[] = [
  { id: "topo",      label: "Topo",      Thumb: ThumbTopo },
  { id: "satellite", label: "Satellite", Thumb: ThumbSatellite },
  { id: "apple",     label: "Standard",  Thumb: ThumbStandard },
];

const LEGEND: { color: string; label: string; sublabel: string }[] = [
  { color: "#C9A974", label: "Gravel",  sublabel: "any vehicle" },
  { color: "#D9531E", label: "4WD",     sublabel: "truck or SUV" },
  { color: "#F0E2C2", label: "Walking", sublabel: "on foot only" },
];

// ---------- icons -------------------------------------------------------------
function LayersIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3 2 8l10 5 10-5-10-5z" />
      <path d="m2 13 10 5 10-5" />
      <path d="m2 18 10 5 10-5" />
    </svg>
  );
}

// ---------- page --------------------------------------------------------------
export default function MapPage() {
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [basemap, setBasemap] = useState<Basemap>("topo");
  const [layersOpen, setLayersOpen] = useState(false);

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#2A1F18]">
      {/* Floating back button — solo top-left, no title bar */}
      <Link
        href="/"
        aria-label="Back to home"
        className="ios-glass-strong ios-press absolute z-10 grid h-10 w-10 place-items-center rounded-full text-[#F0E2C2]"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
          left: "0.75rem",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </Link>

      <PropertyMap onSelect={setSelected} basemap={basemap} />

      {/* Floating layers button — sits right above the live-location FAB
          (which lives inside PropertyMap at bottom-6 right-4). */}
      {!selected && (
        <button
          onClick={() => setLayersOpen((v) => !v)}
          aria-label="Map layers"
          aria-expanded={layersOpen}
          className={
            "ios-press absolute z-10 grid h-12 w-12 place-items-center rounded-full text-[#F0E2C2] transition-colors " +
            (layersOpen
              ? "bg-[#F0E2C2] text-[#1A1310] shadow-[0_8px_24px_rgba(184,153,104,0.45)]"
              : "ios-glass-strong")
          }
          style={{ bottom: "5.25rem", right: "1rem" }}
        >
          <LayersIcon className="h-[22px] w-[22px]" />
        </button>
      )}

      {/* Layers popover */}
      {layersOpen && (
        <>
          {/* Dismiss layer — tap-anywhere-to-close */}
          <button
            aria-label="Close layers"
            onClick={() => setLayersOpen(false)}
            className="absolute inset-0 z-[11] cursor-default bg-transparent"
          />
          {/* The card itself — anchored bottom-right, springs up from the
              Layers button below it. */}
          <div
            className="ios-glass-strong animate-pop-up absolute z-[12] rounded-3xl text-[#F0E2C2] shadow-[0_18px_44px_rgba(0,0,0,0.45)]"
            style={{
              right: "1rem",
              bottom: "8.5rem",
              width: "min(320px, calc(100vw - 2rem))",
              padding: "16px 16px 14px 16px",
              transformOrigin: "bottom right",
            }}
            role="dialog"
            aria-label="Map layers"
          >
            {/* Map style */}
            <div className="mb-4">
              <h3 className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mb-2">Map Style</h3>
              <div className="grid grid-cols-3 gap-2">
                {BASEMAPS.map((b) => {
                  const active = b.id === basemap;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setBasemap(b.id)}
                      aria-pressed={active}
                      className="ios-press flex flex-col items-center gap-1.5"
                    >
                      <div
                        className="relative h-[58px] w-full overflow-hidden rounded-xl"
                        style={{
                          boxShadow: active
                            ? "0 0 0 2.5px #F0E2C2, 0 6px 16px rgba(184,153,104,0.45)"
                            : "0 0 0 1px rgba(240,226,194,0.15), inset 0 0 0 1px rgba(0,0,0,0.25)",
                          transition: "box-shadow 200ms ease-out",
                        }}
                      >
                        <b.Thumb />
                      </div>
                      <span
                        className={
                          "text-[11px] font-semibold leading-none " +
                          (active ? "text-[#F0E2C2]" : "text-[#F0E2C2]/70")
                        }
                      >
                        {b.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trails legend */}
            <div className="pt-3 border-t border-[#B89968]/15">
              <h3 className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mb-2">Trails</h3>
              <ul className="space-y-2">
                {LEGEND.map((row) => (
                  <li key={row.label} className="flex items-center gap-2.5 leading-none">
                    <span
                      className="block h-[3px] w-7 rounded-full flex-shrink-0"
                      style={{ background: row.color, boxShadow: `0 0 6px ${row.color}80` }}
                    />
                    <span className="text-[13px] font-semibold text-[#F0E2C2]">{row.label}</span>
                    <span className="text-[12px] text-[#F0E2C2]/60">· {row.sublabel}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
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
