"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { property } from "@/data/property";
import { publicCabins } from "@/data/cabins";
import { pois, categoryStyle } from "@/data/pois";
import type { Cabin, Poi } from "@/data/types";

export type SelectedItem =
  | { kind: "cabin"; data: Cabin }
  | { kind: "poi"; data: Poi };

type Props = {
  onSelect: (item: SelectedItem | null) => void;
};

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

function buildPinElement(color: string, emoji: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `
    width: 36px; height: 36px; border-radius: 50% 50% 50% 0;
    background: ${color};
    transform: rotate(-45deg);
    display: grid; place-items: center;
    border: 2px solid #F0E2C2;
    box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    cursor: pointer;
  `;
  const inner = document.createElement("div");
  inner.style.cssText = `transform: rotate(45deg); font-size: 18px; line-height: 1;`;
  inner.textContent = emoji;
  el.appendChild(inner);
  return el;
}

export default function PropertyMap({ onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: OSM_STYLE,
      center: [property.center.lng, property.center.lat],
      zoom: 14.5,
      maxBounds: [
        [property.bounds.west - 0.01, property.bounds.south - 0.01],
        [property.bounds.east + 0.01, property.bounds.north + 0.01],
      ],
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.once("load", () => {
      map.resize();
      map.fitBounds(
        [
          [property.bounds.west, property.bounds.south],
          [property.bounds.east, property.bounds.north],
        ],
        { padding: 60, duration: 0 },
      );
    });

    publicCabins.forEach((c) => {
      const el = buildPinElement(categoryStyle.cabin.color, categoryStyle.cabin.emoji);
      el.title = c.name;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect({ kind: "cabin", data: c });
        map.flyTo({ center: [c.lng, c.lat], zoom: 17, duration: 600 });
      });
      new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([c.lng, c.lat])
        .addTo(map);
    });

    pois.forEach((p) => {
      const style = categoryStyle[p.category] ?? categoryStyle.pavilion;
      const el = buildPinElement(style.color, style.emoji);
      el.title = p.name;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect({ kind: "poi", data: p });
        map.flyTo({ center: [p.lng, p.lat], zoom: 17, duration: 600 });
      });
      new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
    });

    map.on("click", () => onSelect(null));

    // Critical fix: resize the map whenever the container resizes. This handles
    // the case where the container is briefly 0-height during initial layout
    // (next.js hydration before flexbox/svh settles), which would otherwise
    // freeze the canvas at the initial bad size.
    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [onSelect]);

  function locate() {
    if (!navigator.geolocation) {
      setLocateError("Geolocation not supported on this device.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const map = mapRef.current;
        if (!map) return;
        const ll: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat(ll);
        } else {
          const dot = document.createElement("div");
          dot.style.cssText = `
            width: 18px; height: 18px; border-radius: 50%;
            background: #2E78D2;
            border: 3px solid #fff;
            box-shadow: 0 0 0 4px rgba(46,120,210,0.25), 0 2px 6px rgba(0,0,0,0.4);
          `;
          userMarkerRef.current = new maplibregl.Marker({ element: dot })
            .setLngLat(ll)
            .addTo(map);
        }
        map.flyTo({ center: ll, zoom: 17 });
      },
      (err) => {
        setLocating(false);
        setLocateError(err.message || "Couldn't get your location.");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  // Use absolute positioning so the container has concrete dimensions inside
  // its `relative` parent (main), avoiding any block-flow height calc weirdness.
  return (
    <>
      <div ref={containerRef} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} />
      <button
        onClick={locate}
        className="absolute bottom-6 right-4 z-10 rounded-full bg-[#2A1F18] text-[#F0E2C2] shadow-lg px-4 py-3 text-sm font-medium border border-[#B89968] active:scale-95 transition"
      >
        {locating ? "Locating…" : "Where am I?"}
      </button>
      {locateError && (
        <div className="absolute bottom-24 right-4 z-10 max-w-[260px] rounded bg-[#2A1F18] text-[#F0E2C2] p-3 text-xs shadow-lg">
          {locateError}
        </div>
      )}
    </>
  );
}
