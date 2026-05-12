"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PropertyMap, { type SelectedItem, type Basemap } from "@/components/PropertyMap";
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-[#F0E2C2]/40 flex-shrink-0">
        <path d="m9 6 6 6-6 6" />
      </svg>
    </button>
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
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [basemap, setBasemap] = useState<Basemap>("topo");
  const [layersOpen, setLayersOpen] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus | null>(null);
  const [downloading, setDownloading] = useState<PrefetchProgress | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);

  // Build the trail-network graph once. Memoized so it doesn't rebuild on
  // every render.
  const graph = useMemo(() => getTrailGraph(), []);

  // Compute a route from a source (lng,lat) to the currently-selected
  // item, by snapping both to graph vertices and running Dijkstra.
  const computeRoute = (fromLngLat: LngLat) => {
    if (!selected) return;
    const toLngLat: LngLat =
      selected.kind === "cabin"
        ? [selected.data.lng, selected.data.lat]
        : [selected.data.lng, selected.data.lat];
    const from = snapToGraph(graph, fromLngLat);
    const to = snapToGraph(graph, toLngLat);
    const r = shortestPath(graph, from.node, to.node);
    setRoute(r);
    setSourcePickerOpen(false);
  };

  // Clear route when the selected item changes or panel closes.
  useEffect(() => {
    setRoute(null);
    setSourcePickerOpen(false);
  }, [selected]);

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

      <PropertyMap
        onSelect={setSelected}
        basemap={basemap}
        routeCoords={route?.coords ?? null}
      />

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

            {/* Offline pre-cache */}
            <div className="pt-3 mt-3 border-t border-[#B89968]/15">
              <h3 className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mb-2">Offline</h3>
              {downloading ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[12px] text-[#F0E2C2]/80 leading-none">
                    <span>Downloading tiles…</span>
                    <span>
                      {downloading.total === 0
                        ? "preparing"
                        : `${Math.round((downloading.done / downloading.total) * 100)}%`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F0E2C2]/15">
                    <div
                      className="h-full bg-[#F0E2C2] transition-all"
                      style={{
                        width:
                          downloading.total === 0
                            ? "8%"
                            : `${(downloading.done / downloading.total) * 100}%`,
                        transition: "width 120ms linear",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={startOfflineDownload}
                  className="ios-press w-full rounded-2xl bg-[#F0E2C2]/10 px-3.5 py-2.5 text-left transition-colors hover:bg-[#F0E2C2]/15"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#F0E2C2] leading-tight">
                        {offlineStatus ? "Refresh offline tiles" : "Save for offline"}
                      </div>
                      <div className="text-[11px] text-[#F0E2C2]/60 mt-0.5 truncate">
                        {offlineStatus
                          ? `Available offline · saved ${formatAgo(offlineStatus.cachedAt)}`
                          : "Use the map without cell signal at the property"}
                      </div>
                    </div>
                    {offlineStatus ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7d8f5a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F0E2C2]/70">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                  </div>
                </button>
              )}
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
      <DetailPanel
        item={selected}
        onClose={() => setSelected(null)}
        onGetDirections={() => setSourcePickerOpen(true)}
        route={route}
        onClearRoute={() => setRoute(null)}
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
                      computeRoute([pos.coords.longitude, pos.coords.latitude]),
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
                  onClick={() => computeRoute([c.lng, c.lat])}
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
