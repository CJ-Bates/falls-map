// scripts/import-gpx.mjs
//
// Reads every .gpx file under Map App/incoming/ (or ../incoming/ from this script)
// and converts each into a GeoJSON LineString. Splits tracks at named waypoints.
// Outputs a draft FeatureCollection to scripts/imported-trails.json for review,
// and prints the names + lengths so CJ knows what to label.
//
// Usage:
//   node scripts/import-gpx.mjs           (default: scans ../incoming/)
//   node scripts/import-gpx.mjs path/to/dir
//
// After review, copy/merge segments into src/data/trails.json with name + surface.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = process.argv[2] || path.join(ROOT, "..", "incoming");

// Tiny GPX parser — no deps. Handles <trkpt lat= lon=> inside <trkseg>, plus <wpt> waypoints.
function parseGpx(xml) {
  const trkpts = [];
  const trkptRe = /<trkpt\s+([^>]+)\/?>([\s\S]*?)<\/trkpt>|<trkpt\s+([^>]+)\/>/g;
  for (const m of xml.matchAll(trkptRe)) {
    const attrs = m[1] || m[3] || "";
    const lat = parseFloat(/lat="([^"]+)"/.exec(attrs)?.[1] ?? "");
    const lon = parseFloat(/lon="([^"]+)"/.exec(attrs)?.[1] ?? "");
    const innerXml = m[2] || "";
    const time = /<time>([^<]+)<\/time>/.exec(innerXml)?.[1];
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      trkpts.push({ lat, lon, time });
    }
  }
  const wpts = [];
  const wptRe = /<wpt\s+([^>]+)>([\s\S]*?)<\/wpt>/g;
  for (const m of xml.matchAll(wptRe)) {
    const attrs = m[1];
    const inner = m[2];
    const lat = parseFloat(/lat="([^"]+)"/.exec(attrs)?.[1] ?? "");
    const lon = parseFloat(/lon="([^"]+)"/.exec(attrs)?.[1] ?? "");
    const name = /<name>([^<]+)<\/name>/.exec(inner)?.[1] ?? "";
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) wpts.push({ lat, lon, name });
  }
  return { trkpts, wpts };
}

// Haversine — meters between two lat/lng
function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLon = Math.sin(dLon / 2);
  const x =
    sinHalfLat * sinHalfLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinHalfLon * sinHalfLon;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Find the closest trkpt index to a waypoint (within tolerance, default 25m)
function closestTrkptIdx(trkpts, wpt, tolMeters = 25) {
  let best = -1;
  let bestDist = Infinity;
  for (let i = 0; i < trkpts.length; i++) {
    const d = haversineMeters(trkpts[i], wpt);
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return bestDist <= tolMeters ? best : -1;
}

// Douglas-Peucker simplification (degrees, tolerance ~0.000045 ≈ 5m)
function rdp(points, eps) {
  if (points.length < 3) return points;
  const dist = (p, a, b) => {
    const x = p.lon, y = p.lat, x1 = a.lon, y1 = a.lat, x2 = b.lon, y2 = b.lat;
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(x - x1, y - y1);
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len2));
    return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
  };
  let maxD = 0, idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = dist(points[i], points[0], points[points.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > eps) {
    const left = rdp(points.slice(0, idx + 1), eps);
    const right = rdp(points.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

// Total length of a track in miles
function lengthMiles(pts) {
  let m = 0;
  for (let i = 1; i < pts.length; i++) m += haversineMeters(pts[i - 1], pts[i]);
  return m / 1609.344;
}

async function main() {
  const files = (await fs.readdir(SRC_DIR).catch(() => []))
    .filter((f) => f.toLowerCase().endsWith(".gpx"));
  if (!files.length) {
    console.log(`No GPX files found in ${SRC_DIR}`);
    console.log("Drop your .gpx exports there and re-run.");
    return;
  }

  const features = [];
  for (const file of files) {
    const xml = await fs.readFile(path.join(SRC_DIR, file), "utf8");
    const { trkpts, wpts } = parseGpx(xml);
    if (!trkpts.length) {
      console.log(`  SKIP ${file}: no <trkpt> found`);
      continue;
    }
    console.log(`\n${file}: ${trkpts.length} points, ${wpts.length} waypoints`);

    // If there are named waypoints, use them as split markers (sorted by their position along the track).
    const splitIdx = wpts
      .map((w) => ({ ...w, idx: closestTrkptIdx(trkpts, w) }))
      .filter((w) => w.idx >= 0)
      .sort((a, b) => a.idx - b.idx);

    if (splitIdx.length === 0) {
      // No waypoints → treat the whole track as one segment, name = file name.
      const simplified = rdp(trkpts, 0.000045);
      const name = path.basename(file, ".gpx").replace(/[_-]/g, " ");
      const miles = lengthMiles(trkpts);
      console.log(`  Segment: "${name}" — ${miles.toFixed(2)} mi (${simplified.length} pts after smoothing)`);
      features.push({
        type: "Feature",
        properties: { name, surface: "unknown", source_file: file, miles: +miles.toFixed(2) },
        geometry: { type: "LineString", coordinates: simplified.map((p) => [p.lon, p.lat]) },
      });
    } else {
      // Each waypoint marks the start of a new named segment.
      for (let i = 0; i < splitIdx.length; i++) {
        const start = splitIdx[i].idx;
        const end = i + 1 < splitIdx.length ? splitIdx[i + 1].idx : trkpts.length - 1;
        const seg = trkpts.slice(start, end + 1);
        if (seg.length < 2) continue;
        const simplified = rdp(seg, 0.000045);
        const name = splitIdx[i].name || `Segment ${i + 1}`;
        const miles = lengthMiles(seg);
        console.log(`  Segment: "${name}" — ${miles.toFixed(2)} mi`);
        features.push({
          type: "Feature",
          properties: { name, surface: "unknown", source_file: file, miles: +miles.toFixed(2) },
          geometry: { type: "LineString", coordinates: simplified.map((p) => [p.lon, p.lat]) },
        });
      }

      // Also export waypoints as POIs (for "Junction with X", "Best overlook", etc.)
      const poiFeatures = wpts.map((w) => ({
        type: "Feature",
        properties: { name: w.name, source_file: file, kind: "waypoint" },
        geometry: { type: "Point", coordinates: [w.lon, w.lat] },
      }));
      features.push(...poiFeatures);
    }
  }

  const out = { type: "FeatureCollection", features };
  const outPath = path.join(__dirname, "imported-trails.json");
  await fs.writeFile(outPath, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${features.length} features to ${outPath}`);
  console.log(`Review, set 'surface' on each, then merge into src/data/trails.json.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
