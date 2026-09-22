#!/usr/bin/env python3
"""
build_imagery.py — self-hosted aerial imagery tiles for the Satellite basemap.

Two public-domain sources, pick with --source:

  mo6in  (default)  Missouri statewide 6-inch (0.15 m) leaf-off flight, winter
                    2024, from MSDIS. Current (post-clearing) and very sharp.
  naip              USGS NAIP Plus, June 2022, ~0.6 m, leaf-on/green — but it
                    predates the 2022 clearing, so it's wrong on the ridge.
                    Kept as an option; a spring drone flight is the real
                    answer for green + current.

Writes  public/tiles/ortho/{z}/{x}/{y}.webp   512 px, RGBA
  z12–z16  over the same padded area as the relief tiles (edge-feathered so it
           blends into Esri imagery beyond the lidar area)
  z17+     over the property + 300 m only (that's where guests zoom in);
           z18 by default (≈0.24 m/px here, close to native); --max-zoom 19
           adds ~650 tiles / ~35 MB for the last bit of sharpness

Run from the repo root (resumable — existing tiles are skipped):

    pip install numpy pillow requests
    python tools/terrain/build_imagery.py

--workers N (default 4 — be polite to public servers).
"""
from __future__ import annotations

import argparse
import io
import json
import math
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import numpy as np

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[2]
ORTHO_DIR = ROOT / "public" / "tiles" / "ortho"
BOUNDARY_JSON = ROOT / "src" / "data" / "owned-boundary.json"

SOURCES = {
    "naip": {
        "url": "https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer/exportImage",
        "max_zoom": 18,
        "attribution": "USGS / USDA NAIP",
    },
    "mo6in": {
        "url": "https://imagery.msdis.missouri.edu/arcgis/rest/services/StatewideServices/Missouri_2024_South_6inch/ImageServer/exportImage",
        "max_zoom": 18,
        "attribution": "MSDIS / State of Missouri 2024",
    },
}

# Same padded area as build_terrain.py so the two tile sets share an edge.
LON_MIN, LON_MAX = -90.4855, -90.4285
LAT_MIN, LAT_MAX = 38.3835, 38.4275
EDGE_FEATHER_M = 450

TILE_PX = 512
WIDE_ZOOMS = range(12, 17)      # full padded area
CLOSE_ZOOMS = range(17, 19)     # property + CLOSE_PAD_M only
CLOSE_PAD_M = 300
WEBP_QUALITY = 82

R = 6378137.0


def lonlat_to_merc(lon: float, lat: float) -> tuple[float, float]:
    return R * math.radians(lon), R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def tile_bounds_merc(z: int, x: int, y: int):
    n = 2 ** z
    size = 2 * math.pi * R / n
    x0 = -math.pi * R + x * size
    y1 = math.pi * R - y * size
    return x0, y1 - size, x0 + size, y1


def tiles_covering(z: int, xmin, ymin, xmax, ymax):
    n = 2 ** z
    size = 2 * math.pi * R / n
    for tx in range(int((xmin + math.pi * R) // size), int((xmax + math.pi * R) // size) + 1):
        for ty in range(int((math.pi * R - ymax) // size), int((math.pi * R - ymin) // size) + 1):
            yield tx, ty


def property_bounds_merc(pad_m: float):
    bj = json.loads(BOUNDARY_JSON.read_text(encoding="utf-8"))
    feats = bj["features"] if bj["type"] == "FeatureCollection" else [bj]
    xs, ys = [], []
    def walk(c):
        if isinstance(c[0], (int, float)):
            x, y = lonlat_to_merc(c[0], c[1]); xs.append(x); ys.append(y)
        else:
            for k in c: walk(k)
    for f in feats:
        walk(f["geometry"]["coordinates"])
    return min(xs) - pad_m, min(ys) - pad_m, max(xs) + pad_m, max(ys) + pad_m


def fetch_tile(z: int, x: int, y: int, session, url: str) -> bytes | None:
    b = tile_bounds_merc(z, x, y)
    params = {
        "bbox": f"{b[0]},{b[1]},{b[2]},{b[3]}",
        "bboxSR": 3857, "imageSR": 3857,
        "size": f"{TILE_PX},{TILE_PX}",
        "format": "png32", "bandIds": "0,1,2",
        "interpolation": "RSP_BilinearInterpolation",
        "f": "image",
    }
    for attempt in range(4):
        try:
            r = session.get(url, params=params, timeout=90)
            if r.status_code == 200 and r.headers.get("content-type", "").startswith("image/"):
                return r.content
            time.sleep(1.5 * (attempt + 1))
        except Exception:
            time.sleep(1.5 * (attempt + 1))
    return None


def feather_alpha(z: int, x: int, y: int, aoi) -> np.ndarray | None:
    """Alpha ramp for tiles near the padded-area edge; None if fully opaque."""
    b = tile_bounds_merc(z, x, y)
    size = (b[2] - b[0]) / TILE_PX
    if (b[0] - aoi[0] > EDGE_FEATHER_M and aoi[2] - b[2] > EDGE_FEATHER_M and
            b[1] - aoi[1] > EDGE_FEATHER_M and aoi[3] - b[3] > EDGE_FEATHER_M):
        return None
    px = b[0] + (np.arange(TILE_PX, dtype=np.float32) + 0.5) * size
    py = b[3] - (np.arange(TILE_PX, dtype=np.float32) + 0.5) * size
    dx = np.minimum(px - aoi[0], aoi[2] - px)[None, :]
    dy = np.minimum(py - aoi[1], aoi[3] - py)[:, None]
    d = np.minimum(dx, dy)
    f = np.clip(d / EDGE_FEATHER_M, 0, 1)
    f = f * f * (3 - 2 * f)
    return (255 * f).astype(np.uint8)


def main():
    import requests
    from PIL import Image

    ap = argparse.ArgumentParser()
    ap.add_argument("--source", choices=SOURCES.keys(), default="mo6in")
    ap.add_argument("--max-zoom", type=int, default=None)
    ap.add_argument("--workers", type=int, default=4)
    args = ap.parse_args()
    src = SOURCES[args.source]
    if args.max_zoom is None:
        args.max_zoom = src["max_zoom"]
    print(f"source: {args.source} ({src['attribution']}), max zoom {args.max_zoom}")

    aoi = (*lonlat_to_merc(LON_MIN, LAT_MIN), *lonlat_to_merc(LON_MAX, LAT_MAX))
    close = property_bounds_merc(CLOSE_PAD_M)
    tight = property_bounds_merc(60)

    jobs = []
    for z in WIDE_ZOOMS:
        jobs += [(z, x, y) for x, y in tiles_covering(z, *aoi)]
    for z in CLOSE_ZOOMS:
        if z <= args.max_zoom:
            jobs += [(z, x, y) for x, y in tiles_covering(z, *close)]
    if args.max_zoom >= 19:
        jobs += [(19, x, y) for x, y in tiles_covering(19, *tight)]
    todo = [j for j in jobs if not (ORTHO_DIR / str(j[0]) / str(j[1]) / f"{j[2]}.webp").exists()]
    print(f"{len(jobs)} tiles planned, {len(todo)} to fetch")

    session = requests.Session()
    session.headers["User-Agent"] = "falls-map-tiler/1.0 (thefallsatlionsden.com)"
    ok = fail = 0

    def work(job):
        z, x, y = job
        raw = fetch_tile(z, x, y, session, src["url"])
        if raw is None:
            return job, False
        img = Image.open(io.BytesIO(raw)).convert("RGBA")
        arr = np.asarray(img).copy()
        if arr[..., 3].max() == 0:
            return job, True  # nothing here (outside coverage) — skip silently
        fa = feather_alpha(z, x, y, aoi)
        if fa is not None:
            arr[..., 3] = np.minimum(arr[..., 3], fa)
        p = ORTHO_DIR / str(z) / str(x)
        p.mkdir(parents=True, exist_ok=True)
        Image.fromarray(arr, "RGBA").save(p / f"{y}.webp", quality=WEBP_QUALITY, method=6)
        return job, True

    t0 = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = [ex.submit(work, j) for j in todo]
        for i, f in enumerate(as_completed(futs), 1):
            job, good = f.result()
            ok += good; fail += (not good)
            if i % 25 == 0 or i == len(futs):
                print(f"  {i}/{len(futs)}  ok={ok} fail={fail}  {time.time()-t0:.0f}s")
    size = sum(f.stat().st_size for f in ORTHO_DIR.rglob("*.webp")) if ORTHO_DIR.exists() else 0
    n = sum(1 for _ in ORTHO_DIR.rglob("*.webp")) if ORTHO_DIR.exists() else 0
    print(f"ortho: {n} tiles on disk, {size/1e6:.1f} MB → {ORTHO_DIR.relative_to(ROOT)}")
    if fail:
        print(f"WARNING: {fail} tiles failed — re-run to retry just those.")
        sys.exit(1)
    print("done")


if __name__ == "__main__":
    main()
