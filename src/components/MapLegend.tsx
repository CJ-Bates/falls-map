"use client";

import { useEffect, useState } from "react";

// Map legend: floating "?" button at the right edge of the map, opens a
// panel explaining pins, trails, and area shadings. On a guest's first
// visit, opens automatically for ~6 seconds so they have the key in front
// of them; after that it's tap-to-toggle.

const SEEN_KEY = "falls-legend-seen-v1";

type LegendItem = { sample: React.ReactElement; label: string };

const PIN_ITEMS: LegendItem[] = [
  // Colors here mirror categoryStyle in src/data/pois.ts.
  {
    sample: <span className="block h-4 w-4 rounded-full bg-[#B23A1F] border-2 border-[#F0E2C2]" />,
    label: "Cabin",
  },
  {
    sample: <span className="block h-4 w-4 rounded-full bg-[#D9531E] border-2 border-[#F0E2C2]" />,
    label: "Firepit",
  },
  {
    sample: <span className="block h-4 w-4 rounded-full bg-[#7A5A2F] border-2 border-[#F0E2C2]" />,
    label: "Pavilion",
  },
  {
    sample: <span className="block h-4 w-4 rounded-full bg-[#6B4423] border-2 border-[#F0E2C2]" />,
    label: "Barn / shack",
  },
  {
    sample: <span className="block h-4 w-4 rounded-full bg-[#3F6B2A] border-2 border-[#F0E2C2]" />,
    label: "Treehouse",
  },
  {
    sample: <span className="block h-4 w-4 rounded-full bg-[#2E6FA0] border-2 border-[#F0E2C2]" />,
    label: "Lake / dock",
  },
  {
    sample: <span className="block h-4 w-4 rounded-full bg-[#1f1410] border-2 border-[#F0E2C2]" />,
    label: "Bear / bobcat carving",
  },
];

const TRAIL_ITEMS: LegendItem[] = [
  {
    sample: <span className="block h-[5px] w-7 rounded-full" style={{ background: "#C9A974" }} />,
    label: "Gravel road (any vehicle)",
  },
  {
    sample: <span className="block h-[5px] w-7 rounded-full" style={{ background: "#D9531E" }} />,
    label: "4WD trail (truck or SUV)",
  },
  {
    sample: (
      <span
        className="block h-[4px] w-7"
        style={{
          backgroundImage:
            "linear-gradient(to right, #F0E2C2 60%, transparent 60%)",
          backgroundSize: "6px 100%",
        }}
      />
    ),
    label: "Walking trail (on foot)",
  },
  {
    sample: <span className="block h-[5px] w-7 rounded-full" style={{ background: "#3D3022" }} />,
    label: "Paved road",
  },
];

const AREA_ITEMS: LegendItem[] = [
  {
    sample: (
      <span
        className="block h-3 w-7 rounded-sm border border-[#F0E2C2]/85"
        style={{
          backgroundImage:
            "linear-gradient(to right, #F0E2C2 50%, transparent 50%)",
          backgroundSize: "6px 100%",
          background: "rgba(240,226,194,0.10)",
        }}
      />
    ),
    label: "Property boundary",
  },
  {
    sample: <span className="block h-3 w-7 rounded-sm bg-[#3a82c2]/70 border border-[#1d5688]/80" />,
    label: "Lake / water",
  },
  {
    sample: <span className="block h-3 w-7 rounded-sm bg-[#7d8f5a]/70" />,
    label: "Horse pasture",
  },
];

export default function MapLegend({ hidden = false }: { hidden?: boolean }) {
  const [open, setOpen] = useState(false);
  // On first visit, auto-open and auto-close after a few seconds.
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === "1"; } catch {}
    if (seen) return;
    const openTimer = setTimeout(() => setOpen(true), 600);
    const closeTimer = setTimeout(() => {
      setOpen(false);
      try { localStorage.setItem(SEEN_KEY, "1"); } catch {}
    }, 6800);
    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  }, []);

  // Mark as seen any time the user closes manually too.
  const close = () => {
    setOpen(false);
    try { localStorage.setItem(SEEN_KEY, "1"); } catch {}
  };

  if (hidden) return null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Map legend"
        aria-expanded={open}
        className={
          "ios-press absolute z-10 grid h-12 w-12 place-items-center rounded-full text-[#F0E2C2] transition-colors " +
          (open
            ? "bg-[#F0E2C2] text-[#1A1310] shadow-[0_8px_24px_rgba(184,153,104,0.45)]"
            : "ios-glass-strong")
        }
        style={{ bottom: "12.75rem", right: "1rem" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {open && (
        <>
          {/* Dismiss layer */}
          <button
            aria-label="Close legend"
            onClick={close}
            className="absolute inset-0 z-[11] cursor-default bg-transparent"
          />

          <div
            className="ios-glass-strong animate-pop-up absolute z-[12] rounded-3xl text-[#F0E2C2] shadow-[0_18px_44px_rgba(0,0,0,0.45)]"
            style={{
              right: "1rem",
              bottom: "16rem",
              width: "min(320px, calc(100vw - 2rem))",
              padding: "16px 16px 14px 16px",
              transformOrigin: "bottom right",
            }}
            role="dialog"
            aria-label="Map legend"
          >
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="ios-headline text-[15px] text-[#F0E2C2]">Legend</h3>
              <button
                onClick={close}
                aria-label="Close"
                className="ios-press text-[11px] uppercase tracking-[0.14em] text-[#B89968]"
              >
                Close
              </button>
            </div>

            <section className="mb-3">
              <h4 className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mb-2">Pins</h4>
              <ul className="grid grid-cols-1 gap-1.5">
                {PIN_ITEMS.map((it) => (
                  <li key={it.label} className="flex items-center gap-2.5 text-[13px]">
                    {it.sample}
                    <span className="text-[#F0E2C2]/85">{it.label}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mb-3">
              <h4 className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mb-2">Trails &amp; roads</h4>
              <ul className="grid grid-cols-1 gap-1.5">
                {TRAIL_ITEMS.map((it) => (
                  <li key={it.label} className="flex items-center gap-2.5 text-[13px]">
                    {it.sample}
                    <span className="text-[#F0E2C2]/85">{it.label}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mb-2">On the map</h4>
              <ul className="grid grid-cols-1 gap-1.5">
                {AREA_ITEMS.map((it) => (
                  <li key={it.label} className="flex items-center gap-2.5 text-[13px]">
                    {it.sample}
                    <span className="text-[#F0E2C2]/85">{it.label}</span>
                  </li>
                ))}
              </ul>
            </section>

            <p className="mt-3 text-[10.5px] text-[#F0E2C2]/45 leading-snug">
              Tap any pin for details. Pinch to zoom in for clustered spots.
            </p>
          </div>
        </>
      )}
    </>
  );
}
