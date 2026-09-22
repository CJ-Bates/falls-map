#!/usr/bin/env python3
"""
build_terrain.py — one-shot pipeline for the "Falls" basemap.

Turns the free USGS 3DEP lidar DEM (~1 m, project MO_StLouis_2017) into:

  public/tiles/relief/{z}/{x}/{y}.webp  pre-rendered shaded relief, brand-tinted,
                                        512 px RGBA, z12–z16  (the Falls basemap)
  public/tiles/terrain/{z}/{x}/{y}.png  terrarium-encoded elevation, 512 px,
                                        z12–z15 (for 3D terrain / runtime hillshade)
  public/tiles/contours.json            5 ft contours (25 ft index) clipped to the
                                        property + 250 m, in lon/lat

Run from the repo root:

    pip install rasterio numpy pillow shapely scipy matplotlib requests
    python tools/terrain/build_terrain.py

Re-run with --dem <path.tif> to skip the download and use a DEM you already have
(must be EPSG:3857, metres). Intermediate files land in tools/terrain/out/ which
is git-ignored.

No API keys. Data source: https://elevation.nationalmap.gov (public domain).
"""
from __future__ import annotations

import argparse
import io
import json
import math
import os
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / "out"
RELIEF_DIR = ROOT / "public" / "tiles" / "relief"
TERRAIN_DIR = ROOT / "public" / "tiles" / "terrain"
CONTOURS_JSON = ROOT / "public" / "tiles" / "contours.json"
BOUNDARY_JSON = ROOT / "src" / "data" / "owned-boundary.json"

# Property bounds (from owned-boundary.json) padded by ~1.6 km so tiles around
# the edges of the map still have relief under them.
LON_MIN, LON_MAX = -90.4855, -90.4285
LAT_MIN, LAT_MAX = 38.3835, 38.4275

TILE_PX = 512
RELIEF_ZOOMS = range(12, 17)   # z16 @ 512 px ≈ 0.94 m/px here = lidar native
TERRAIN_ZOOMS = range(12, 16)  # 3D terrain is fine at ~1.9 m; MapLibre overzooms

# Brand palette (globals.css)
CREAM_LOW = np.array([0xF2, 0xEA, 0xD6], dtype=np.float32)   # valleys / paper
TAN_HIGH = np.array([0xCF, 0xBA, 0x90], dtype=np.float32)    # ridges
SHADOW = np.array([0x4A, 0x35, 0x24], dtype=np.float32)      # hillshade shadow
HIGHLIGHT = np.array([0xFD, 0xF6, 0xE4], dtype=np.float32)   # hillshade light

FT = 3.28084


# ----------------------------------------------------------------------------- mercator
R = 6378137.0


def lonlat_to_merc(lon: float, lat: float) -> tuple[float, float]:
    x = R * math.radians(lon)
    y = R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    return x, y


def merc_to_lonlat(x: float, y: float) -> tuple[float, float]:
    lon = math.degrees(x / R)
    lat = math.degrees(2 * math.atan(math.exp(y / R)) - math.pi / 2)
    return lon, lat


def tile_bounds_merc(z: int, x: int, y: int) -> tuple[float, float, float, float]:
    n = 2 ** z
    size = 2 * math.pi * R / n
    x0 = -math.pi * R + x * size
    y1 = math.pi * R - y * size
    return x0, y1 - size, x0 + size, y1


def tiles_covering(z: int, xmin: float, ymin: float, xmax: float, ymax: float):
    n = 2 ** z
    size = 2 * math.pi * R / n
    tx0 = int((xmin + math.pi * R) // size)
    tx1 = int((xmax + math.pi * R) // size)
    ty0 = int((math.pi * R - ymax) // size)
    ty1 = int((math.pi * R - ymin) // size)
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            yield tx, ty


# ----------------------------------------------------------------------------- fetch
def fetch_dem(dst: Path) -> Path:
    """Pull the 3DEP 1 m DEM for the AOI in ≤2500 px chunks and mosaic them."""
    import rasterio
    import requests
    from rasterio.merge import merge

    x0, y0 = lonlat_to_merc(LON_MIN, LAT_MIN)
    x1, y1 = lonlat_to_merc(LON_MAX, LAT_MAX)
    res = 1.0  # metres
    cols = int(math.ceil((x1 - x0) / res))
    rows = int(math.ceil((y1 - y0) / res))
    chunk = 2500
    nx, ny = math.ceil(cols / chunk), math.ceil(rows / chunk)
    print(f"DEM AOI {cols}x{rows} px @1 m → {nx}x{ny} chunks")
    OUT.mkdir(parents=True, exist_ok=True)
    parts = []
    base = "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage"
    for iy in range(ny):
        for ix in range(nx):
            cx0 = x0 + ix * chunk * res
            cy1 = y1 - iy * chunk * res
            cx1 = min(cx0 + chunk * res, x1)
            cy0 = max(cy1 - chunk * res, y0)
            w = int(round((cx1 - cx0) / res))
            h = int(round((cy1 - cy0) / res))
            p = OUT / f"dem_part_{iy}_{ix}.tif"
            if not p.exists():
                params = {
                    "bbox": f"{cx0},{cy0},{cx1},{cy1}",
                    "bboxSR": 3857, "imageSR": 3857,
                    "size": f"{w},{h}",
                    "format": "tiff", "pixelType": "F32",
                    "interpolation": "RSP_BilinearInterpolation",
                    "noData": -9999,
                    "f": "image",
                }
                print(f"  fetching chunk {iy},{ix} ({w}x{h}) …", end="", flush=True)
                r = requests.get(base, params=params, timeout=300)
                r.raise_for_status()
                if not r.content.startswith(b"II") and not r.content.startswith(b"MM"):
                    raise SystemExit(f"\nNot a TIFF — server said: {r.text[:300]}")
                p.write_bytes(r.content)
                print(f" {len(r.content)/1e6:.1f} MB")
            parts.append(p)
    srcs = [rasterio.open(p) for p in parts]
    mosaic, transform = merge(srcs, nodata=-9999)
    meta = srcs[0].meta.copy()
    meta.update(height=mosaic.shape[1], width=mosaic.shape[2], transform=transform,
                nodata=-9999, compress="deflate", crs="EPSG:3857")
    with rasterio.open(dst, "w", **meta) as f:
        f.write(mosaic)
    for s in srcs:
        s.close()
    print(f"DEM mosaic → {dst}  ({mosaic.shape[2]}x{mosaic.shape[1]})")
    return dst


# ----------------------------------------------------------------------------- relief
def _shade_strip(zs: np.ndarray, res: float, lo: float, hi: float) -> np.ndarray:
    """Multi-directional hillshade + brand tint for one strip → RGB float32."""
    gy, gx = np.gradient(zs, res)
    gx = gx.astype(np.float32); gy = gy.astype(np.float32)
    slope = np.arctan(np.hypot(gx, gy)).astype(np.float32)
    aspect = np.arctan2(-gx, gy).astype(np.float32)
    del gx, gy
    cs, ss = np.cos(slope), np.sin(slope)
    hs = np.zeros_like(zs, dtype=np.float32)
    # Mark (1992)-style multi-directional: NW dominant, blended with W, N, SW
    for w, az_deg, alt_deg in ((0.45, 315, 45), (0.25, 270, 40), (0.20, 0, 40), (0.10, 225, 35)):
        az, alt = math.radians(az_deg), math.radians(alt_deg)
        hs += w * np.clip(math.sin(alt) * cs + math.cos(alt) * ss * np.cos(az - aspect), 0, 1)
    del aspect, cs, ss
    slope_k = np.clip(np.degrees(slope) / 45.0, 0, 1)
    del slope

    t = np.clip((zs - lo) / max(hi - lo, 1e-6), 0, 1)[..., None]
    rgb = CREAM_LOW * (1 - t) + TAN_HIGH * t          # (h,w,3) float32
    light = (hs - 0.5)[..., None]
    k = np.abs(light) * 1.35
    shade = np.where(light < 0, SHADOW, HIGHLIGHT)
    rgb = rgb * (1 - k) + shade * k
    rgb *= (1 - 0.22 * slope_k[..., None])
    return rgb


def render_relief(dem: np.ndarray, res: float, valid: np.ndarray) -> np.ndarray:
    """Strip-wise (memory-safe) relief render → RGBA uint8 of the whole AOI."""
    from scipy.ndimage import gaussian_filter

    fill = float(np.median(dem[valid]))
    z = np.where(valid, dem, fill).astype(np.float32)
    sub = z[::8, ::8][valid[::8, ::8]]
    lo, hi = np.percentile(sub, [2, 98])
    h, w = z.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    strip, pad = 512, 16
    for y0 in range(0, h, strip):
        a, b = max(0, y0 - pad), min(h, y0 + strip + pad)
        zs = gaussian_filter(z[a:b], sigma=1.2)
        rgb = _shade_strip(zs, res, lo, hi)
        s0 = y0 - a
        s1 = s0 + min(strip, h - y0)
        rgba[y0:y0 + (s1 - s0), :, :3] = np.clip(rgb[s0:s1], 0, 255).astype(np.uint8)
    rgba[..., 3] = np.where(valid, 255, 0).astype(np.uint8)
    del z
    return rgba


def terrarium(dem: np.ndarray, valid: np.ndarray) -> np.ndarray:
    from scipy.ndimage import distance_transform_edt

    if not valid.all():
        # fill nodata with nearest valid so 3D terrain has no holes at AOI edge
        idx = distance_transform_edt(~valid, return_distances=False, return_indices=True)
        dem = dem[tuple(idx)]
    # Quantise to 1/16 m (6 cm): lidar noise below that is just PNG bloat.
    v = np.round((dem + 32768.0) * 16.0) / 16.0
    r = np.floor(v / 256.0)
    g = np.floor(v - r * 256.0)
    b = np.floor((v - np.floor(v)) * 256.0)
    out = np.stack([r, g, b], axis=-1)
    return np.clip(out, 0, 255).astype(np.uint8)


def write_tiles(arr: np.ndarray, transform, out_dir: Path, label: str, alpha: bool, zooms):
    """arr is (H,W,3|4) uint8 in EPSG:3857 with the given affine transform.
    alpha=True → lossy WebP (relief); alpha=False → lossless PNG (terrain)."""
    import rasterio
    from rasterio.enums import Resampling
    from rasterio.transform import from_bounds
    from rasterio.warp import reproject
    from PIL import Image

    bands = arr.shape[2]
    src = np.moveaxis(arr, -1, 0)  # (bands,H,W)
    x0, y0 = lonlat_to_merc(LON_MIN, LAT_MIN)
    x1, y1 = lonlat_to_merc(LON_MAX, LAT_MAX)
    count = 0
    for z in zooms:
        for tx, ty in tiles_covering(z, x0, y0, x1, y1):
            b = tile_bounds_merc(z, tx, ty)
            dst = np.zeros((bands, TILE_PX, TILE_PX), dtype=np.uint8)
            reproject(
                src, dst,
                src_transform=transform, src_crs="EPSG:3857",
                dst_transform=from_bounds(*b, TILE_PX, TILE_PX), dst_crs="EPSG:3857",
                resampling=Resampling.bilinear if alpha else Resampling.nearest,
                src_nodata=None, dst_nodata=0,
            )
            img = np.moveaxis(dst, 0, -1)
            if alpha and img[..., 3].max() == 0:
                continue
            if not alpha and (img.sum(axis=-1) == 0).all():
                continue
            p = out_dir / str(z) / str(tx)
            p.mkdir(parents=True, exist_ok=True)
            if alpha:
                Image.fromarray(img, "RGBA").save(p / f"{ty}.webp", quality=86, method=6)
            else:
                Image.fromarray(img, "RGB").save(p / f"{ty}.png", optimize=True)
            count += 1
    size = sum(f.stat().st_size for f in out_dir.rglob("*.*"))
    print(f"{label}: {count} tiles, {size/1e6:.1f} MB → {out_dir.relative_to(ROOT)}")


# ----------------------------------------------------------------------------- contours
def build_contours(dem: np.ndarray, valid: np.ndarray, transform, res: float):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from scipy.ndimage import gaussian_filter
    from shapely.geometry import LineString, shape, mapping
    from shapely.ops import unary_union

    bj = json.loads(BOUNDARY_JSON.read_text(encoding="utf-8"))
    geoms = [shape(f["geometry"]) for f in bj["features"]] if bj["type"] == "FeatureCollection" else [shape(bj["geometry"])]
    boundary_ll = unary_union(geoms)
    # to mercator for a metric buffer
    from shapely.ops import transform as shp_transform
    to_m = lambda x, y, z=None: lonlat_to_merc(x, y)  # noqa: E731
    to_ll = lambda x, y, z=None: merc_to_lonlat(x, y)  # noqa: E731
    clip = shp_transform(to_m, boundary_ll).buffer(250)

    # Contour on a 2 m grid: 5 ft lines don't need 1 m and it quarters memory.
    z = np.where(valid, dem, float(np.median(dem[valid]))).astype(np.float32)
    zft = gaussian_filter(z, sigma=2.0)[::2, ::2] * FT
    v2 = valid[::2, ::2]
    del z
    lo = math.floor(np.nanmin(zft[v2]) / 5) * 5
    hi = math.ceil(np.nanmax(zft[v2]) / 5) * 5
    levels = np.arange(lo, hi + 5, 5)
    h, w = zft.shape
    xs = transform.c + (np.arange(w) * 2 + 0.5) * transform.a
    ys = transform.f + (np.arange(h) * 2 + 0.5) * transform.e
    fig = plt.figure()
    cs = plt.contour(xs, ys, zft, levels=levels)
    feats = []
    for lvl, segs in zip(cs.levels, cs.allsegs):
        for seg in segs:
            if len(seg) < 4:
                continue
            ln = LineString(seg).intersection(clip)
            if ln.is_empty:
                continue
            parts = list(ln.geoms) if ln.geom_type == "MultiLineString" else [ln]
            for part in parts:
                if part.length < 30:
                    continue
                part = part.simplify(0.6, preserve_topology=False)
                ll = shp_transform(to_ll, part)
                coords = [[round(x, 6), round(y, 6)] for x, y in ll.coords]
                feats.append({
                    "type": "Feature",
                    "properties": {"ft": int(round(lvl)), "idx": 1 if int(round(lvl)) % 25 == 0 else 0},
                    "geometry": {"type": "LineString", "coordinates": coords},
                })
    plt.close(fig)
    CONTOURS_JSON.parent.mkdir(parents=True, exist_ok=True)
    CONTOURS_JSON.write_text(json.dumps({"type": "FeatureCollection", "features": feats}, separators=(",", ":")), encoding="utf-8")
    print(f"contours: {len(feats)} lines, {lo:.0f}–{hi:.0f} ft, {CONTOURS_JSON.stat().st_size/1e3:.0f} KB → {CONTOURS_JSON.relative_to(ROOT)}")


# ----------------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dem", help="existing EPSG:3857 DEM GeoTIFF (skip download)")
    ap.add_argument("--skip-tiles", action="store_true")
    ap.add_argument("--skip-contours", action="store_true")
    args = ap.parse_args()

    # Windows consoles default to cp1252, which can't print the arrows/dashes
    # in the progress messages below.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    import rasterio

    OUT.mkdir(parents=True, exist_ok=True)
    dem_path = Path(args.dem) if args.dem else fetch_dem(OUT / "dem_aoi.tif")
    with rasterio.open(dem_path) as ds:
        dem = ds.read(1).astype(np.float32)
        transform = ds.transform
        nodata = ds.nodata
        res = abs(transform.a)
    valid = np.isfinite(dem)
    if nodata is not None:
        valid &= dem != nodata
    valid &= dem > -1000
    print(f"DEM {dem.shape[1]}x{dem.shape[0]} @ {res:.2f} m, valid {valid.mean()*100:.1f}%, "
          f"{np.nanmin(dem[valid])*FT:.0f}–{np.nanmax(dem[valid])*FT:.0f} ft")

    if not args.skip_tiles:
        import shutil
        for d in (RELIEF_DIR, TERRAIN_DIR):
            if d.exists():
                shutil.rmtree(d)
        write_tiles(render_relief(dem, res, valid), transform, RELIEF_DIR, "relief", True, RELIEF_ZOOMS)
        write_tiles(terrarium(dem, valid), transform, TERRAIN_DIR, "terrain", False, TERRAIN_ZOOMS)
    if not args.skip_contours:
        build_contours(dem, valid, transform, res)
    print("done")


if __name__ == "__main__":
    main()
