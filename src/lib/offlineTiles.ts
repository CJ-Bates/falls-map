// Helpers for pre-fetching map tiles so the property works offline.
//
// The flow:
//   1. We compute the list of (z, x, y) tile coordinates that cover the
//      property bbox at zooms 14-17 (the most useful zoom range).
//   2. For each (z, x, y), we build URLs across the raster basemap sources
//      (OpenTopoMap, CartoDB Voyager, Esri World Imagery), plus the
//      OpenFreeMap vector tiles used by Standard and Relief.
//   3. We fetch each URL. The existing service worker intercepts these
//      and stores them in the TILES cache via its staleWhileRevalidate
//      rules, so subsequent MapLibre loads hit the cache instead of the
//      network.

import { property } from "@/data/property";

export type TileCoord = { z: number; x: number; y: number };

// Slippy-map tile math: convert (lng, lat) to tile (x, y) at zoom z.
export function lngLatToTile(lng: number, lat: number, z: number) {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return { x, y };
}

// Enumerate tile coords covering the property bbox at zooms [minZ, maxZ].
export function propertyTileCoords(minZ = 14, maxZ = 17): TileCoord[] {
  const { north, south, east, west } = property.bounds;
  // Add ~5% bbox padding so the edges still have context.
  const padLat = (north - south) * 0.05;
  const padLng = (east - west) * 0.05;
  const n = north + padLat;
  const s = south - padLat;
  const e = east + padLng;
  const w = west - padLng;

  const out: TileCoord[] = [];
  for (let z = minZ; z <= maxZ; z++) {
    const nw = lngLatToTile(w, n, z);
    const se = lngLatToTile(e, s, z);
    const xMin = Math.min(nw.x, se.x);
    const xMax = Math.max(nw.x, se.x);
    const yMin = Math.min(nw.y, se.y);
    const yMax = Math.max(nw.y, se.y);
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        out.push({ z, x, y });
      }
    }
  }
  return out;
}

// All URLs we want to fetch per tile. Mirrors the sources defined in
// PropertyMap.tsx's TOPO_STYLE.
export function urlsForTile({ z, x, y }: TileCoord): string[] {
  const urls: string[] = [];
  if (z <= 17) {
    const sub = ["a", "b", "c"][Math.abs(x + y) % 3];
    urls.push(`https://${sub}.tile.opentopomap.org/${z}/${x}/${y}.png`);
  }
  if (z <= 20) {
    const sub = ["a", "b", "c"][Math.abs(x + y) % 3];
    urls.push(`https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`);
  }
  // NB: Esri uses {z}/{y}/{x} order.
  if (z <= 19) {
    urls.push(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`);
  }
  return urls;
}

// OpenFreeMap serves vector tiles from a dated planet build, e.g.
//   .../planet/20260816_080001_pt/{z}/{x}/{y}.pbf
// That build id rotates, so it can't be hardcoded — MapLibre reads it from
// the TileJSON at runtime and so do we. Resolved once per prefetch and
// cached in-module. Returns null if the lookup fails, in which case we just
// skip vector prefetch rather than failing the whole download.
let vectorTemplate: string | null | undefined;

export async function resolveVectorTemplate(): Promise<string | null> {
  if (vectorTemplate !== undefined) return vectorTemplate;
  try {
    const res = await fetch("https://tiles.openfreemap.org/planet", { cache: "default" });
    if (!res.ok) throw new Error("tilejson " + res.status);
    const tj = (await res.json()) as { tiles?: string[] };
    vectorTemplate = tj.tiles?.[0] ?? null;
  } catch {
    vectorTemplate = null;
  }
  return vectorTemplate;
}

// Vector tiles stop at z14 and are overzoomed for deeper views, so covering
// the property needs only a handful of tiles — far cheaper than raster.
export function vectorUrlsForTile({ z, x, y }: TileCoord, template: string): string[] {
  if (z > 14) return [];
  return [template.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y))];
}

export type PrefetchProgress = {
  total: number;
  done: number;
  failed: number;
};

// Concurrency-limited prefetch. `onProgress` is called after each tile
// completes (success or failure). Resolves when all are done.
export async function prefetchAll(
  coords: TileCoord[],
  onProgress: (p: PrefetchProgress) => void,
  concurrency = 6,
): Promise<PrefetchProgress> {
  const template = await resolveVectorTemplate();
  const allUrls = [
    ...coords.flatMap(urlsForTile),
    ...(template ? coords.flatMap((c) => vectorUrlsForTile(c, template)) : []),
  ];
  let done = 0;
  let failed = 0;
  const total = allUrls.length;
  onProgress({ total, done, failed });

  const queue = [...allUrls];
  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) return;
      try {
        const res = await fetch(url, { cache: "default" });
        if (!res.ok) failed++;
      } catch {
        failed++;
      }
      done++;
      onProgress({ total, done, failed });
    }
  }
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return { total, done, failed };
}

const LS_KEY = "falls-offline-tiles-v1";

export type OfflineStatus = {
  cachedAt: number;
  totalTiles: number;
};

export function readOfflineStatus(): OfflineStatus | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OfflineStatus;
  } catch {
    return null;
  }
}

export function writeOfflineStatus(s: OfflineStatus) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}
