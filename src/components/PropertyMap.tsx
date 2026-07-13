"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import { supabase } from "@/lib/supabase";
import "maplibre-gl/dist/maplibre-gl.css";

import { property, worldRing } from "@/data/property";
import { publicCabins } from "@/data/cabins";
import { pois, categoryStyle } from "@/data/pois";
import type { Cabin, Poi, TrailMeta } from "@/data/types";
import parcelsData from "@/data/parcels.json";
import waterData from "@/data/water.json";
import trailsData from "@/data/trails.json";
import buildingsData from "@/data/buildings.json";
import horsePastureFence from "@/data/horse-pasture-fence.json";
import ownedBoundary from "@/data/owned-boundary.json";

export type SelectedItem =
  | { kind: "cabin"; data: Cabin }
  | { kind: "poi"; data: Poi }
  | { kind: "trail"; data: TrailMeta };

export type Basemap = "topo" | "satellite" | "apple";

export type PoiVisibility = {
  cabins: boolean;
  spots: boolean;
  carvings: boolean;
};

type Props = {
  onSelect: (item: SelectedItem | null) => void;
  basemap?: Basemap;
  routeCoords?: [number, number][] | null;
  poiVisibility?: PoiVisibility;
  // Live-navigation mode: when true, the map auto-pans, rotates to direction
  // of travel, and pitches. onUserPosition fires on every GPS update.
  navMode?: boolean;
  onUserPosition?: (pos: [number, number]) => void;
  // Initial bounds to fit to (e.g. from a /map?focus= URL param).
  focusBounds?: [[number, number], [number, number]] | null;
  // Toggle for trail layers only (line, halo, hit, labels). Pin
  // visibility is independently controlled by `poiVisibility`.
  trailsVisible?: boolean;
};

const TOPO_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    // OpenTopoMap — classic topographic look (contour + hillshade), z17 max
    topo: {
      type: "raster",
      tiles: [
        "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
        "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
        "https://c.tile.opentopomap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      maxzoom: 17,
      attribution:
        'Map data: © <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors, SRTM | © <a href="https://opentopomap.org">OpenTopoMap</a>',
    },
    // CartoDB Voyager — clean light style, doubles as topo deep-zoom fallback
    apple: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      maxzoom: 20,
      attribution: '© <a href="https://carto.com/attributions">CARTO</a>',
    },
    // Esri World Imagery — aerial satellite photography, z19 max
    satellite: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Imagery © <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
    },
  },
  // All four base layers are present from the start. Visibility is toggled
  // by the basemap prop (see useEffect below). The topo mode actually uses
  // two stacked layers: opentopomap up to z17.2, apple beyond.
  layers: [
    { id: "base-topo",        type: "raster", source: "topo",      maxzoom: 17.2, layout: { visibility: "visible" } },
    { id: "base-topo-deep",   type: "raster", source: "apple",     minzoom: 17.2, layout: { visibility: "visible" } },
    { id: "base-apple",       type: "raster", source: "apple",                    layout: { visibility: "none" } },
    { id: "base-satellite",   type: "raster", source: "satellite",                layout: { visibility: "none" } },
  ],
};

const ICON_PATHS: Record<string, string> = {
  // Each icon is a complete SVG fragment so we can mix strokes and fills.
  // Designed at 24x24 viewBox, rendered at 20x20 with the wobble filter.
  cabin: `<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 4.5v3"/>
    <path d="M3 12 12 4l9 8"/>
    <path d="M5 12v9h14v-9"/>
    <path d="M10 21v-5h4v5"/>
    <rect x="6.5" y="13" width="2.2" height="2.2" fill="#F0E2C2" stroke="none"/>
    <rect x="15.3" y="13" width="2.2" height="2.2" fill="#F0E2C2" stroke="none"/>
  </g>`,
  pavilion: `<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 11 12 3l9 8"/>
    <path d="M6 11v10"/>
    <path d="M18 11v10"/>
    <path d="M4 21h16"/>
    <path d="M9 11v10M15 11v10" opacity="0.5"/>
  </g>`,
  firepit: `<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3c-1.5 3-4 4-4 8 a4 4 0 0 0 8 0c0-4-2.5-5-4-8z"/>
    <path d="M12 12.5c-1 1-1.5 2-1 3 0.7 0.6 1.7 0.4 2-0.5 0.3-0.8-0.3-1.5-1-2.5z" fill="#F0E2C2"/>
    <path d="M5 21l3-1M19 21l-3-1"/>
  </g>`,
  "lake-feature": `<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 4v11"/>
    <path d="M12 6l5 9H12z" fill="#F0E2C2"/>
    <path d="M4 16c3 2.5 13 2.5 16 0"/>
    <path d="M3 20c1.5 0.7 3.5 0.7 5 0s3.5-0.7 5 0 3.5 0.7 5 0"/>
  </g>`,
  barn: `<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 21V11l9-7 9 7v10z"/>
    <path d="M9 21v-5.5h6V21"/>
    <path d="M9 15.5l6 5.5M15 15.5l-6 5.5"/>
  </g>`,
  treehouse: `<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="8.5" r="5.5"/>
    <rect x="9" y="6.5" width="6" height="5" rx="0.5" fill="#F0E2C2" stroke="none"/>
    <path d="M9.5 6.5 12 4l2.5 2.5" stroke="#2A1F18" stroke-width="1.4"/>
    <path d="M11 11.5v-2.5h2v2.5" stroke="#2A1F18" stroke-width="1.4" fill="none"/>
    <path d="M10.5 14v7M13.5 14v7"/>
    <path d="M10.5 16h3M10.5 19h3"/>
  </g>`,
  shack: `<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 21v-9l8-5 8 5v9z"/>
    <circle cx="12" cy="15" r="3.5"/>
    <circle cx="12" cy="15" r="1.5" fill="#F0E2C2" stroke="none"/>
  </g>`,
  // Standing chainsaw-carved bear — filled cream silhouette with dark
  // accents for eyes and snout, since at small sizes a stroke-only bear
  // dissolves into noise.
  bear: `<g stroke="#F0E2C2" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round">
    <circle cx="8.5" cy="4.2" r="1.6" fill="#F0E2C2"/>
    <circle cx="15.5" cy="4.2" r="1.6" fill="#F0E2C2"/>
    <circle cx="12" cy="6.5" r="3.6" fill="#F0E2C2"/>
    <ellipse cx="12" cy="14.5" rx="5" ry="6" fill="#F0E2C2"/>
    <circle cx="10.4" cy="6.1" r="0.55" fill="#1f1410" stroke="none"/>
    <circle cx="13.6" cy="6.1" r="0.55" fill="#1f1410" stroke="none"/>
    <ellipse cx="12" cy="8" rx="1.2" ry="0.7" fill="#1f1410" stroke="none"/>
    <ellipse cx="9" cy="20.5" rx="1.3" ry="1" fill="#F0E2C2"/>
    <ellipse cx="15" cy="20.5" rx="1.3" ry="1" fill="#F0E2C2"/>
  </g>`,
  // Sitting bobcat — tufted pointed ears, slim head, alert upright body,
  // dark eyes + nose, a couple of spot accents. Smaller / leaner than the
  // bear silhouette so the two read as different animals at a glance.
  bobcat: `<g stroke="#F0E2C2" stroke-width="1" stroke-linejoin="round" stroke-linecap="round" fill="none">
    <!-- Body (compact crouched cat) -->
    <path d="M7 14 Q6 16 6 18 Q6 20.5 7.5 21 L16.5 21 Q18 20.5 18 18 Q18 16 17 14 L16 12 L8 12 Z" fill="#F0E2C2"/>
    <!-- Bobbed tail (the namesake stub) -->
    <path d="M17 15.5 Q19.5 15 19.2 17.5 Q18.5 18.5 17 18" fill="#F0E2C2"/>
    <!-- Tufted ears (defining feature) -->
    <path d="M6.5 5 L8 1 L11 5 Z" fill="#F0E2C2"/>
    <line x1="7.8" y1="1.3" x2="7.4" y2="0" stroke-width="0.6"/>
    <line x1="8.4" y1="1.5" x2="8.6" y2="0.2" stroke-width="0.6"/>
    <path d="M17.5 5 L16 1 L13 5 Z" fill="#F0E2C2"/>
    <line x1="16.2" y1="1.3" x2="16.6" y2="0" stroke-width="0.6"/>
    <line x1="15.6" y1="1.5" x2="15.4" y2="0.2" stroke-width="0.6"/>
    <!-- Head with integrated cheek-ruff flares -->
    <path d="M7.5 7 Q6.8 9.5 7.5 11 L6.2 11.5 L8 12 Q9 12.8 12 12.8 Q15 12.8 16 12 L17.8 11.5 L16.5 11 Q17.2 9.5 16.5 7 Q15.5 5 13.8 4.5 Q12 4 10.2 4.5 Q8.5 5 7.5 7 Z" fill="#F0E2C2"/>
    <!-- Front paws -->
    <ellipse cx="9.5" cy="21.3" rx="1.1" ry="0.5" fill="#F0E2C2"/>
    <ellipse cx="14.5" cy="21.3" rx="1.1" ry="0.5" fill="#F0E2C2"/>
    <!-- Cat-like almond eyes -->
    <ellipse cx="10" cy="8.2" rx="0.6" ry="0.85" fill="#1f1410" stroke="none"/>
    <ellipse cx="14" cy="8.2" rx="0.6" ry="0.85" fill="#1f1410" stroke="none"/>
    <!-- Nose -->
    <path d="M11.4 9.9 L12.6 9.9 L12 10.7 Z" fill="#1f1410" stroke="none"/>
    <!-- Mouth philtrum line -->
    <path d="M12 10.7 L12 11.4" stroke="#1f1410" stroke-width="0.5" fill="none"/>
    <!-- Whiskers -->
    <line x1="8.6" y1="10.4" x2="5.8" y2="10" stroke-width="0.4"/>
    <line x1="8.6" y1="11" x2="5.8" y2="11.3" stroke-width="0.4"/>
    <line x1="15.4" y1="10.4" x2="18.2" y2="10" stroke-width="0.4"/>
    <line x1="15.4" y1="11" x2="18.2" y2="11.3" stroke-width="0.4"/>
    <!-- Body spots -->
    <circle cx="9.5" cy="15.5" r="0.45" fill="#3a2d22" stroke="none"/>
    <circle cx="12" cy="16.5" r="0.45" fill="#3a2d22" stroke="none"/>
    <circle cx="14.5" cy="15.5" r="0.45" fill="#3a2d22" stroke="none"/>
    <circle cx="10.5" cy="18.5" r="0.35" fill="#3a2d22" stroke="none"/>
    <circle cx="13.5" cy="18.5" r="0.35" fill="#3a2d22" stroke="none"/>
  </g>`,
  // Gate / entrance icon — clearly indicates "enter here".
  entrance: `<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="11" width="4" height="10" />
    <rect x="16" y="11" width="4" height="10" />
    <path d="M4 11l8-7 8 7" />
    <path d="M10 21v-5h4v5" />
  </g>`,
  // Warning triangle with a clean exclamation — for the wrong-way marker.
  warn: `<g fill="none" stroke="#F0E2C2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3l10 18H2z" fill="#B23A1F" stroke-width="1.8"/>
    <line x1="12" y1="9" x2="12" y2="13.5" stroke-width="2.4"/>
    <circle cx="12" cy="17" r="1.1" fill="#F0E2C2" stroke="none"/>
  </g>`,
  trailhead: `<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 7l-3 3 3 3M15 7l3 3-3 3"/>
    <path d="M6 10h12"/>
    <path d="M9 17l3 3 3-3"/>
  </g>`,
  parking: `<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 18V6h5a3.5 3.5 0 0 1 0 7H8"/>
  </g>`,
  "scenic-viewpoint": `<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3.5"/>
    <circle cx="12" cy="12" r="1.2" fill="#F0E2C2" stroke="none"/>
    <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6 6l1.4 1.4M16.6 7.4 18 6M6 18l1.4-1.4M16.6 16.6 18 18"/>
  </g>`,
  waterfall: `<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 3v6M11 3v3M15 3v6M19 3v3"/>
    <path d="M3 13c1.5 0.8 3.5 0.8 5 0s3.5-0.8 5 0 3.5 0.8 5 0 3.5-0.8 4-0.3"/>
    <path d="M3 19c1.5 0.8 3.5 0.8 5 0s3.5-0.8 5 0 3.5 0.8 5 0 3.5-0.8 4-0.3"/>
  </g>`,
};

// Deterministic small tilt per pin seed so the cluster of pins feels
// hand-placed rather than perfectly cardinal. Same input → same tilt
// every render.
function tiltFromSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  // map to range [-5, 5] degrees
  return ((Math.abs(h) % 1000) / 1000) * 10 - 5;
}


function buildPinElement(color: string, category: string, seed: string = category): HTMLDivElement {
  // OUTER WRAP — MapLibre owns this element's transform (uses it for
  // translate(...) positioning). Do NOT touch wrap.style.transform anywhere.
  const wrap = document.createElement("div");
  wrap.style.cssText = `width: 36px; height: 36px; cursor: pointer;`;

  // TILT WRAPPER — gives the pin a small hand-placed rotation. Sits between
  // the MapLibre-owned wrap and the visual inner so MapLibre's transform
  // stays untouched.
  const tilt = document.createElement("div");
  const tiltDeg = tiltFromSeed(seed);
  tilt.dataset.tilt = String(tiltDeg);
  tilt.style.cssText = `width: 36px; height: 36px; transform: rotate(${tiltDeg}deg) scale(1); transform-origin: 50% 50%;`;

  // INNER VISUAL — this is the only thing we animate on hover/touch.
  const inner = document.createElement("div");
  inner.style.cssText = `
    width: 36px; height: 36px;
    border-radius: 50%;
    background: ${color};
    border: 2.5px solid #F0E2C2;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(42,31,24,0.25);
    display: grid; place-items: center;
    transition: transform 0.18s cubic-bezier(0.2,0.8,0.2,1.05), filter 0.18s ease-out;
    will-change: transform;
  `;
  inner.addEventListener("mouseenter", () => (inner.style.transform = "scale(1.12)"));
  inner.addEventListener("mouseleave", () => (inner.style.transform = ""));
  inner.addEventListener("touchstart", () => (inner.style.transform = "scale(0.92)"), { passive: true });
  inner.addEventListener("touchend", () => (inner.style.transform = ""), { passive: true });
  inner.addEventListener("touchcancel", () => (inner.style.transform = ""), { passive: true });

  const path = ICON_PATHS[category] ?? '<g fill="none" stroke="#F0E2C2" stroke-width="2"><circle cx="12" cy="12" r="3"/></g>';
  inner.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" style="display:block; filter: url(#pin-rough);">${path}</svg>`;

  tilt.appendChild(inner);
  wrap.appendChild(tilt);
  return wrap;
}

function buildUserDot(): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.style.cssText = `position: relative; width: 18px; height: 18px;`;
  wrap.innerHTML = `
    <div style="position: absolute; inset: 0; width: 18px; height: 18px; border-radius: 50%; background: #2E78D2; border: 3px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.4); z-index: 2;"></div>
    <div style="position: absolute; left: -16px; top: -16px; width: 50px; height: 50px; border-radius: 50%; background: rgba(46, 120, 210, 0.18); animation: pulse-dot 2.4s ease-out infinite;"></div>
  `;
  return wrap;
}

export default function PropertyMap({
  onSelect,
  basemap = "topo",
  routeCoords = null,
  poiVisibility = { cabins: true, spots: true, carvings: true },
  navMode = false,
  onUserPosition,
  focusBounds = null,
  trailsVisible = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  // All POI/cabin marker elements, kept so we can toggle visibility on
  // poiVisibility prop changes without rebuilding the map.
  const poiMarkersRef = useRef<{ kind: "cabins" | "spots" | "carvings"; el: HTMLElement; poiSlug?: string }[]>([]);
  const [tracking, setTracking] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  // Compass: write the rotation transform directly to the SVG via a ref so
  // we bypass React's render cycle on every rotate frame. This is what makes
  // the dial silky instead of jittery — no setState during the gesture.
  const compassRef = useRef<SVGSVGElement | null>(null);
  const bearingRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: TOPO_STYLE,
      center: [property.center.lng, property.center.lat],
      zoom: 14.5,
      maxBounds: [
        [property.bounds.west - 0.02, property.bounds.south - 0.02],
        [property.bounds.east + 0.02, property.bounds.north + 0.02],
      ],
    });
    mapRef.current = map;
    // Removed NavigationControl (+/- buttons) — pinch-zoom and mouse wheel
    // are enough. Compass rose top-left handles north reset.
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 110, unit: "imperial" }), "bottom-left");

    const handleRotate = () => {
      const b = map.getBearing();
      bearingRef.current = b;
      if (compassRef.current) {
        compassRef.current.style.transform = `rotate(${-b}deg)`;
      }
    };
    map.on("rotate", handleRotate);
    map.on("rotateend", handleRotate);
    map.on("error", (e) => console.error("[MapLibre]", e?.error?.message || e));

    map.on("load", () => {
      map.resize();

      type ParcelFeature = { geometry: { coordinates: number[][][] }, properties: { tier?: string } };
      const allRings: number[][][] = (parcelsData.features as unknown as ParcelFeature[])
        .flatMap((f) => f.geometry.coordinates);
      const ownedRings: number[][][] = (parcelsData.features as unknown as ParcelFeature[])
        .filter((f) => f.properties?.tier === "owned")
        .flatMap((f) => f.geometry.coordinates);

      // VERY subtle dim outside all property — just enough to draw the eye, not block context
      map.addSource("off-property", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [worldRing as number[][], ...allRings],
            },
          }],
        },
      });
      map.addLayer({
        id: "off-property-fill",
        type: "fill",
        source: "off-property",
        paint: { "fill-color": "#1A1310", "fill-opacity": 0.22 },
      });

      // OWNED parcels — just a subtle cream fill, NO borders. The boundary reads
      // through the absence of dim outside it.
      map.addSource("owned-parcels", { type: "geojson", data: parcelsData as never });
      map.addLayer({
        id: "owned-fill",
        type: "fill",
        source: "owned-parcels",
        filter: ["==", ["get", "tier"], "owned"],
        paint: { "fill-color": "#F0E2C2", "fill-opacity": 0.16 },
      });

      // Single soft halo around the OUTER union of owned parcels (no internal seams)
      map.addSource("owned-boundary", { type: "geojson", data: ownedBoundary as never });
      // Property boundary — a chunky gold line over a darker brown shadow so
      // it reads like a "fenceline" rather than a path. Deliberately distinct
      // from walking trails (dashed cream) and gravel roads (solid tan).
      // Soft dark halo underneath for depth + readability over any basemap
      map.addLayer({
        id: "owned-line-shadow",
        type: "line",
        source: "owned-boundary",
        paint: {
          "line-color": "#1A0F08",
          "line-width": 12,
          "line-opacity": 0.9,
          "line-blur": 3,
        },
        layout: { "line-join": "round", "line-cap": "round" },
      });
      // Main fenceline: saturated bright gold, solid (no dashes).
      map.addLayer({
        id: "owned-line",
        type: "line",
        source: "owned-boundary",
        paint: {
          "line-color": "#B83A8C",
          "line-width": 6,
          "line-opacity": 1,
        },
        layout: { "line-join": "round", "line-cap": "round" },
      });

      // Bodies of water
      map.addSource("water", { type: "geojson", data: waterData as never });
      map.addLayer({
        id: "water-fill",
        type: "fill",
        source: "water",
        paint: { "fill-color": "#3a82c2", "fill-opacity": 0.62 },
      });
      map.addLayer({
        id: "water-outline",
        type: "line",
        source: "water",
        paint: { "line-color": "#1d5688", "line-width": 1.2, "line-opacity": 0.9 },
      });

      // Trails / roads — painted-trail-map styling: chunky lines with a
      // warm ink halo, surface-differentiated by color AND dash so the
      // road / 4wd / walking-trail hierarchy reads at a glance.
      map.addSource("trails", { type: "geojson", data: trailsData as never });
      map.addLayer({
        id: "trails-halo",
        type: "line",
        source: "trails",
        paint: {
          "line-color": "#2A1F18",
          "line-width": 8,
          "line-opacity": 0.55,
          "line-blur": 1.6,
        },
        layout: { "line-join": "round", "line-cap": "round" },
      });
      map.addLayer({
        id: "trails-line",
        type: "line",
        source: "trails",
        paint: {
          "line-color": [
            "match",
            ["get", "surface"],
            "paved",  "#3D3022",
            "gravel", "#C9A974",
            "4wd",    "#D9531E",
            "trail",  "#F0E2C2",
            /* default */ "#C9A974",
          ],
          "line-width": [
            "match",
            ["get", "surface"],
            "gravel", 5,
            "4wd",    5,
            "trail",  4,
            5,
          ],
          "line-opacity": 0.98,
          "line-dasharray": [
            "case",
            ["==", ["get", "approximate"], true], ["literal", [2, 1.5]],
            ["==", ["get", "surface"], "trail"],  ["literal", [1, 2.5]],
            ["==", ["get", "surface"], "4wd"],    ["literal", [1.6, 1.2]],
            ["literal", [1, 0]],
          ] as never,
        },
        layout: { "line-join": "round", "line-cap": "round" },
      });
      // Wide invisible "hit" layer above the visible trail line so taps within
      // a generous radius register. Without this the click target is the
      // 4–5px rendered stroke, which is fiddly on touch.
      map.addLayer({
        id: "trails-hit",
        type: "line",
        source: "trails",
        paint: { "line-color": "#000", "line-opacity": 0, "line-width": 22 },
        layout: { "line-join": "round", "line-cap": "round" },
      });
      // Trail labels — symbol-spacing isn\u2019t data-expression-eligible in
      // MapLibre, so Lefarth Road (which wants tighter repeats) gets its own
      // layer. Every other trail uses the default spacing.
      map.addLayer({
        id: "trails-labels",
        type: "symbol",
        source: "trails",
        filter: ["!=", ["get", "name"], "Lefarth Road"],
        layout: {
          "symbol-placement": "line",
          "text-field": ["get", "name"],
          "text-size": 16,
          "text-letter-spacing": 0.04,
          "text-anchor": "center",
          "text-offset": [0, -0.8],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color": "#2A1F18",
          "text-halo-color": "#F5E8C9",
          "text-halo-width": 3.2,
          "text-halo-blur": 0.3,
        },
      });
      map.addLayer({
        id: "trails-labels-lefarth",
        type: "symbol",
        source: "trails",
        filter: ["==", ["get", "name"], "Lefarth Road"],
        layout: {
          "symbol-placement": "line",
          "text-field": ["get", "name"],
          "text-size": 16,
          "text-letter-spacing": 0.04,
          "text-anchor": "center",
          "text-offset": [0, -0.8],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "symbol-spacing": 90,
        },
        paint: {
          "text-color": "#2A1F18",
          "text-halo-color": "#F5E8C9",
          "text-halo-width": 3.2,
          "text-halo-blur": 0.3,
        },
      });

      // Area labels go via HTML Markers (see further down) so we can use the
      // Caveat handwritten font. MapLibre's built-in glyph fonts can't render
      // arbitrary web fonts without a hosted glyphs server.

      // Buildings — split by kind so cabins read differently
      map.addSource("buildings", { type: "geojson", data: buildingsData as never });
      map.addLayer({
        id: "cabins-fill",
        type: "fill",
        source: "buildings",
        filter: ["==", ["get", "kind"], "cabin"],
        paint: { "fill-color": "#8a5a3b", "fill-opacity": 0.92 },
      });
      map.addLayer({
        id: "cabins-outline",
        type: "line",
        source: "buildings",
        filter: ["==", ["get", "kind"], "cabin"],
        paint: { "line-color": "#1A1310", "line-width": 1.5 },
      });
      map.addLayer({
        id: "buildings-fill",
        type: "fill",
        source: "buildings",
        filter: ["!=", ["get", "kind"], "cabin"],
        paint: { "fill-color": "#F0E2C2", "fill-opacity": 0.85 },
      });
      map.addLayer({
        id: "buildings-outline",
        type: "line",
        source: "buildings",
        filter: ["!=", ["get", "kind"], "cabin"],
        paint: { "line-color": "#2A1F18", "line-width": 1.5 },
      });

      // Permission parcel (horse pasture access) — soft tan fill. The dashed
      // cream boundary around it now comes from owned-boundary.json, which we
      // regenerated as the geometric union of every guest-accessible parcel
      // (owned + permission). One source = no stray interior seams.
      map.addSource("parcels-source", { type: "geojson", data: parcelsData as never });
      map.addLayer({
        id: "permission-fill",
        type: "fill",
        source: "parcels-source",
        filter: ["==", ["get", "tier"], "permission"],
        paint: { "fill-color": "#B89968", "fill-opacity": 0.10 },
      });

      // Inner FENCED horse pasture — punchier sage-tan fill so it stands out
      // inside the larger permission parcel, NO border
      map.addSource("horse-pasture", { type: "geojson", data: horsePastureFence as never });
      map.addLayer({
        id: "horse-pasture-fill",
        type: "fill",
        source: "horse-pasture",
        paint: { "fill-color": "#7d8f5a", "fill-opacity": 0.45 },
      });
      // "Horse Pasture" uppercase label — only appears when zoomed in (>= 15.5).
      // At default zoom the handwritten Caveat HTML marker handles this, and
      // having both visible at once felt redundant.
      map.addLayer({
        id: "horse-pasture-label",
        type: "symbol",
        source: "horse-pasture",
        minzoom: 15.5,
        layout: {
          "text-field": "Horse Pasture",
          "text-size": 13,
          "text-letter-spacing": 0.08,
          "text-transform": "uppercase",
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color": "#1A1310",
          "text-halo-color": "#F0E2C2",
          "text-halo-width": 2,
        },
      });

      // Trails are tap-targets: clicking the line opens the detail panel
      // with the trail's info (no pin needed). Cursor changes on hover.
      type TrailFeatureProps = { name?: string; surface?: string; description?: string; difficulty?: string; cj_note?: string };
      const slugify = (n: string) =>
        n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const haversineM = (a: [number, number], b: [number, number]) => {
        const R = 6371000;
        const f1 = (a[1] * Math.PI) / 180;
        const f2 = (b[1] * Math.PI) / 180;
        const df = ((b[1] - a[1]) * Math.PI) / 180;
        const dl = ((b[0] - a[0]) * Math.PI) / 180;
        const h =
          Math.sin(df / 2) ** 2 +
          Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(h));
      };
      map.on("click", "trails-hit", (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const props = feat.properties as TrailFeatureProps;
        const name = props.name ?? "Trail";
        const surface = (props.surface ?? "trail") as TrailMeta["surface"];
        // Re-look up the trail's full coordinate list from our source data
        // (the click feature might be a clipped tile fragment).
        const fullCoords = (trailsData as unknown as {
          features: { properties: { name?: string }; geometry: { coordinates: number[][] } }[];
        }).features.find((f) => f.properties.name === name)?.geometry.coordinates ?? [];
        let lengthM = 0;
        for (let i = 1; i < fullCoords.length; i++) {
          lengthM += haversineM(
            fullCoords[i - 1] as [number, number],
            fullCoords[i] as [number, number],
          );
        }
        onSelect({
          kind: "trail",
          data: {
            slug: slugify(name),
            name,
            surface,
            difficulty: props.difficulty as "easy" | "moderate" | "hard" | undefined,
            description: props.description,
            cj_note: props.cj_note,
            coords: fullCoords,
            lengthM,
          },
        });
      });
      map.on("mouseenter", "trails-hit", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "trails-hit", () => {
        map.getCanvas().style.cursor = "";
      });

      // Auto-fit to all parcels
      const lngs: number[] = [], lats: number[] = [];
      allRings.forEach((ring) => ring.forEach((p) => { lngs.push(p[0]); lats.push(p[1]); }));
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 50, duration: 0 },
      );
    });

    // Markers on top
    publicCabins.forEach((c) => {
      const el = buildPinElement(categoryStyle.cabin.color, "cabin", c.slug);
      el.title = c.name;
      el.dataset.pinKind = "cabins";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        onSelect({ kind: "cabin", data: c });
        // Subtle pan to keep the clicked pin visible above the bottom sheet.
        // padding.bottom ~ 60% of viewport reserves space for the panel.
        map.easeTo({
          center: [c.lng, c.lat],
          duration: 250,
          essential: true,
          padding: { top: 80, bottom: Math.round(window.innerHeight * 0.42), left: 20, right: 20 },
        });
      });
      new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([c.lng, c.lat]).addTo(map);
      poiMarkersRef.current.push({ kind: "cabins", el });
    });
    pois.forEach((p) => {
      const style = categoryStyle[p.category] ?? categoryStyle.pavilion;
      const el = buildPinElement(style.color, p.category, p.slug);
      el.title = p.name;
      const kind: "carvings" | "spots" =
        p.category === "bear" || p.category === "bobcat" ? "carvings" : "spots";
      el.dataset.pinKind = kind;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        onSelect({ kind: "poi", data: p });
        map.easeTo({
          center: [p.lng, p.lat],
          duration: 250,
          essential: true,
          padding: { top: 80, bottom: Math.round(window.innerHeight * 0.42), left: 20, right: 20 },
        });
      });
      new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([p.lng, p.lat]).addTo(map);
      poiMarkersRef.current.push({ kind, el, poiSlug: p.slug });
    });

    // Area labels go LAST so they paint on top of the icons. The chunky cream
    // halo "punches through" any pin underneath so the hand-drawn label and
    // the icon feel composed together instead of one covering the other.
    // Positions chosen near each cluster, in the clearer space adjacent to
    // the pins, not directly on top of them.
    const AREA_LABELS: { lng: number; lat: number; label: string; size?: number; rotate?: number }[] = [
      { lng: -90.4567,  lat: 38.4124,  label: "Cabin Ridge",   size: 35, rotate: -4 },
      { lng: -90.45741, lat: 38.40679, label: "Main Lake",     size: 35, rotate: 2 },
      { lng: -90.46040, lat: 38.39880, label: "The 13",        size: 35, rotate: -3 },
      { lng: -90.45029, lat: 38.40857, label: "Horse Pasture", size: 35, rotate: -2 },
    ];
    // Area labels scale + fade with zoom so they don\u2019t dominate at wide
    // zooms (where you can\u2019t see what they\u2019re actually labelling).
    const areaLabelEls: { el: HTMLDivElement; baseSize: number; rotate: number }[] = [];
    AREA_LABELS.forEach((a) => {
      const baseSize = a.size ?? 30;
      const rotate = a.rotate ?? 0;
      const el = document.createElement("div");
      el.style.cssText = `
        font-family: var(--font-caveat), "Caveat", "Cabin Sketch", cursive;
        font-weight: 700;
        color: #1A1310;
        text-shadow:
          0 0 12px #F5E8C9,
          0 0 12px #F5E8C9,
          0 0 10px #F5E8C9,
          0 0 8px #F5E8C9,
          0 0 4px #F5E8C9,
          1.5px 1.5px 0 rgba(245, 232, 201, 1),
          -1px -1px 0 rgba(245, 232, 201, 1);
        white-space: nowrap;
        pointer-events: none;
        user-select: none;
        transform: rotate(${rotate}deg);
        letter-spacing: 0.04em;
        will-change: font-size, opacity;
      `;
      el.textContent = a.label;
      areaLabelEls.push({ el, baseSize, rotate });
      new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([a.lng, a.lat]).addTo(map);
    });

    // Zoom-responsive sizing: invisible <= 12, scales up linearly to full
    // size by z=15.5. Keeps the property zoom-out view from being dominated
    // by big handwritten area labels.
    const updateAreaLabelStyles = () => {
      const z = map.getZoom();
      const t = Math.max(0, Math.min(1, (z - 12) / 3.5)); // 0 at z=12, 1 at z=15.5
      const minFactor = 0.4;
      const factor = minFactor + (1 - minFactor) * t;
      const opacity = t < 0.05 ? 0 : (0.4 + 0.6 * t);
      areaLabelEls.forEach(({ el, baseSize }) => {
        el.style.fontSize = `${(baseSize * factor).toFixed(1)}px`;
        el.style.opacity = String(opacity);
      });
    };
    updateAreaLabelStyles();
    map.on("zoom", updateAreaLabelStyles);

    // Zoom-responsive pin scaling: smaller / dimmer at low zooms so the
    // map doesn\u2019t feel cluttered when you can\u2019t make out what each pin is.
    const updatePinScales = () => {
      const z = map.getZoom();
      const t = Math.max(0, Math.min(1, (z - 13) / 3)); // 0 at z<=13, 1 at z>=16
      const minScale = 0.55;
      const scale = minScale + (1 - minScale) * t;
      const opacity = 0.55 + 0.45 * t; // never below 55% so they stay legible
      poiMarkersRef.current.forEach(({ el }) => {
        const tilt = el.firstElementChild as HTMLElement | null;
        if (!tilt) return;
        const tiltDeg = parseFloat(tilt.dataset.tilt ?? "0");
        tilt.style.transform = `rotate(${tiltDeg}deg) scale(${scale})`;
        el.style.opacity = String(opacity);
      });
    };
    updatePinScales();
    map.on("zoom", updatePinScales);



    
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      poiMarkersRef.current = [];
    };
  }, [onSelect]);

  // Render the routing result (when present) as a highlighted polyline with
  // animated dashes flowing from start to end + green/blue endpoint dots.
  // The animation is driven by a requestAnimationFrame loop that cycles
  // the line-dasharray on route-line every ~70ms.
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    const apply = () => {
      // Build the GeoJSON: a LineString plus two Points for the endpoints,
      // tagged with a "kind" property so each gets its own layer style.
      const features: GeoJSON.Feature[] = [];
      if (routeCoords && routeCoords.length > 1) {
        features.push({
          type: "Feature",
          properties: { kind: "line" },
          geometry: { type: "LineString", coordinates: routeCoords },
        });
        features.push({
          type: "Feature",
          properties: { kind: "start" },
          geometry: { type: "Point", coordinates: routeCoords[0] },
        });
        features.push({
          type: "Feature",
          properties: { kind: "end" },
          geometry: { type: "Point", coordinates: routeCoords[routeCoords.length - 1] },
        });
      }
      const data: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };

      const src = m.getSource("route") as maplibregl.GeoJSONSource | undefined;
      if (!src) {
        m.addSource("route", { type: "geojson", data });
        m.addLayer({
          id: "route-halo",
          type: "line",
          source: "route",
          filter: ["==", ["get", "kind"], "line"],
          paint: {
            "line-color": "#2E78D2",
            "line-width": 10,
            "line-opacity": 0.35,
            "line-blur": 3,
          },
          layout: { "line-join": "round", "line-cap": "round" },
        });
        m.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          filter: ["==", ["get", "kind"], "line"],
          paint: {
            "line-color": "#67B0FF",
            "line-width": 6,
            "line-opacity": 0.98,
          },
          layout: { "line-join": "round", "line-cap": "round" },
        });
        m.addLayer({
          id: "route-endpoint-start-halo",
          type: "circle",
          source: "route",
          filter: ["==", ["get", "kind"], "start"],
          paint: {
            "circle-radius": 11,
            "circle-color": "#7d8f5a",
            "circle-opacity": 0.3,
            "circle-blur": 0.4,
          },
        });
        m.addLayer({
          id: "route-endpoint-start",
          type: "circle",
          source: "route",
          filter: ["==", ["get", "kind"], "start"],
          paint: {
            "circle-radius": 6,
            "circle-color": "#7d8f5a",
            "circle-stroke-color": "#F0E2C2",
            "circle-stroke-width": 2,
          },
        });
        m.addLayer({
          id: "route-endpoint-end-halo",
          type: "circle",
          source: "route",
          filter: ["==", ["get", "kind"], "end"],
          paint: {
            "circle-radius": 12,
            "circle-color": "#2E78D2",
            "circle-opacity": 0.35,
            "circle-blur": 0.4,
          },
        });
        m.addLayer({
          id: "route-endpoint-end",
          type: "circle",
          source: "route",
          filter: ["==", ["get", "kind"], "end"],
          paint: {
            "circle-radius": 7,
            "circle-color": "#2E78D2",
            "circle-stroke-color": "#F0E2C2",
            "circle-stroke-width": 2.5,
          },
        });
      } else {
        src.setData(data);
      }
    };
    if (m.isStyleLoaded()) apply();
    else m.once("idle", apply);
  }, [routeCoords]);

  // Animate the route's line-dasharray so dashes appear to flow from the
  // first vertex toward the last. When routeCoords reverses, MapLibre
  // re-walks the same shifting pattern starting from the new first vertex,
  // which means the dashes visibly reverse direction.
  //
  // Uses MapLibre's canonical 12-frame smooth-shift sequence (no
  // discontinuity), running at ~80ms/frame so the flow is easy to follow
  // and unambiguous about direction.
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !routeCoords || routeCoords.length < 2) return;
    let raf = 0;
    let step = 0;
    const cycle: number[][] = [
      [0, 4, 3],
      [0.5, 4, 2.5],
      [1, 4, 2],
      [1.5, 4, 1.5],
      [2, 4, 1],
      [2.5, 4, 0.5],
      [3, 4, 0],
      [0, 0.5, 3, 2.5],
      [0, 1, 3, 2],
      [0, 1.5, 3, 1.5],
      [0, 2, 3, 1],
      [0, 2.5, 3, 0.5],
    ];
    let last = 0;
    const tick = (t: number) => {
      if (t - last > 80) {
        last = t;
        if (m.getLayer("route-line")) {
          m.setPaintProperty(
            "route-line",
            "line-dasharray",
            cycle[step % cycle.length] as never,
          );
        }
        step++;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [routeCoords]);

  // Fit the map to the route bounds when a new route arrives.
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !routeCoords || routeCoords.length < 2) return;
    const lngs = routeCoords.map((c) => c[0]);
    const lats = routeCoords.map((c) => c[1]);
    m.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      {
        padding: { top: 120, bottom: Math.round(window.innerHeight * 0.5), left: 60, right: 60 },
        duration: 700,
        essential: true,
      },
    );
  }, [routeCoords]);

  // Fit map to focus bounds when the prop arrives (e.g. from a URL param
  // like /map?focus=trail-<slug>). Runs once per non-null bounds.
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !focusBounds) return;
    const apply = () => {
      m.fitBounds(focusBounds, {
        padding: { top: 100, bottom: 200, left: 60, right: 60 },
        duration: 800,
        essential: true,
      });
    };
    if (m.isStyleLoaded()) apply();
    else m.once("idle", apply);
  }, [focusBounds]);

  // Toggle pin visibility based on the poiVisibility prop only. Walks the
  // poiMarkersRef and sets each element's display directly.
  useEffect(() => {
    poiMarkersRef.current.forEach(({ kind, el }) => {
      el.style.display = poiVisibility[kind] ? "" : "none";
    });
  }, [poiVisibility]);

  // Trails toggle: hide/show all trail-related layers (line, halo, hit
  // target, labels for both regular trails and Lefarth\u2019s denser-label layer).
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    const apply = () => {
      const v = trailsVisible ? "visible" : "none";
      for (const id of ["trails-halo", "trails-line", "trails-hit", "trails-labels", "trails-labels-lefarth"]) {
        if (m.getLayer(id)) m.setLayoutProperty(id, "visibility", v);
      }
    };
    if (m.isStyleLoaded()) apply();
    else m.once("idle", apply);
  }, [trailsVisible]);

  // Apply basemap selection by toggling visibility on the 4 base raster
  // layers. Topo mode uses two stacked layers (opentopomap + voyager deep
  // fallback); satellite and apple are single-layer.
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    const apply = () => {
      const vis = (id: string, on: boolean) => {
        if (m.getLayer(id)) m.setLayoutProperty(id, "visibility", on ? "visible" : "none");
      };
      vis("base-topo",      basemap === "topo");
      vis("base-topo-deep", basemap === "topo");
      vis("base-apple",     basemap === "apple");
      vis("base-satellite", basemap === "satellite");
    };
    if (m.isStyleLoaded()) apply();
    else m.once("idle", apply);
  }, [basemap]);

  // Bearing computed from the last two GPS points — used to rotate the map
  // in nav mode so "up" is the direction of travel.
  const lastNavPosRef = useRef<[number, number] | null>(null);

  // Compute great-circle bearing (degrees, 0=N) from point a to b.
  const bearingBetween = (a: [number, number], b: [number, number]): number => {
    const f1 = (a[1] * Math.PI) / 180;
    const f2 = (b[1] * Math.PI) / 180;
    const dl = ((b[0] - a[0]) * Math.PI) / 180;
    const y = Math.sin(dl) * Math.cos(f2);
    const x =
      Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  };

  // Live navigation. When navMode flips on, kick off a high-frequency
  // GPS watch and ease the map to follow + rotate to direction of travel.
  useEffect(() => {
    if (!navMode) return;
    const map = mapRef.current;
    if (!map) return;
    if (!navigator.geolocation) {
      setLocateError("Geolocation not supported on this device.");
      return;
    }

    // Reset bearing tracking on each entry so we don't jump from stale data.
    lastNavPosRef.current = null;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const here: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];
        let bearing: number | null = null;
        if (lastNavPosRef.current) {
          // Only update bearing if we\'ve moved enough to read direction.
          // Tiny stationary jitter would otherwise spin the map.
          const f1 = (lastNavPosRef.current[1] * Math.PI) / 180;
          const f2 = (here[1] * Math.PI) / 180;
          const R = 6371000;
          const df = ((here[1] - lastNavPosRef.current[1]) * Math.PI) / 180;
          const dl = ((here[0] - lastNavPosRef.current[0]) * Math.PI) / 180;
          const h =
            Math.sin(df / 2) ** 2 +
            Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
          const dist = 2 * R * Math.asin(Math.sqrt(h));
          if (dist > 2) {
            bearing = bearingBetween(lastNavPosRef.current, here);
          }
        }
        lastNavPosRef.current = here;
        // Drop the GPS dot too — reuse user marker.
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat(here);
        } else {
          userMarkerRef.current = new maplibregl.Marker({
            element: buildUserDot(),
            anchor: "center",
          })
            .setLngLat(here)
            .addTo(map);
        }
        const easeOpts: maplibregl.EaseToOptions = {
          center: here,
          zoom: 17.5,
          pitch: 35,
          duration: 700,
          essential: true,
        };
        if (bearing !== null) easeOpts.bearing = bearing;
        map.easeTo(easeOpts);
        onUserPosition?.(here);
      },
      (err) => setLocateError(err.message || "Couldn\'t get your location."),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
    return () => {
      navigator.geolocation.clearWatch(id);
      // Restore map to north-up flat view on exit.
      map.easeTo({ pitch: 0, bearing: 0, duration: 500 });
    };
  }, [navMode, onUserPosition]);

  // Live location tracking
  useEffect(() => {
    if (!tracking) return;
    if (!navigator.geolocation) {
      setLocateError("Geolocation not supported on this device.");
      setTracking(false);
      return;
    }
    setLocateError(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const ll: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setUserLocation(ll);
        const map = mapRef.current;
        if (!map) return;
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat(ll);
        } else {
          userMarkerRef.current = new maplibregl.Marker({ element: buildUserDot(), anchor: "center" })
            .setLngLat(ll).addTo(map);
          map.flyTo({ center: ll, zoom: Math.max(map.getZoom(), 16) });
        }
      },
      (err) => { setLocateError(err.message || "Couldn't get your location."); setTracking(false); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [tracking]);

  function recenterOnUser() {
    if (!tracking) { setTracking(true); return; }
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({ center: userLocation, zoom: 17 });
    }
  }

  // Fetch which POIs have guest photos, then stamp a small camera badge on
  // those pins so guests can SEE which spots have memories before tapping.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("memories")
        .select("poi_slug")
        .not("poi_slug", "is", null);
      if (cancelled || error || !data) return;
      const slugs = new Set(data.map((r) => r.poi_slug as string));
      poiMarkersRef.current.forEach(({ el, poiSlug }) => {
        if (!poiSlug || !slugs.has(poiSlug)) return;
        if (el.querySelector("[data-photo-badge]")) return;
        el.style.position = "relative";
        const badge = document.createElement("div");
        badge.setAttribute("data-photo-badge", "true");
        badge.style.cssText = `position: absolute; top: -3px; right: -3px; width: 16px; height: 16px; background: #cdac7d; border: 1.5px solid #1A1310; border-radius: 50%; display: grid; place-items: center; z-index: 2; pointer-events: none; box-shadow: 0 1px 3px rgba(0,0,0,0.4);`;
        badge.innerHTML = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#1A1310" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3"/></svg>`;
        el.appendChild(badge);
      });
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={`map-vignette map-mode-${basemap}`}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />
      {/* Paper-grain texture above the basemap canvas. Pointer-events: none
          so it never intercepts taps meant for markers underneath. */}
      <div className="map-paper-grain" aria-hidden />

      {/* Hidden SVG defs — a subtle displacement filter used by the pin icons
          to give them a hand-drawn wobble. */}
      <svg
        aria-hidden
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      >
        <defs>
          <filter id="pin-rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="1.5" />
          </filter>
        </defs>
      </svg>

      {/* Hand-drawn compass — live: rotates with map bearing, tap resets to north */}
      <button
        onClick={() => mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 350 })}
        className="ios-press absolute z-10 select-none"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 5rem)",
          left: "1rem",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
        aria-label="Reset map to north"
        title="Reset to north"
      >
        <svg
          ref={compassRef}
          width="62"
          height="62"
          viewBox="0 0 62 62"
          fill="none"
          style={{ willChange: "transform" }}
        >
          <circle cx="31" cy="31" r="27" stroke="#2A1F18" strokeWidth="1.6" opacity="0.55" fill="#F0E2C2" fillOpacity="0.55" />
          <circle cx="31" cy="31" r="22" stroke="#2A1F18" strokeWidth="0.6" opacity="0.35" fill="none" />
          {/* North spike */}
          <path d="M31 6 L34.5 30 L31 33 L27.5 30 Z" fill="#D9531E" stroke="#2A1F18" strokeWidth="0.7" strokeLinejoin="round" />
          {/* South spike */}
          <path d="M31 56 L27.5 32 L31 29 L34.5 32 Z" fill="#F0E2C2" stroke="#2A1F18" strokeWidth="0.7" strokeLinejoin="round" />
          {/* East/West shorter spikes */}
          <path d="M56 31 L34 33 L31 31 L34 29 Z" fill="#B89968" stroke="#2A1F18" strokeWidth="0.4" strokeLinejoin="round" opacity="0.85" />
          <path d="M6 31 L28 29 L31 31 L28 33 Z" fill="#B89968" stroke="#2A1F18" strokeWidth="0.4" strokeLinejoin="round" opacity="0.85" />
          <circle cx="31" cy="31" r="2.5" fill="#2A1F18" />
          <text x="31" y="13" textAnchor="middle" fontFamily="var(--font-cabin-sketch), Cabin Sketch, serif" fontWeight="700" fontSize="9" fill="#2A1F18">N</text>
        </svg>
      </button>

      <button
        onClick={recenterOnUser}
        aria-label={tracking ? "Recenter on me" : "Track my location"}
        className="ios-glass-strong ios-press absolute bottom-6 right-4 z-10 grid h-12 w-12 place-items-center rounded-full text-[#F0E2C2]"
        title={tracking ? "Recenter on me" : "Show my live location"}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {tracking ? (
            <>
              <circle cx="12" cy="12" r="3" fill="#2E78D2" stroke="#2E78D2" />
              <path d="M12 2v3" /><path d="M12 19v3" /><path d="M2 12h3" /><path d="M19 12h3" />
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3" /><path d="M12 19v3" /><path d="M2 12h3" /><path d="M19 12h3" />
            </>
          )}
        </svg>
      </button>
      {locateError && (
        <div className="ios-glass-strong absolute bottom-24 right-4 z-10 max-w-[260px] rounded-2xl px-4 py-3 text-xs text-[#F0E2C2] shadow-lg">
          {locateError}
        </div>
      )}
    </>
  );
}
