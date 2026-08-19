"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { SelectedItem, Basemap, PoiVisibility } from "@/components/PropertyMap";

// MapLibre GL (~800 KB of JS + CSS) only loads when the map route actually
// renders, instead of riding along in the initial chunk. Type-only imports
// above are erased at build time, so they don't defeat the split.
const PropertyMap = dynamic(() => import("@/components/PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0e0a08]">
      <span className="font-hand text-2xl text-[#B89968]">Unrolling the map…</span>
    </div>
  ),
});
import MapLegend from "@/components/MapLegend";
import OfflineButton from "@/components/OfflineButton";
import DetailPanel from "@/components/DetailPanel";
import {
  prefetchAll,
  propertyTileCoords,
  readOfflineStatus,
  writeOfflineStatus,
  type PrefetchProgress,
  type OfflineStatus,
} from "@/lib/offlineTiles";
import {
  getTrailGraph,
  shortestPath,
  snapToGraph,
  type LngLat,
  type Route,
} from "@/lib/routing";
import { publicCabins } from "@/data/cabins";
import { pois, categoryStyle } from "@/data/pois";
import { haversine } from "@/lib/routing";
import trailsData from "@/data/trails.json";

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
function ThumbRelief() {
  return (
    <svg viewBox="0 0 80 60" preserveAspectRatio="none" className="h-full w-full">
      <rect width="80" height="60" fill="#EFE4CC" />
      {/* soft shaded ridges — light from the NW, same as the real layer */}
      <path d="M0 40 Q 14 20, 28 34 T 56 26 T 80 36 L80 60 L0 60 Z" fill="#C9B48D" opacity="0.85" />
      <path d="M0 44 Q 16 28, 30 40 T 58 32 T 80 42 L80 60 L0 60 Z" fill="#A98F66" opacity="0.7" />
      <path d="M0 34 Q 14 16, 28 30" stroke="#FBF1D8" strokeWidth="2" fill="none" opacity="0.9" />
      <path d="M30 38 Q 44 22, 58 30" stroke="#FBF1D8" strokeWidth="1.6" fill="none" opacity="0.75" />
      <circle cx="64" cy="50" r="4" fill="#3a82c2" opacity="0.6" />
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
  // Added alongside the original three, not replacing any of them.
  { id: "relief",    label: "Relief",    Thumb: ThumbRelief },
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

// Pretty-print a Date as a relative-time string for the offline-status caption.
function SourceOption({
  label,
  sub,
  onClick,
}: {
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="ios-press w-full rounded-2xl bg-[#F0E2C2]/8 hover:bg-[#F0E2C2]/14 transition-colors px-4 py-3 text-left flex items-center justify-between gap-3"
    >
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-[#F0E2C2] leading-tight truncate">{label}</div>
        <div className="text-[12px] text-[#F0E2C2]/60 mt-0.5 truncate">{sub}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-[#F0E2C2]/60 flex-shrink-0">
        <path d="m9 6 6 6-6 6" />
      </svg>
    </button>
  );
}

function PoiToggleRow({
  label,
  count,
  color,
  active,
  onToggle,
}: {
  label: string;
  count: number;
  color: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        onClick={onToggle}
        aria-pressed={active}
        className="ios-press w-full flex items-center gap-3 py-1.5"
      >
        <span
          className="block h-3 w-3 rounded-full flex-shrink-0"
          style={{
            background: color,
            boxShadow: active ? `0 0 8px ${color}80` : "none",
            opacity: active ? 1 : 0.35,
          }}
        />
        <span
          className={
            "flex-1 text-left text-[13px] font-semibold leading-none transition-colors " +
            (active ? "text-[#F0E2C2]" : "text-[#F0E2C2]/60")
          }
        >
          {label}
        </span>
        {count > 0 && (
          <span
            className={
              "text-[11px] tabular-nums transition-colors " +
              (active ? "text-[#F0E2C2]/55" : "text-[#F0E2C2]/30")
            }
          >
            {count}
          </span>
        )}
        {/* iOS-style toggle pill */}
        <span
          className="relative inline-flex h-6 w-10 flex-shrink-0 rounded-full transition-colors"
          style={{ background: active ? "#7d8f5a" : "rgba(240, 226, 194, 0.18)" }}
        >
          <span
            className="absolute top-0.5 h-5 w-5 rounded-full bg-[#F0E2C2] shadow-md transition-transform"
            style={{ left: 2, transform: active ? "translateX(16px)" : "translateX(0)" }}
          />
        </span>
      </button>
    </li>
  );
}

function formatAgo(ms: number): string {
  const delta = Date.now() - ms;
  const min = Math.floor(delta / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return `${Math.floor(day / 7)}w ago`;
}

// ---------- page --------------------------------------------------------------
export default function MapPage() {
  const [selected, setSelectedRaw] = useState<SelectedItem | null>(null);

  // Wrapper around setSelected that also records which pin/trail was opened.
  // Analytics lives here (rather than in PropertyMap) so there is exactly one
  // place where a selection happens, no matter which control triggered it.
  const setSelected = useCallback((item: SelectedItem | null) => {
    setSelectedRaw(item);
    if (!item) return;
    if (item.kind === "poi") track("poi_open", { slug: item.data.slug, name: item.data.name });
    else if (item.kind === "cabin") track("cabin_open", { slug: item.data.slug, name: item.data.name });
    else if (item.kind === "trail") track("trail_open", { slug: item.data.slug, name: item.data.name });
  }, []);
  const [basemap, setBasemap] = useState<Basemap>("topo");
  const [layersOpen, setLayersOpen] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus | null>(null);
  const [downloading, setDownloading] = useState<PrefetchProgress | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [routeFrom, setRouteFrom] = useState<{ coord: LngLat; name: string } | null>(null);
  const [routeTo, setRouteTo] = useState<{ coord: LngLat; name: string } | null>(null);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [poiVisibility, setPoiVisibility] = useState<PoiVisibility>({
    cabins: true,
    spots: true,
    carvings: true,
  });
  // Trails toggle — hides trail lines + labels for a bare-property view.
  // Pin visibility is controlled separately by the Points section below.
  const [showTrails, setShowTrails] = useState(true);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("falls-show-trails");
      if (raw === "0") setShowTrails(false);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("falls-show-trails", showTrails ? "1" : "0"); } catch {}
  }, [showTrails]);

  // Live navigation
  const [navigating, setNavigating] = useState(false);
  const [userPos, setUserPos] = useState<LngLat | null>(null);
  const [arrived, setArrived] = useState(false);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // URL focus parameter — deep-links from the home tiles and the cabin
  // welcome pages:
  //   /map?focus=trail-<slug>  → fit the map to that trail's bounding box
  //   /map?focus=poi-<slug>    → zoom to + select that POI
  //   /map?focus=cabin-<n>     → zoom to + select that cabin (slugs are
  //                              already "cabin-1" etc., no extra prefix)
  const [focusBounds, setFocusBounds] = useState<[[number, number], [number, number]] | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const focus = params.get("focus");
    if (!focus) return;
    const zoomToPoint = (lng: number, lat: number) => {
      const pad = 0.0015;
      setFocusBounds([[lng - pad, lat - pad], [lng + pad, lat + pad]]);
    };
    if (focus.startsWith("trail-")) {
      const slug = focus.slice("trail-".length);
      const match = (trailsData as unknown as {
        features: { properties: { name?: string }; geometry: { coordinates: number[][] } }[];
      }).features.find(
        (f) =>
          (f.properties.name ?? "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") === slug,
      );
      if (match) {
        const lngs = match.geometry.coordinates.map((c) => c[0]);
        const lats = match.geometry.coordinates.map((c) => c[1]);
        setFocusBounds([
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ]);
      }
    } else if (focus === "firepits" || focus === "carvings") {
      // Named groups used by the home "quick action" tiles — frame every
      // matching pin rather than selecting one.
      const match =
        focus === "firepits"
          ? pois.filter((p) => p.category === "firepit")
          : pois.filter((p) => p.category === "bear" || p.category === "bobcat");
      if (match.length > 0) {
        const lngs = match.map((p) => p.lng);
        const lats = match.map((p) => p.lat);
        const pad = 0.001;
        setFocusBounds([
          [Math.min(...lngs) - pad, Math.min(...lats) - pad],
          [Math.max(...lngs) + pad, Math.max(...lats) + pad],
        ]);
      }
    } else if (focus.startsWith("poi-")) {
      const slug = focus.slice("poi-".length);
      const p = pois.find((x) => x.slug === slug);
      if (p) {
        setSelected({ kind: "poi", data: p });
        zoomToPoint(p.lng, p.lat);
      }
    } else if (focus.startsWith("cabin-")) {
      const c = publicCabins.find((x) => x.slug === focus);
      if (c) {
        setSelected({ kind: "cabin", data: c });
        zoomToPoint(c.lng, c.lat);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate POI visibility from localStorage on mount + write back on
  // every change.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("falls-poi-visibility");
      if (raw) {
        const parsed = JSON.parse(raw) as PoiVisibility;
        setPoiVisibility((v) => ({ ...v, ...parsed }));
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("falls-poi-visibility", JSON.stringify(poiVisibility));
    } catch {}
  }, [poiVisibility]);
  const togglePoi = (k: keyof PoiVisibility) =>
    setPoiVisibility((v) => ({ ...v, [k]: !v[k] }));

  // Build the trail-network graph once. Memoized so it doesn't rebuild on
  // every render.
  const graph = useMemo(() => getTrailGraph(), []);

  // Compute a route from a source (lng,lat) to the currently-selected
  // item, by snapping both to graph vertices and running Dijkstra.
  const buildRoute = (
    from: { coord: LngLat; name: string },
    to: { coord: LngLat; name: string },
  ) => {
    const a = snapToGraph(graph, from.coord);
    const b = snapToGraph(graph, to.coord);
    const r = shortestPath(graph, a.node, b.node);
    setRoute(r);
    setRouteFrom(from);
    setRouteTo(to);
  };

  // Called from the source-picker — the destination comes from `selected`.
  // Only cabin/POI selections have direct lng/lat; trails aren't valid
  // destinations for routing.
  const computeRoute = (fromLngLat: LngLat, fromName: string) => {
    if (!selected || selected.kind === "trail") return;
    buildRoute(
      { coord: fromLngLat, name: fromName },
      {
        coord: [selected.data.lng, selected.data.lat],
        name: selected.data.name,
      },
    );
    setSourcePickerOpen(false);
  };

  const reverseRoute = () => {
    if (!routeFrom || !routeTo) return;
    buildRoute(routeTo, routeFrom);
  };

  // Distance from current user position to the route destination,
  // recomputed whenever GPS moves.
  const distanceRemaining =
    navigating && userPos && routeTo
      ? haversine(userPos, routeTo.coord)
      : null;

  // Arrival detection: within 25m of destination triggers an arrival
  // toast and auto-exits nav mode after 4s.
  useEffect(() => {
    if (!navigating || distanceRemaining === null) return;
    if (distanceRemaining < 25 && !arrived) {
      setArrived(true);
      const t = setTimeout(() => {
        setNavigating(false);
        setArrived(false);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [navigating, distanceRemaining, arrived]);

  // When user closes routes or arrives, exit nav.
  useEffect(() => {
    if (!route) {
      setNavigating(false);
      setArrived(false);
    }
  }, [route]);

  const startNavigation = () => {
    setArrived(false);
    setNavigating(true);
    // Close detail panel so the nav banner has room.
    setSelected(null);
  };
  const endNavigation = () => {
    setNavigating(false);
    setArrived(false);
  };

  // Search filtering: match name + description (case-insensitive) across
  // cabins, POIs, and trails.
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as SelectedItem[];
    const out: SelectedItem[] = [];
    for (const c of publicCabins) {
      if (
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      ) {
        out.push({ kind: "cabin", data: c });
      }
    }
    for (const p of pois) {
      if (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.category as string).toLowerCase().includes(q)
      ) {
        out.push({ kind: "poi", data: p });
      }
    }
    type TrailFeat = {
      properties: { name?: string; surface?: string; description?: string; difficulty?: string; cj_note?: string };
      geometry: { coordinates: number[][] };
    };
    for (const t of (trailsData.features as unknown as TrailFeat[])) {
      const name = t.properties.name ?? "";
      if (!name) continue;
      const hay = `${name} ${t.properties.description ?? ""} ${t.properties.cj_note ?? ""}`.toLowerCase();
      if (hay.includes(q)) {
        const coords = t.geometry.coordinates;
        let lengthM = 0;
        for (let i = 1; i < coords.length; i++) {
          lengthM += haversine(coords[i - 1] as LngLat, coords[i] as LngLat);
        }
        out.push({
          kind: "trail",
          data: {
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
            name,
            surface: (t.properties.surface ?? "trail") as "paved" | "gravel" | "4wd" | "trail",
            difficulty: t.properties.difficulty as "easy" | "moderate" | "hard" | undefined,
            description: t.properties.description,
            cj_note: t.properties.cj_note,
            coords,
            lengthM,
          },
        });
      }
    }
    return out.slice(0, 10);
  }, [searchQuery]);

  // Focus the search input when the overlay opens.
  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  const pickSearchResult = (item: SelectedItem) => {
    setSelected(item);
    setSearchOpen(false);
    // Pan/zoom map to the picked item by setting focusBounds.
    if (item.kind === "trail") {
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
      for (const [lng, lat] of item.data.coords) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      if (Number.isFinite(minLng)) {
        setFocusBounds([[minLng, minLat], [maxLng, maxLat]]);
      }
    } else {
      const lng = item.data.lng;
      const lat = item.data.lat;
      const pad = 0.0015;
      setFocusBounds([[lng - pad, lat - pad], [lng + pad, lat + pad]]);
    }
  };

  // Close the source-picker when selection changes, but DON'T clear the
  // route — users want it to persist across closing the detail panel.
  useEffect(() => {
    setSourcePickerOpen(false);
  }, [selected]);

  const clearRoute = () => {
    setRoute(null);
    setRouteFrom(null);
    setRouteTo(null);
  };

  // Hydrate offline status on mount.
  useEffect(() => {
    setOfflineStatus(readOfflineStatus());
  }, []);

  const startOfflineDownload = async () => {
    if (downloading) return;
    const coords = propertyTileCoords(14, 17);
    setDownloading({ total: 0, done: 0, failed: 0 });
    const final = await prefetchAll(coords, (p) => setDownloading(p));
    const status: OfflineStatus = { cachedAt: Date.now(), totalTiles: final.total };
    writeOfflineStatus(status);
    setOfflineStatus(status);
    setDownloading(null);
  };

  return (
    <main className="fixed inset-0 w-full overflow-hidden bg-[#2A1F18]" style={{ height: "100dvh" }}>
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

      {/* Floating route chip — visible only when a route is active and
          the detail panel is closed AND we\'re not in nav mode (the nav
          banner takes its place). */}
      {route && !selected && !navigating && (
        <div
          className="ios-glass-strong absolute z-10 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full pl-3.5 pr-1 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.85rem)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M3 11 21 3l-8 18-2-7-8-3z"/>
          </svg>
          <div className="leading-none">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#B89968]">Route to</div>
            <div className="text-[13px] font-semibold text-[#F0E2C2] mt-0.5">
              {routeTo?.name ?? "destination"}{" · "}
              <span className="text-[#F0E2C2]/65">
                {(route.distance / 1609.344).toFixed(2)} mi
              </span>
            </div>
          </div>
          <button
            onClick={clearRoute}
            aria-label="Clear route"
            className="ios-press grid h-7 w-7 place-items-center rounded-full bg-[#F0E2C2]/10 text-[#F0E2C2]/70 hover:text-[#F0E2C2] flex-shrink-0 ml-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Search button — sits in the top-right while no detail panel /
          source-picker is open. */}
      {!selected && !sourcePickerOpen && !navigating && (
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Search the map"
          className="ios-glass-strong ios-press absolute z-10 grid h-10 w-10 place-items-center rounded-full text-[#F0E2C2]"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
            right: "0.75rem",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
      )}

      <PropertyMap
        onSelect={setSelected}
        basemap={basemap}
        routeCoords={route?.coords ?? null}
        poiVisibility={poiVisibility}
        trailsVisible={showTrails}
        navMode={navigating}
        onUserPosition={setUserPos}
        focusBounds={focusBounds}
      />

      {/* Floating Offline-save button — its own popover, separate from Layers
          so the most important pre-trip action is one tap from the map. */}
      {!selected && !layersOpen && (
        <OfflineButton
          offlineStatus={offlineStatus}
          downloading={downloading}
          onDownload={startOfflineDownload}
        />
      )}

      {/* Floating Legend button — sits above the Offline button. Auto-opens
          on first visit and dismisses itself after a few seconds. */}
      {!selected && !layersOpen && <MapLegend />}

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
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.25rem)", right: "1rem" }}
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
              bottom: "calc(env(safe-area-inset-bottom, 0px) + 8.5rem)",
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
              <div className="grid grid-cols-4 gap-2">
                {BASEMAPS.map((b) => {
                  const active = b.id === basemap;
                  return (
                    <button
                      key={b.id}
                      onClick={() => { setBasemap(b.id); track("basemap_change", { basemap: b.id }); }}
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

            {/* Trails toggle (pins are controlled per-category below) */}
            <div className="pt-3 mt-3 border-t border-[#B89968]/15">
              <h3 className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mb-2">Trails</h3>
              <ul className="space-y-1.5">
                <PoiToggleRow
                  label="Show trails"
                  count={0}
                  color="#cdac7d"
                  active={showTrails}
                  onToggle={() => setShowTrails((v) => !v)}
                />
              </ul>
              <p className="text-[10.5px] text-[#F0E2C2]/60 mt-2 leading-snug">
                Turn off to see the property without trails.
              </p>
            </div>

            {/* Points of interest */}
            <div className="pt-3 mt-3 border-t border-[#B89968]/15">
              <h3 className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mb-2">Points</h3>
              <ul className="space-y-1.5">
                <PoiToggleRow
                  label="Cabins"
                  count={4}
                  color="#B23A1F"
                  active={poiVisibility.cabins}
                  onToggle={() => togglePoi("cabins")}
                />
                <PoiToggleRow
                  label="Spots"
                  count={8}
                  color="#D9531E"
                  active={poiVisibility.spots}
                  onToggle={() => togglePoi("spots")}
                />
                <PoiToggleRow
                  label="Carvings"
                  count={2}
                  color="#1f1410"
                  active={poiVisibility.carvings}
                  onToggle={() => togglePoi("carvings")}
                />
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
      {/* Live nav banner — replaces the floating chip during navigation */}
      {navigating && route && routeTo && (
        <>
          <div
            className="ios-glass-strong absolute z-10 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full pl-4 pr-1.5 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            style={{
              top: "calc(env(safe-area-inset-top, 0px) + 0.85rem)",
              width: "min(360px, calc(100vw - 1.5rem))",
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#cdac7d]">Heading to</div>
              <div className="text-[14px] font-semibold text-[#F0E2C2] mt-0.5 truncate">
                {routeTo.name}
              </div>
              <div className="text-[12px] text-[#F0E2C2]/65 mt-0.5">
                {distanceRemaining !== null
                  ? `${(distanceRemaining / 1609.344).toFixed(2)} mi · ${Math.max(1, Math.round(distanceRemaining / 1.25 / 60))} min walk`
                  : "Acquiring GPS…"}
              </div>
            </div>
            <button
              onClick={endNavigation}
              className="ios-press flex-shrink-0 rounded-full bg-[#F0E2C2] text-[#1A1310] px-3.5 py-2 text-[12px] font-bold leading-none"
            >
              End
            </button>
          </div>

          {/* Arrived toast — appears when distance drops under 25m */}
          {arrived && (
            <div
              className="ios-glass-strong absolute z-[20] left-1/2 -translate-x-1/2 animate-pop-up rounded-3xl px-6 py-5 text-center shadow-[0_18px_44px_rgba(0,0,0,0.55)]"
              style={{ top: "40%" }}
            >
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#7d8f5a] mb-1">Arrived</div>
              <div className="font-sketch text-2xl text-[#F0E2C2]">{routeTo.name}</div>
            </div>
          )}
        </>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <>
          <button
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
            className="fixed inset-0 z-[25] cursor-default bg-black/40 backdrop-blur-sm"
          />
          <div
            className="ios-glass-strong animate-pop-up absolute z-[26] rounded-3xl text-[#F0E2C2] shadow-[0_18px_44px_rgba(0,0,0,0.55)]"
            style={{
              top: "calc(env(safe-area-inset-top, 0px) + 1rem)",
              left: "0.75rem",
              right: "0.75rem",
              maxWidth: "440px",
              margin: "0 auto",
              padding: "12px 12px 14px 12px",
              transformOrigin: "top center",
            }}
            role="dialog"
            aria-label="Search"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-[#F0E2C2]/10 px-3 py-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F0E2C2]/70 flex-shrink-0">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cabins, firepits, trails, Lou…"
                className="flex-1 bg-transparent outline-none text-[15px] text-[#F0E2C2] placeholder-[#F0E2C2]/40"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="ios-press text-[12px] font-semibold text-[#cdac7d] px-2"
              >
                Cancel
              </button>
            </div>
            {searchResults.length > 0 && (
              <ul className="mt-2 space-y-1">
                {searchResults.map((r, i) => {
                  const data = r.data;
                  const isPoi = r.kind === "poi";
                  const style = isPoi
                    ? categoryStyle[(data as { category: string }).category] ??
                      categoryStyle.pavilion
                    : categoryStyle.cabin;
                  return (
                    <li key={i}>
                      <button
                        onClick={() => pickSearchResult(r)}
                        className="ios-press w-full rounded-2xl bg-[#F0E2C2]/8 hover:bg-[#F0E2C2]/14 transition-colors px-3 py-2.5 text-left flex items-center gap-3"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ background: style.color, boxShadow: `0 0 8px ${style.color}90` }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-semibold text-[#F0E2C2] leading-tight truncate">
                            {data.name}
                          </div>
                          <div className="text-[11px] text-[#F0E2C2]/55 mt-0.5 truncate uppercase tracking-[0.1em]">
                            {style.label}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {searchQuery.trim() && searchResults.length === 0 && (
              <div className="mt-3 px-3 text-[13px] text-[#F0E2C2]/55">
                Nothing matches that here.
              </div>
            )}
          </div>
        </>
      )}

      <DetailPanel
        item={selected}
        onClose={() => setSelected(null)}
        onGetDirections={() => setSourcePickerOpen(true)}
        route={route}
        routeFromName={routeFrom?.name ?? null}
        onReverseRoute={reverseRoute}
        onClearRoute={clearRoute}
        onStartNavigation={route ? startNavigation : undefined}
      />

      {/* Source picker sheet — appears when the user taps "Directions" */}
      {sourcePickerOpen && selected && (
        <>
          <button
            aria-label="Cancel directions"
            onClick={() => setSourcePickerOpen(false)}
            className="fixed inset-0 z-[25] cursor-default bg-black/40 backdrop-blur-sm"
          />
          <div
            className="ios-glass-strong animate-pop-up fixed left-1/2 -translate-x-1/2 z-[26] rounded-3xl text-[#F0E2C2] shadow-[0_18px_44px_rgba(0,0,0,0.55)] p-4"
            style={{
              bottom: "calc(env(safe-area-inset-bottom, 0px) + 20vh)",
              width: "min(360px, calc(100vw - 2rem))",
              transformOrigin: "center",
            }}
            role="dialog"
            aria-label="Pick directions starting point"
          >
            <h3 className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mb-2">Directions from</h3>
            <p className="text-[14px] text-[#F0E2C2]/90 mb-3">
              Where are you starting from?
            </p>
            <div className="space-y-1.5">
              <SourceOption
                label="My current location"
                sub="Uses GPS"
                onClick={() => {
                  navigator.geolocation.getCurrentPosition(
                    (pos) =>
                      computeRoute(
                        [pos.coords.longitude, pos.coords.latitude],
                        "My location",
                      ),
                    () =>
                      alert(
                        "Couldn\'t get your location. Pick a cabin instead.",
                      ),
                    { enableHighAccuracy: true, timeout: 10000 },
                  );
                }}
              />
              {publicCabins.map((c) => (
                <SourceOption
                  key={c.slug}
                  label={c.name}
                  sub={`${c.bedrooms} BR · ${c.bathrooms} BA`}
                  onClick={() => computeRoute([c.lng, c.lat], c.name)}
                />
              ))}
            </div>
            <button
              onClick={() => setSourcePickerOpen(false)}
              className="ios-press w-full mt-3 rounded-2xl bg-[#F0E2C2]/10 py-2.5 text-[14px] font-semibold text-[#F0E2C2]/85"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </main>
  );
}
