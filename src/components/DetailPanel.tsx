"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { categoryStyle } from "@/data/pois";

// Mirror of the pin icon paths so the detail-panel badge shows the same icon
// as on the map. Smaller, simplified versions for the 40px chip.
const ICON_PATHS: Record<string, string> = {
  cabin: '<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4.5v3"/><path d="M3 12 12 4l9 8"/><path d="M5 12v9h14v-9"/><path d="M10 21v-5h4v5"/></g>',
  pavilion: '<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 3l9 8"/><path d="M6 11v10"/><path d="M18 11v10"/><path d="M4 21h16"/></g>',
  firepit: '<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-1.5 3-4 4-4 8 a4 4 0 0 0 8 0c0-4-2.5-5-4-8z"/><path d="M5 21l3-1M19 21l-3-1"/></g>',
  "lake-feature": '<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="M12 6l5 9H12z" fill="#F0E2C2"/><path d="M4 16c3 2.5 13 2.5 16 0"/></g>',
  barn: '<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V11l9-7 9 7v10z"/><path d="M9 21v-5.5h6V21"/><path d="M9 15.5l6 5.5M15 15.5l-6 5.5"/></g>',
  treehouse: '<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.5" r="5.5"/><path d="M10.5 14v7M13.5 14v7"/><path d="M10.5 16h3M10.5 19h3"/></g>',
  shack: '<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21v-9l8-5 8 5v9z"/><circle cx="12" cy="15" r="3.5"/><circle cx="12" cy="15" r="1.5" fill="#F0E2C2" stroke="none"/></g>',
  bear: '<g stroke="#F0E2C2" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"><circle cx="8.5" cy="4.2" r="1.6" fill="#F0E2C2"/><circle cx="15.5" cy="4.2" r="1.6" fill="#F0E2C2"/><circle cx="12" cy="6.5" r="3.6" fill="#F0E2C2"/><ellipse cx="12" cy="14.5" rx="5" ry="6" fill="#F0E2C2"/><circle cx="10.4" cy="6.1" r="0.55" fill="#1f1410" stroke="none"/><circle cx="13.6" cy="6.1" r="0.55" fill="#1f1410" stroke="none"/><ellipse cx="12" cy="8" rx="1.2" ry="0.7" fill="#1f1410" stroke="none"/></g>',
  bobcat: '<g stroke="#F0E2C2" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"><path d="M8.5 2.5 L7.5 5.5 L10.2 4.8 Z" fill="#F0E2C2"/><path d="M15.5 2.5 L16.5 5.5 L13.8 4.8 Z" fill="#F0E2C2"/><ellipse cx="12" cy="7" rx="3.4" ry="3" fill="#F0E2C2"/><ellipse cx="12" cy="14.5" rx="3.7" ry="6" fill="#F0E2C2"/><circle cx="10.6" cy="6.6" r="0.5" fill="#1f1410" stroke="none"/><circle cx="13.4" cy="6.6" r="0.5" fill="#1f1410" stroke="none"/></g>',
};

import type { SelectedItem } from "./PropertyMap";

type Props = {
  item: SelectedItem | null;
  onClose: () => void;
};

// Two snap-detents (in svh). The sheet's `top` interpolates between them.
// COLLAPSED is the default — shows ~55% of the screen, plenty for a photo +
// description. EXPANDED gives the user the whole sheet at full reading height.
const DETENT_COLLAPSED_SVH = 45;
const DETENT_EXPANDED_SVH = 6;
// Drag below 70%-down dismisses.
const DETENT_DISMISS_SVH = 80;

export default function DetailPanel({ item, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef({
    active: false,
    startY: 0,
    startTime: 0,
    lastY: 0,
    lastTime: 0,
  });
  const [detent, setDetent] = useState<"collapsed" | "expanded">("collapsed");

  // Reset to collapsed whenever a NEW item is opened.
  const itemKey = item
    ? item.kind === "cabin"
      ? `cabin-${item.data.slug}`
      : `poi-${item.data.slug}`
    : null;
  useEffect(() => {
    setDetent("collapsed");
  }, [itemKey]);

  if (!item) return null;

  const style =
    item.kind === "cabin"
      ? categoryStyle.cabin
      : categoryStyle[item.data.category];

  const subtitle =
    item.kind === "cabin"
      ? `${item.data.bedrooms} BR · ${item.data.bathrooms} BA`
      : style?.label ?? "Location";

  const photoSrc =
    item.kind === "cabin" ? item.data.coverPhoto : item.data.photoUrl;

  // Compute current top from detent + any active drag offset.
  const detentTopSvh =
    detent === "expanded" ? DETENT_EXPANDED_SVH : DETENT_COLLAPSED_SVH;

  const onPointerDown = (e: React.PointerEvent) => {
    if (!sheetRef.current) return;
    drag.current.active = true;
    drag.current.startY = e.clientY;
    drag.current.startTime = Date.now();
    drag.current.lastY = e.clientY;
    drag.current.lastTime = Date.now();
    sheetRef.current.style.transition = "none";
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active || !sheetRef.current) return;
    const dy = e.clientY - drag.current.startY;
    drag.current.lastY = e.clientY;
    drag.current.lastTime = Date.now();

    // Apply drag offset directly to the DOM — bypass React render.
    sheetRef.current.style.transform = `translateY(${dy}px)`;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current.active || !sheetRef.current) return;
    drag.current.active = false;

    const dy = e.clientY - drag.current.startY;
    const dt = Math.max(1, Date.now() - drag.current.startTime);
    const velocity = dy / dt; // px/ms, positive = downward, negative = upward

    // Snap target decision — driven by drag distance AND velocity.
    // Velocity threshold ~0.5 px/ms = a clear flick.
    let nextDetent: "collapsed" | "expanded" | "dismiss" = detent;

    if (detent === "collapsed") {
      if (dy > 140 || velocity > 0.6) nextDetent = "dismiss";
      else if (dy < -60 || velocity < -0.4) nextDetent = "expanded";
    } else {
      // expanded
      if (dy > 260 || velocity > 0.9) nextDetent = "dismiss";
      else if (dy > 80 || velocity > 0.4) nextDetent = "collapsed";
    }

    // Reset inline transform so React's className-based top/height applies.
    sheetRef.current.style.transition =
      "transform 280ms cubic-bezier(0.2, 0.85, 0.25, 1.02), top 280ms cubic-bezier(0.2, 0.85, 0.25, 1.02)";
    sheetRef.current.style.transform = "";

    if (nextDetent === "dismiss") {
      // Slide off the bottom then close — let CSS do the animation.
      sheetRef.current.style.transform = `translateY(100vh)`;
      setTimeout(onClose, 220);
    } else if (nextDetent !== detent) {
      setDetent(nextDetent);
    }
  };

  return (
    <div
      ref={sheetRef}
      className="ios-glass-strong fixed inset-x-0 bottom-0 z-20 flex flex-col rounded-t-[28px] text-[#F0E2C2] shadow-[0_-12px_40px_rgba(0,0,0,0.55)]"
      style={{
        top: `${detentTopSvh}svh`,
        transition:
          "transform 280ms cubic-bezier(0.2, 0.85, 0.25, 1.02), top 280ms cubic-bezier(0.2, 0.85, 0.25, 1.02)",
        paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
        willChange: "transform, top",
      }}
    >
      {/* Drag handle — pointer events live here. Larger hit zone (whole
          top strip) so a thumb on the grabber works even if it's a bit
          off. The grabber itself is the visible dash. */}
      <div
        className="flex-shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ paddingTop: 10, paddingBottom: 6 }}
        aria-label="Drag to expand or dismiss"
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-[#F0E2C2]/35" />
      </div>

      {/* Header with badge + title + close button */}
      <div className="flex items-center gap-3 px-5 py-2 border-b border-[#B89968]/15 flex-shrink-0">
        <div
          className="h-10 w-10 rounded-full grid place-items-center border-2 border-[#F0E2C2] flex-shrink-0"
          style={{ background: style?.color ?? "#7A5A2F" }}
          dangerouslySetInnerHTML={{
            __html: `<svg width="22" height="22" viewBox="0 0 24 24">${
              ICON_PATHS[item.kind === "cabin" ? "cabin" : item.data.category] ?? ""
            }</svg>`,
          }}
        />
        <div className="flex-1 min-w-0">
          <h2 className="ios-headline truncate text-[18px] leading-tight">
            {item.data.name}
          </h2>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#B89968] mt-0.5">
            {subtitle}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="ios-press grid h-9 w-9 place-items-center rounded-full bg-[#F0E2C2]/10 text-[#F0E2C2]/70 hover:text-[#F0E2C2]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable content area — gets the remaining height. */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
        {photoSrc && item.kind === "cabin" && (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#2A1F18]">
            <Image
              src={photoSrc}
              alt={item.data.name}
              fill
              sizes="(max-width: 640px) 100vw, 640px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        {photoSrc && item.kind === "poi" && (
          <div className="w-full overflow-hidden rounded-2xl bg-[#2A1F18] grid place-items-center">
            <img
              src={photoSrc}
              alt={item.data.name}
              className="block max-h-[340px] w-auto object-contain"
            />
          </div>
        )}

        {item.kind === "cabin" && (
          <>
            <p className="text-[15px] leading-relaxed text-[#F0E2C2]/85">
              {item.data.description}
            </p>
            {item.data.amenities.length > 0 && (
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.16em] text-[#B89968] mb-2">
                  Amenities
                </h3>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[14px]">
                  {item.data.amenities.map((a) => (
                    <li key={a} className="flex items-start gap-2">
                      <span className="text-[#B89968] mt-1">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {item.data.bookingUrl && (
              <a
                href={item.data.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ios-press block text-center rounded-2xl bg-[#F0E2C2] text-[#1A1310] font-semibold py-3.5 mt-2 shadow-[0_8px_24px_rgba(184,153,104,0.25)]"
              >
                Book direct
              </a>
            )}
          </>
        )}

        {item.kind === "poi" && (
          <>
            <p className="text-[15px] leading-relaxed text-[#F0E2C2]/85">
              {item.data.description}
            </p>
            {item.data.story && (
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.16em] text-[#B89968] mb-2">
                  The Story
                </h3>
                <p className="font-hand text-[19px] leading-relaxed text-[#F0E2C2]/90">
                  {item.data.story}
                </p>
              </div>
            )}
          </>
        )}

        <div className="pt-2 text-[11px] text-[#B89968]/70 border-t border-[#B89968]/15">
          {item.data.lat.toFixed(5)}°N, {Math.abs(item.data.lng).toFixed(5)}°W
        </div>
      </div>
    </div>
  );
}
