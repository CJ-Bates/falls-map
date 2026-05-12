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
  bobcat: '<g stroke="#F0E2C2" stroke-width="1" stroke-linejoin="round" stroke-linecap="round" fill="none"><!-- Body (compact crouched cat) --><path d="M7 14 Q6 16 6 18 Q6 20.5 7.5 21 L16.5 21 Q18 20.5 18 18 Q18 16 17 14 L16 12 L8 12 Z" fill="#F0E2C2"/><!-- Bobbed tail (the namesake stub) --><path d="M17 15.5 Q19.5 15 19.2 17.5 Q18.5 18.5 17 18" fill="#F0E2C2"/><!-- Tufted ears (defining feature) --><path d="M6.5 5 L8 1 L11 5 Z" fill="#F0E2C2"/><line x1="7.8" y1="1.3" x2="7.4" y2="0" stroke-width="0.6"/><line x1="8.4" y1="1.5" x2="8.6" y2="0.2" stroke-width="0.6"/><path d="M17.5 5 L16 1 L13 5 Z" fill="#F0E2C2"/><line x1="16.2" y1="1.3" x2="16.6" y2="0" stroke-width="0.6"/><line x1="15.6" y1="1.5" x2="15.4" y2="0.2" stroke-width="0.6"/><!-- Head with integrated cheek-ruff flares --><path d="M7.5 7 Q6.8 9.5 7.5 11 L6.2 11.5 L8 12 Q9 12.8 12 12.8 Q15 12.8 16 12 L17.8 11.5 L16.5 11 Q17.2 9.5 16.5 7 Q15.5 5 13.8 4.5 Q12 4 10.2 4.5 Q8.5 5 7.5 7 Z" fill="#F0E2C2"/><!-- Front paws --><ellipse cx="9.5" cy="21.3" rx="1.1" ry="0.5" fill="#F0E2C2"/><ellipse cx="14.5" cy="21.3" rx="1.1" ry="0.5" fill="#F0E2C2"/><!-- Cat-like almond eyes --><ellipse cx="10" cy="8.2" rx="0.6" ry="0.85" fill="#1f1410" stroke="none"/><ellipse cx="14" cy="8.2" rx="0.6" ry="0.85" fill="#1f1410" stroke="none"/><!-- Nose --><path d="M11.4 9.9 L12.6 9.9 L12 10.7 Z" fill="#1f1410" stroke="none"/><!-- Mouth philtrum line --><path d="M12 10.7 L12 11.4" stroke="#1f1410" stroke-width="0.5" fill="none"/><!-- Whiskers --><line x1="8.6" y1="10.4" x2="5.8" y2="10" stroke-width="0.4"/><line x1="8.6" y1="11" x2="5.8" y2="11.3" stroke-width="0.4"/><line x1="15.4" y1="10.4" x2="18.2" y2="10" stroke-width="0.4"/><line x1="15.4" y1="11" x2="18.2" y2="11.3" stroke-width="0.4"/><!-- Body spots --><circle cx="9.5" cy="15.5" r="0.45" fill="#3a2d22" stroke="none"/><circle cx="12" cy="16.5" r="0.45" fill="#3a2d22" stroke="none"/><circle cx="14.5" cy="15.5" r="0.45" fill="#3a2d22" stroke="none"/><circle cx="10.5" cy="18.5" r="0.35" fill="#3a2d22" stroke="none"/><circle cx="13.5" cy="18.5" r="0.35" fill="#3a2d22" stroke="none"/></g>',
};

import type { SelectedItem } from "./PropertyMap";
import type { Route, Surface } from "@/lib/routing";
import PoiPhotos from "./PoiPhotos";

type Props = {
  item: SelectedItem | null;
  onClose: () => void;
  // Directions support — wired up by the map page.
  onGetDirections?: () => void;
  route?: Route | null;
  routeFromName?: string | null;
  onReverseRoute?: () => void;
  onClearRoute?: () => void;
  onStartNavigation?: () => void;
};

// Two snap-detents (in svh). The sheet's `top` interpolates between them.
// COLLAPSED is the default — shows ~55% of the screen, plenty for a photo +
// description. EXPANDED gives the user the whole sheet at full reading height.
const DETENT_COLLAPSED_SVH = 45;
const DETENT_EXPANDED_SVH = 6;
// Drag below 70%-down dismisses.
const DETENT_DISMISS_SVH = 80;

export default function DetailPanel({ item, onClose, onGetDirections, route, routeFromName, onReverseRoute, onClearRoute, onStartNavigation }: Props) {
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

  const TRAIL_SURFACE_COLOR: Record<string, string> = {
    paved:  "#3D3022",
    gravel: "#C9A974",
    "4wd":  "#D9531E",
    trail:  "#F0E2C2",
  };
  const style =
    item.kind === "cabin"
      ? categoryStyle.cabin
      : item.kind === "trail"
        ? { label: "Trail", color: TRAIL_SURFACE_COLOR[item.data.surface] ?? "#C9A974", emoji: "🥾" }
        : categoryStyle[item.data.category];

  const subtitle =
    item.kind === "cabin"
      ? `${item.data.bedrooms} BR · ${item.data.bathrooms} BA`
      : item.kind === "trail"
        ? `${(item.data.lengthM / 1609.344).toFixed(2)} mi · ${item.data.surface === "trail" ? "Walking" : item.data.surface === "4wd" ? "4WD" : item.data.surface === "gravel" ? "Gravel" : "Paved"}`
        : style?.label ?? "Location";

  const photoSrc =
    item.kind === "cabin"
      ? item.data.coverPhoto
      : item.kind === "poi"
        ? item.data.photoUrl
        : undefined;

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
              item.kind === "cabin"
                ? ICON_PATHS.cabin
                : item.kind === "trail"
                  ? '<g fill="none" stroke="#F0E2C2" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 L7 9 L11 13 L8 17 L11 20"/><path d="M14 4 L17 8 L13 12 L17 16 L15 20"/></g>'
                  : ICON_PATHS[item.data.category] ?? ""
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
            <PoiPhotos slug={item.data.slug} />
          </>
        )}

        {item.kind === "trail" && (
          <>
            {item.data.description && (
              <p className="text-[15px] leading-relaxed text-[#F0E2C2]/85">
                {item.data.description}
              </p>
            )}
            <div className="flex gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{
                  background: `${(TRAIL_SURFACE_COLOR[item.data.surface] ?? "#C9A974")}22`,
                  color: TRAIL_SURFACE_COLOR[item.data.surface] === "#F0E2C2" ? "#F0E2C2" : (TRAIL_SURFACE_COLOR[item.data.surface] ?? "#C9A974"),
                  border: `1px solid ${(TRAIL_SURFACE_COLOR[item.data.surface] ?? "#C9A974")}55`,
                }}
              >
                <span
                  className="block h-[3px] w-5 rounded-full"
                  style={{ background: TRAIL_SURFACE_COLOR[item.data.surface] ?? "#C9A974" }}
                />
                {item.data.surface === "trail" ? "Walking only" :
                 item.data.surface === "4wd" ? "4WD" :
                 item.data.surface === "gravel" ? "Any vehicle" : "Paved"}
              </span>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F0E2C2]/75 bg-[#F0E2C2]/8">
                {(item.data.lengthM / 1609.344).toFixed(2)} mi
              </span>
            </div>
          </>
        )}

        {/* Directions panel — shows the Directions button (when no route)
            or a route summary card with distance + ETAs + surface breakdown
            (when one is active). */}
        {onGetDirections && item.kind !== "trail" && (
          <DirectionsBlock
            route={route ?? null}
            fromName={routeFromName ?? null}
            toName={item.data.name}
            onGetDirections={onGetDirections}
            onReverseRoute={onReverseRoute}
            onClearRoute={onClearRoute}
            onStartNavigation={onStartNavigation}
          />
        )}

        <div className="pt-2 text-[11px] text-[#B89968]/70 border-t border-[#B89968]/15">
          {item.kind === "trail"
            ? `${item.data.coords[0]?.[1].toFixed(5)}°N, ${Math.abs(item.data.coords[0]?.[0] ?? 0).toFixed(5)}°W`
            : `${item.data.lat.toFixed(5)}°N, ${Math.abs(item.data.lng).toFixed(5)}°W`}
        </div>
      </div>
    </div>
  );
}

// Directions affordance + route summary card.
function DirectionsBlock({
  route,
  fromName,
  toName,
  onGetDirections,
  onReverseRoute,
  onClearRoute,
  onStartNavigation,
}: {
  route: Route | null;
  fromName: string | null;
  toName: string;
  onGetDirections: () => void;
  onReverseRoute?: () => void;
  onClearRoute?: () => void;
  onStartNavigation?: () => void;
}) {
  if (!route) {
    return (
      <button
        onClick={onGetDirections}
        className="ios-press w-full rounded-2xl bg-[#2E78D2] text-white font-semibold py-3.5 mt-2 shadow-[0_8px_24px_rgba(46,120,210,0.35)] inline-flex items-center justify-center gap-2"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11 21 3l-8 18-2-7-8-3z"/>
        </svg>
        Directions
      </button>
    );
  }

  const miles = route.distance / 1609.344;
  const walkMin = Math.max(1, Math.round(route.distance / 1.25 / 60));
  const driveMin = Math.max(1, Math.round(route.distance / 6.7 / 60));

  return (
    <div className="rounded-2xl bg-[#2E78D2]/12 border border-[#2E78D2]/30 p-3.5 space-y-3">
      {/* From → To header */}
      <div className="flex items-center gap-2.5">
        <div className="flex flex-col gap-1 items-center pt-0.5">
          <span className="block h-2 w-2 rounded-full bg-[#7d8f5a] ring-2 ring-[#7d8f5a]/30" />
          <span className="block h-3 w-px bg-[#F0E2C2]/30" />
          <span className="block h-2 w-2 rounded-full bg-[#2E78D2] ring-2 ring-[#2E78D2]/30" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="text-[13px] text-[#F0E2C2]/85 leading-tight truncate">
            {fromName ?? "Start"}
          </div>
          <div className="text-[13px] font-semibold text-[#F0E2C2] leading-tight truncate">
            {toName}
          </div>
        </div>
        {onReverseRoute && (
          <button
            onClick={onReverseRoute}
            aria-label="Reverse direction"
            className="ios-press grid h-9 w-9 place-items-center rounded-full bg-[#F0E2C2]/10 text-[#67B0FF] hover:bg-[#F0E2C2]/15 flex-shrink-0"
            title="Reverse"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m17 3 4 4-4 4"/>
              <path d="M21 7H8a4 4 0 0 0-4 4"/>
              <path d="m7 21-4-4 4-4"/>
              <path d="M3 17h13a4 4 0 0 0 4-4"/>
            </svg>
          </button>
        )}
      </div>

      {/* Distance + ETAs */}
      <div className="flex items-baseline justify-between gap-2 pt-1">
        <div className="flex items-baseline gap-3">
          <div className="text-[22px] font-bold leading-none text-[#F0E2C2]">
            {miles.toFixed(2)}
            <span className="text-[12px] font-semibold text-[#F0E2C2]/55 ml-1">mi</span>
          </div>
          <div className="flex items-baseline gap-2 text-[#F0E2C2]/85 text-[13px]">
            <span>{walkMin} min walk</span>
            <span className="text-[#F0E2C2]/30">·</span>
            <span>{driveMin} min 4WD</span>
          </div>
        </div>
        {onClearRoute && (
          <button
            onClick={onClearRoute}
            className="ios-press text-[12px] text-[#67B0FF] font-semibold whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>

      {/* Surface breakdown — stacked bar visualization */}
      <div className="space-y-1.5">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#F0E2C2]/10">
          {route.segments.map((s, i) => (
            <div
              key={i}
              style={{
                width: `${(s.distance / route.distance) * 100}%`,
                background: SURFACE_COLOR[s.surface] ?? "#C9A974",
              }}
              title={`${s.trailName} · ${(s.distance / 1609.344).toFixed(2)} mi`}
            />
          ))}
        </div>
        <ul className="text-[12px] text-[#F0E2C2]/85 space-y-0.5">
          {collapseSegments(route).slice(0, 4).map((s, i) => (
            <li key={i} className="flex items-center gap-2">
              <span
                className="h-1.5 w-3 rounded-full flex-shrink-0"
                style={{ background: SURFACE_COLOR[s.surface] ?? "#C9A974" }}
              />
              <span className="truncate">{s.trailName}</span>
              <span className="text-[#F0E2C2]/55 ml-auto whitespace-nowrap">
                {(s.distance / 1609.344).toFixed(2)} mi
              </span>
            </li>
          ))}
          {collapseSegments(route).length > 4 && (
            <li className="text-[#F0E2C2]/55 pl-5">
              + {collapseSegments(route).length - 4} more
            </li>
          )}
        </ul>
      </div>

      {onStartNavigation && (
        <button
          onClick={onStartNavigation}
          className="ios-press w-full rounded-2xl bg-[#2E78D2] text-white font-semibold py-3 mt-1 shadow-[0_8px_24px_rgba(46,120,210,0.35)] inline-flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Start
        </button>
      )}
    </div>
  );
}

const SURFACE_COLOR: Record<Surface, string> = {
  paved:  "#3D3022",
  gravel: "#C9A974",
  "4wd":  "#D9531E",
  trail:  "#F0E2C2",
};

// Collapse same-trail-name adjacent segments for the legend (the route
// itself already collapses by trail-name + surface, but the bar uses raw
// segments).
function collapseSegments(route: Route) {
  return route.segments;
}
