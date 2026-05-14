"use client";

import { useEffect, useRef, useState } from "react";

// Map legend: floating "?" button at the right edge of the map. Tapping
// opens a panel explaining pins, trails, and area shadings. On a guest's
// first visit, the panel auto-opens for ~6 seconds. When the user closes
// it (or it auto-closes), the panel "swooshes" — animates scale-and-translate
// toward the button — so it's visually obvious where it went and how to
// open it again.

const SEEN_KEY = "falls-legend-seen-v2";
const CLOSE_ANIM_MS = 320;

type LegendItem = { sample: React.ReactElement; label: string };

const PIN_ITEMS: LegendItem[] = [
  { sample: <span className="block h-4 w-4 rounded-full bg-[#B23A1F] border-2 border-[#F0E2C2]" />, label: "Cabin" },
  { sample: <span className="block h-4 w-4 rounded-full bg-[#D9531E] border-2 border-[#F0E2C2]" />, label: "Firepit" },
  { sample: <span className="block h-4 w-4 rounded-full bg-[#7A5A2F] border-2 border-[#F0E2C2]" />, label: "Pavilion" },
  { sample: <span className="block h-4 w-4 rounded-full bg-[#6B4423] border-2 border-[#F0E2C2]" />, label: "Barn / shack" },
  { sample: <span className="block h-4 w-4 rounded-full bg-[#3F6B2A] border-2 border-[#F0E2C2]" />, label: "Treehouse" },
  { sample: <span className="block h-4 w-4 rounded-full bg-[#2E6FA0] border-2 border-[#F0E2C2]" />, label: "Lake / dock" },
  { sample: <span className="block h-4 w-4 rounded-full bg-[#1f1410] border-2 border-[#F0E2C2]" />, label: "Bear / bobcat carving" },
];

const TRAIL_ITEMS: LegendItem[] = [
  { sample: <span className="block h-[5px] w-7 rounded-full" style={{ background: "#9A938A" }} />, label: "Gravel road (any vehicle)" },
  { sample: <span className="block h-[5px] w-7 rounded-full" style={{ background: "#D9531E" }} />, label: "4WD trail (truck or SUV)" },
  { sample: <span className="block h-[4px] w-7" style={{ backgroundImage: "linear-gradient(to right, #F0E2C2 0, #F0E2C2 28.6%, transparent 28.6%, transparent 100%)", backgroundSize: "14px 100%" }} />, label: "Walking trail (on foot)" },
];

const AREA_ITEMS: LegendItem[] = [
  // Saturated gold band with a soft dark halo — matches the fenceline
  // boundary rendered by PropertyMap (owned-line-shadow + owned-line layers).
  { sample: <span className="block h-[7px] w-7 rounded-full" style={{ background: "#1F5E2E", boxShadow: "0 0 0 2px rgba(26,15,8,0.85)" }} />, label: "Property boundary" },
  { sample: <span className="block h-3 w-7 rounded-sm bg-[#3a82c2]/70 border border-[#1d5688]/80" />, label: "Lake / water" },
  { sample: <span className="block h-3 w-7 rounded-sm bg-[#7d8f5a]/70" />, label: "Horse pasture" },
];

export default function MapLegend({ hidden = false }: { hidden?: boolean }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === "1"; } catch {}
    if (seen) return;
    const openTimer = setTimeout(() => setOpen(true), 600);
    const autoCloseTimer = setTimeout(() => { triggerClose(); }, 6800);
    return () => { clearTimeout(openTimer); clearTimeout(autoCloseTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerClose = () => {
    const pop = popoverRef.current;
    const btn = buttonRef.current;
    if (!pop || !btn) {
      setOpen(false);
      try { localStorage.setItem(SEEN_KEY, "1"); } catch {}
      return;
    }
    const popRect = pop.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const dx = (btnRect.left + btnRect.width / 2) - (popRect.left + popRect.width / 2);
    const dy = (btnRect.top + btnRect.height / 2) - (popRect.top + popRect.height / 2);
    pop.style.transition = `transform ${CLOSE_ANIM_MS}ms cubic-bezier(0.6, 0.02, 0.7, 0.2), opacity ${CLOSE_ANIM_MS - 80}ms ease-in`;
    pop.style.transformOrigin = "center";
    pop.style.transform = `translate(${dx}px, ${dy}px) scale(0.04)`;
    pop.style.opacity = "0";
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
      try { localStorage.setItem(SEEN_KEY, "1"); } catch {}
    }, CLOSE_ANIM_MS);
  };

  if (hidden) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => (open ? triggerClose() : setOpen(true))}
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
          <button aria-label="Close legend" onClick={triggerClose} className="absolute inset-0 z-[11] cursor-default bg-transparent" />
          <div
            ref={popoverRef}
            className={"ios-glass-strong absolute z-[12] rounded-3xl text-[#F0E2C2] shadow-[0_18px_44px_rgba(0,0,0,0.45)] flex flex-col " + (closing ? "" : "animate-pop-up")}
            style={{
              // Sit JUST LEFT of the right-edge button stack (buttons at right:1rem,
              // 3rem wide). 5rem gives a clean visual gap so the buttons remain
              // visible while the legend is open and the panel never needs to scroll.
              right: "5rem",
              top: "calc(env(safe-area-inset-top, 0px) + 1rem)",
              maxHeight: "calc(100svh - env(safe-area-inset-top, 0px) - 4rem)",
              width: "min(290px, calc(100vw - 6rem))",
              padding: "14px 14px 12px 14px",
              transformOrigin: "top right",
              willChange: "transform, opacity",
            }}
            role="dialog"
            aria-label="Map legend"
          >
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="ios-headline text-[15px] text-[#F0E2C2]">Legend</h3>
              <button onClick={triggerClose} aria-label="Close" className="ios-press text-[11px] uppercase tracking-[0.14em] text-[#B89968]">Close</button>
            </div>
            <section className="mb-2.5">
              <h4 className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mb-1.5">Pins</h4>
              <ul className="grid grid-cols-1 gap-1">
                {PIN_ITEMS.map((it) => (
                  <li key={it.label} className="flex items-center gap-2.5 text-[13px]">{it.sample}<span className="text-[#F0E2C2]/85">{it.label}</span></li>
                ))}
              </ul>
            </section>
            <section className="mb-2.5">
              <h4 className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mb-1.5">Trails &amp; roads</h4>
              <ul className="grid grid-cols-1 gap-1">
                {TRAIL_ITEMS.map((it) => (
                  <li key={it.label} className="flex items-center gap-2.5 text-[13px]">{it.sample}<span className="text-[#F0E2C2]/85">{it.label}</span></li>
                ))}
              </ul>
            </section>
            <section>
              <h4 className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mb-1.5">On the map</h4>
              <ul className="grid grid-cols-1 gap-1">
                {AREA_ITEMS.map((it) => (
                  <li key={it.label} className="flex items-center gap-2.5 text-[13px]">{it.sample}<span className="text-[#F0E2C2]/85">{it.label}</span></li>
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
