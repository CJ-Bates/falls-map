#!/usr/bin/env python3
"""
build_canopy.py — tree-canopy surface for 3D Satellite mode.

Builds a Digital Surface Model (ground + trees + buildings) from the raw USGS
3DEP lidar point cloud, subtracts our bare-earth DEM to get canopy height,
flattens the areas CJ traced as cleared since the flight, and writes it as
terrarium terrain tiles. In the app, Satellite + 3D drapes the imagery over
this surface so the woods stand up; Falls + 3D keeps using the bare ground.

Inputs
  tools/terrain/out/dem_aoi.tif        bare-earth DEM from build_terrain.py
  src/data/cleared-areas.json          GeoJSON polygons traced at /trace.html
  USGS EPT point cloud (streamed, no key):
      https://usgs-lidar-public.s3.amazonaws.com/<DATASET>/

Output
  public/tiles/surface/{z}/{x}/{y}.png  terrarium, 512 px, z12–z15

Run from the repo root:

    pip install "laspy[lazrs]" rasterio numpy pillow scipy requests
    python tools/terrain/build_canopy.py

Options: --dataset USGS_LPC_MO_StLouis_2017_LAS_2018 (default MO_NSEMO_1_2021),
--pad 300 (metres beyond the property to build canopy for), --workers 6.
Downloads are cached in tools/terrain/out/ept/ so re-runs are fast.
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
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_terrain as bt  # noqa: E402  (shares mercator maths + tile writer)

ROOT = bt.ROOT
OUT = bt.OUT
EPT_CACHE = OUT / "ept"
DEM_PATH = OUT / "dem_aoi.tif"
CLEARED_JSON = ROOT / "src" / "data" / "cleared-areas.json"
WATER_JSON = ROOT / "src" / "data" / "water.json"
SURFACE_DIR = ROOT / "public" / "tiles" / "surface"

EPT_BASE = "https://usgs-lidar-public.s3.amazonaws.com/{ds}/"
NOISE_CLASSES = {7, 18}       # ASPRS low / high noise
MAX_CANOPY_M = 40.0           # anything taller is a bird, a tower or noise
MIN_CANOPY_M = 1.5            # below this it's grass / brush — leave flat
CLEARED_FEATHER_M = 6.0       # soft edge on the flattened areas
SURFACE_ZOOMS = range(12, 16)


# ----------------------------------------------------------------------------- EPT
class Ept:
    def __init__(self, dataset: str, session):
        self.base = EPT_BASE.format(ds=dataset)
        self.s = session
        meta = session.get(self.base + "ept.json", timeout=60).json()
        if meta["srs"].get("horizontal") != "3857":
            raise SystemExit(f"{dataset} is in EPSG:{meta['srs'].get('horizontal')}, expected 3857")
        self.bounds = meta["bounds"]           # cubic [x0,y0,z0,x1,y1,z1]
        self.size0 = self.bounds[3] - self.bounds[0]
        self.hier: dict[str, int] = {}
        self._load_hier("0-0-0-0")

    def _load_hier(self, key: str):
        j = self.s.get(f"{self.base}ept-hierarchy/{key}.json", timeout=60).json()
        self.hier.update(j)

    def node_xy(self, key: str):
        d, x, y, _ = (int(v) for v in key.split("-"))
        size = self.size0 / (2 ** d)
        x0 = self.bounds[0] + x * size
        y0 = self.bounds[1] + y * size
        return x0, y0, x0 + size, y0 + size

    def nodes_in(self, bbox):
        """All hierarchy keys whose XY footprint intersects bbox (any depth)."""
        out, stack, seen = [], ["0-0-0-0"], set()
        while stack:
            key = stack.pop()
            if key in seen:
                continue
            seen.add(key)
            cnt = self.hier.get(key)
            if cnt is None:
                continue
            x0, y0, x1, y1 = self.node_xy(key)
            if x1 < bbox[0] or x0 > bbox[2] or y1 < bbox[1] or y0 > bbox[3]:
                continue
            if cnt == -1:                     # sub-hierarchy lives in its own file
                self._load_hier(key)
                cnt = self.hier.get(key, 0)
            if cnt > 0:
                out.append((key, cnt))
            d, x, y, z = (int(v) for v in key.split("-"))
            for i in (0, 1):
                for j in (0, 1):
                    for k in (0, 1):
                        stack.append(f"{d+1}-{2*x+i}-{2*y+j}-{2*z+k}")
        return out

    def fetch_laz(self, key: str) -> bytes:
        p = EPT_CACHE / f"{key}.laz"
        if p.exists():
            return p.read_bytes()
        for attempt in range(4):
            try:
                r = self.s.get(f"{self.base}ept-data/{key}.laz", timeout=180)
                if r.status_code == 200:
                    p.write_bytes(r.content)
                    return r.content
            except Exception:
                pass
            time.sleep(2 * (attempt + 1))
        raise RuntimeError(f"failed to fetch {key}")


# ----------------------------------------------------------------------------- main
def main():
    import laspy
    import rasterio
    import requests
    from rasterio.features import rasterize
    from rasterio.windows import from_bounds
    from scipy.ndimage import distance_transform_edt, gaussian_filter, maximum_filter, median_filter

    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset", default="MO_NSEMO_1_2021")
    ap.add_argument("--pad", type=float, default=300.0)
    ap.add_argument("--workers", type=int, default=6)
    args = ap.parse_args()

    if not DEM_PATH.exists():
        raise SystemExit("run build_terrain.py first (needs tools/terrain/out/dem_aoi.tif)")
    if not CLEARED_JSON.exists():
        raise SystemExit(f"missing {CLEARED_JSON.relative_to(ROOT)} — trace the cleared areas at /trace.html first")
    EPT_CACHE.mkdir(parents=True, exist_ok=True)

    # --- canopy build area: property + pad, snapped to the DEM's 1 m grid
    bj = json.loads(bt.BOUNDARY_JSON.read_text(encoding="utf-8"))
    xs, ys = [], []
    def walk(c):
        if isinstance(c[0], (int, float)):
            x, y = bt.lonlat_to_merc(c[0], c[1]); xs.append(x); ys.append(y)
        else:
            for k in c: walk(k)
    for f in bj["features"]:
        walk(f["geometry"]["coordinates"])
    bbox = (min(xs) - args.pad, min(ys) - args.pad, max(xs) + args.pad, max(ys) + args.pad)

    with rasterio.open(DEM_PATH) as ds:
        full_transform = ds.transform
        full_shape = (ds.height, ds.width)
        win = from_bounds(*bbox, ds.transform).round_offsets().round_lengths()
        dtm = ds.read(1, window=win).astype(np.float32)
        wt = ds.window_transform(win)
        res = abs(wt.a)
    h, w = dtm.shape
    print(f"canopy grid {w}x{h} @ {res:.0f} m")

    # --- stream the point cloud
    session = requests.Session()
    ept = Ept(args.dataset, session)
    nodes = ept.nodes_in(bbox)
    total = sum(c for _, c in nodes)
    print(f"{args.dataset}: {len(nodes)} EPT nodes, ~{total/1e6:.1f} M points")

    dsm = np.full((h, w), -1e9, dtype=np.float32)
    npts = 0
    t0 = time.time()

    def load(key):
        raw = ept.fetch_laz(key)
        las = laspy.read(io.BytesIO(raw))
        x = np.asarray(las.x); y = np.asarray(las.y); z = np.asarray(las.z)
        cls = np.asarray(las.classification)
        keep = (x >= bbox[0]) & (x < bbox[2]) & (y >= bbox[1]) & (y < bbox[3]) & ~np.isin(cls, list(NOISE_CLASSES))
        return x[keep], y[keep], z[keep]

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = {ex.submit(load, k): k for k, _ in nodes}
        for i, f in enumerate(as_completed(futs), 1):
            x, y, z = f.result()
            if len(x):
                col = ((x - wt.c) / wt.a).astype(np.int64)
                row = ((y - wt.f) / wt.e).astype(np.int64)
                ok = (col >= 0) & (col < w) & (row >= 0) & (row < h)
                flat = row[ok] * w + col[ok]
                np.maximum.at(dsm.reshape(-1), flat, z[ok].astype(np.float32))
                npts += int(ok.sum())
            if i % 20 == 0 or i == len(futs):
                print(f"  {i}/{len(futs)} nodes, {npts/1e6:.1f} M points, {time.time()-t0:.0f}s")

    # --- canopy height
    have = dsm > -1e8
    chm = np.where(have, dsm - dtm, 0.0).astype(np.float32)
    chm[~np.isfinite(chm)] = 0
    chm = np.clip(chm, 0, MAX_CANOPY_M)
    chm[chm < MIN_CANOPY_M] = 0
    # Fill pinholes between returns, then round the crowns a little so the 3D
    # surface reads as foliage rather than static.
    chm = maximum_filter(chm, size=3)
    chm = median_filter(chm, size=3)
    chm = gaussian_filter(chm, sigma=0.8)
    print(f"canopy: {np.mean(chm > MIN_CANOPY_M)*100:.0f}% of area treed, "
          f"median treed height {np.median(chm[chm > MIN_CANOPY_M])*bt.FT:.0f} ft, "
          f"max {chm.max()*bt.FT:.0f} ft")

    # --- flatten cleared areas (+ water) with a soft edge
    def merc_geoms(path):
        gj = json.loads(path.read_text(encoding="utf-8"))
        out = []
        for f in gj["features"]:
            g = f["geometry"]
            def conv(ring): return [list(bt.lonlat_to_merc(x, y)) for x, y in ring]
            if g["type"] == "Polygon":
                out.append({"type": "Polygon", "coordinates": [conv(r) for r in g["coordinates"]]})
            elif g["type"] == "MultiPolygon":
                out.append({"type": "MultiPolygon", "coordinates": [[conv(r) for r in p] for p in g["coordinates"]]})
        return out
    masks = merc_geoms(CLEARED_JSON)
    if WATER_JSON.exists():
        masks += merc_geoms(WATER_JSON)
    cleared = rasterize([(g, 1) for g in masks], out_shape=(h, w), transform=wt, fill=0, dtype="uint8").astype(bool)
    dist = distance_transform_edt(~cleared) * res
    keep = np.clip(dist / CLEARED_FEATHER_M, 0, 1)
    chm *= keep.astype(np.float32)
    print(f"flattened {len(masks)} areas ({np.mean(cleared)*100:.1f}% of grid)")

    # --- surface = ground + canopy, embedded back into the full DEM grid
    with rasterio.open(DEM_PATH) as ds:
        full = ds.read(1).astype(np.float32)
        valid = full > -1000
    r0, c0 = int(win.row_off), int(win.col_off)
    full[r0:r0 + h, c0:c0 + w] += chm
    (OUT / "chm_aoi.npy").write_bytes(chm.tobytes())  # debug/diagnostic
    bt.write_tiles(bt.terrarium(full, valid), full_transform, SURFACE_DIR, "surface", False, SURFACE_ZOOMS)
    print("done")


if __name__ == "__main__":
    main()
