"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { property, worldRing } from "@/data/property";
import { publicCabins } from "@/data/cabins";
import { pois, categoryStyle } from "@/data/pois";
import type { Cabin, Poi } from "@/data/types";
import parcelsData from "@/data/parcels.json";
import waterData from "@/data/water.json";

export type SelectedItem =
  | { kind: "cabin"; data: Cabin }
  | { kind: "poi"; data: Poi };

type Props = {
  onSelect: (item: SelectedItem | null) => void;
};

const TOPO_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
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
        '© <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA) · © OpenStreetMap contributors',
    },
  },
  layers: [{ id: "topo", type: "raster", source: "topo" }],
};

const ICON_PATHS: Record<string, string> = {
  cabin: '<path d="M3 9l9-7 9 7v12H3z"/><path d="M9 21V12h6v9"/>',
  pavilion: '<path d="M2 21h20"/><path d="M3.5 21 12 4l8.5 17"/><path d="M12 13v8"/>',
  firepit: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  "lake-feature": '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  barn: '<path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35a2 2 0 0 1 1.26-1.85l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/><path d="M6 10h12"/>',
  treehouse: '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7Z"/><path d="M12 22v-3"/>',
  shack: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  trailhead: '<path d="M14 8a2 2 0 1 0-4 0c0 2 2 4 2 4s2-2 2-4z"/><path d="m4 22 6-10"/><path d="m20 22-6-10"/>',
  parking: '<path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  "scenic-viewpoint": '<circle cx="12" cy="12" r="3"/><path d="M12 3v2"/><path d="M12 19v2"/><path d="M3 12h2"/><path d="M19 12h2"/>',
  waterfall: '<path d="M3 5l3 3"/><path d="M9 4v4"/><path d="M15 5l-3 3"/><path d="M21 7l-3 1"/><path d="M3 13c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M3 19c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
};

function buildPinElement(color: string, category: string): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.style.cssText = `
    width: 36px; height: 36px;
    border-radius: 50%;
    background: ${color};
    border: 2.5px solid #F0E2C2;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    display: grid; place-items: center;
    cursor: pointer;
    transition: transform 0.15s ease-out;
  `;
  wrap.addEventListener("mouseenter", () => (wrap.style.transform = "scale(1.12)"));
  wrap.addEventListener("mouseleave", () => (wrap.style.transform = ""));
  const path = ICON_PATHS[category] ?? '<circle cx="12" cy="12" r="3"/>';
  wrap.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block">${path}</svg>`;
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

export default function PropertyMap({ onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [tracking, setTracking] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

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
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.resize();

      // Build the dim mask: world rect with all 7 parcels punched out as holes.
      // Both owned parcels and the permission parcel (horse pasture) are NOT dimmed,
      // since guests can walk on either.
      type ParcelFeature = { geometry: { coordinates: number[][][] } };
      const allRings: number[][][] = (parcelsData.features as unknown as ParcelFeature[])
        .flatMap((f) => f.geometry.coordinates);
      const maskFeature = {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "Polygon" as const,
          coordinates: [worldRing as number[][], ...allRings],
        },
      };
      map.addSource("off-property", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [maskFeature] },
      });
      map.addLayer({
        id: "off-property-fill",
        type: "fill",
        source: "off-property",
        paint: { "fill-color": "#1A1310", "fill-opacity": 0.45 },
      });

      // Bodies of water — drawn ABOVE the dim mask so on- and off-property water both show
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

      // Permission parcels (horse pasture) — light tan fill behind owned outline
      map.addSource("parcels", { type: "geojson", data: parcelsData as never });
      map.addLayer({
        id: "parcel-permission-fill",
        type: "fill",
        source: "parcels",
        filter: ["==", ["get", "tier"], "permission"],
        paint: { "fill-color": "#B89968", "fill-opacity": 0.13 },
      });
      // Permission parcels — dashed warm-tan outline
      map.addLayer({
        id: "parcel-permission-outline",
        type: "line",
        source: "parcels",
        filter: ["==", ["get", "tier"], "permission"],
        paint: {
          "line-color": "#B89968",
          "line-width": 2,
          "line-opacity": 0.9,
          "line-dasharray": [3, 2],
        },
      });
      // Owned parcels — solid bright cream outline
      map.addLayer({
        id: "parcel-owned-outline",
        type: "line",
        source: "parcels",
        filter: ["==", ["get", "tier"], "owned"],
        paint: { "line-color": "#F0E2C2", "line-width": 2.5, "line-opacity": 0.95 },
      });

      // Compute fit-bounds from all parcels
      const lngs: number[] = [];
      const lats: number[] = [];
      allRings.forEach((ring) =>
        ring.forEach((pt) => {
          lngs.push(pt[0]);
          lats.push(pt[1]);
        }),
      );
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 50, duration: 0 });
    });

    publicCabins.forEach((c) => {
      const el = buildPinElement(categoryStyle.cabin.color, "cabin");
      el.title = c.name;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect({ kind: "cabin", data: c });
        map.flyTo({ center: [c.lng, c.lat], zoom: 17, duration: 600 });
      });
      new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([c.lng, c.lat])
        .addTo(map);
    });

    pois.forEach((p) => {
      const style = categoryStyle[p.category] ?? categoryStyle.pavilion;
      const el = buildPinElement(style.color, p.category);
      el.title = p.name;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect({ kind: "poi", data: p });
        map.flyTo({ center: [p.lng, p.lat], zoom: 17, duration: 600 });
      });
      new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
    });

    map.on("click", () => onSelect(null));
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [onSelect]);

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
            .setLngLat(ll)
            .addTo(map);
          map.flyTo({ center: ll, zoom: Math.max(map.getZoom(), 16) });
        }
      },
      (err) => {
        setLocateError(err.message || "Couldn't get your location.");
        setTracking(false);
      },
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
    if (!tracking) {
      setTracking(true);
      return;
    }
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({ center: userLocation, zoom: 17 });
    }
  }

  return (
    <>
      <div ref={containerRef} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
      <button
        onClick={recenterOnUser}
        aria-label={tracking ? "Recenter on me" : "Track my location"}
        className="absolute bottom-6 right-4 z-10 h-12 w-12 rounded-full bg-[#2A1F18] text-[#F0E2C2] shadow-lg border border-[#B89968] active:scale-95 transition grid place-items-center"
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
        <div className="absolute bottom-24 right-4 z-10 max-w-[260px] rounded bg-[#2A1F18] text-[#F0E2C2] p-3 text-xs shadow-lg border border-[#B89968]">
          {locateError}
        </div>
      )}
    </>
  );
}
