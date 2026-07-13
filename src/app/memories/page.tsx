"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase, publicPhotoUrl, thumbPhotoUrl, type Memory } from "@/lib/supabase";
import { publicCabins } from "@/data/cabins";
import { pois } from "@/data/pois";
import trails from "@/data/trails.json";

function trailSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const TRAIL_NAMES: string[] = Array.from(
  new Set(
    (trails.features as Array<{ properties: { name?: string } }>)
      .map((f) => f.properties?.name)
      .filter((n): n is string => !!n),
  ),
).sort((a, b) => a.localeCompare(b));

type UploadStatus =
  | { state: "idle" }
  | { state: "uploading"; progress: number }
  | { state: "error"; message: string }
  | { state: "done" };

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const PLACE_OPTIONS: { value: string; label: string; kind: "cabin" | "poi" | "trail" }[] = [
  ...publicCabins.map((c) => ({ value: `cabin:${c.slug}`, label: c.name, kind: "cabin" as const })),
  ...pois.map((p) => ({ value: `poi:${p.slug}`, label: p.name, kind: "poi" as const })),
  ...TRAIL_NAMES.map((name) => ({ value: `trail:${trailSlug(name)}`, label: name, kind: "trail" as const })),
];

function placeLabel(memory: Memory): string | null {
  if (memory.cabin_slug) {
    return publicCabins.find((c) => c.slug === memory.cabin_slug)?.name ?? null;
  }
  if (memory.poi_slug) {
    return pois.find((p) => p.slug === memory.poi_slug)?.name ?? null;
  }
  if (memory.trail_slug) {
    return TRAIL_NAMES.find((n) => trailSlug(n) === memory.trail_slug) ?? null;
  }
  return null;
}

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Lightbox tracks INDEX (into memories[]) rather than a single Memory,
  // so swipe / arrow / chevron nav can move through the gallery.
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ state: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview URL for the picked file. Memoized + revoked so we don't mint a
  // fresh blob: URL on every render (each one pins the photo in memory).
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(120);
      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
      } else if (data) {
        setMemories(data as Memory[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setUploadStatus({ state: "idle" });
  };

  const encodeImage = async (
    file: File,
    maxEdge: number,
    quality: number,
  ): Promise<Blob> => {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("Could not read photo"));
        i.src = url;
      });
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(img, 0, 0, w, h);
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Encode failed"))),
          "image/jpeg",
          quality,
        );
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploadStatus({ state: "uploading", progress: 0 });

    let original: Blob;
    let thumb: Blob;
    try {
      [original, thumb] = await Promise.all([
        encodeImage(file, Infinity, 0.92),
        encodeImage(file, 1200, 0.8),
      ]);
    } catch (err) {
      setUploadStatus({
        state: "error",
        message: err instanceof Error ? err.message : "Couldn't process photo",
      });
      return;
    }

    const id = crypto.randomUUID();
    const path = `${id}.jpg`;
    const thumbPath = `${id}-thumb.jpg`;
    const { error: uploadErr } = await supabase.storage
      .from("memories")
      .upload(path, original, { cacheControl: "31536000", contentType: "image/jpeg" });
    if (!uploadErr) {
      await supabase.storage
        .from("memories")
        .upload(thumbPath, thumb, { cacheControl: "31536000", contentType: "image/jpeg" });
    }

    if (uploadErr) {
      setUploadStatus({ state: "error", message: uploadErr.message });
      return;
    }

    const cabinSlug = place.startsWith("cabin:") ? place.slice("cabin:".length) : null;
    const poiSlug = place.startsWith("poi:") ? place.slice("poi:".length) : null;
    const trailSlugVal = place.startsWith("trail:") ? place.slice("trail:".length) : null;

    const { data: row, error: insertErr } = await supabase
      .from("memories")
      .insert({
        storage_path: path,
        caption: caption.trim() || null,
        guest_name: name.trim() || null,
        cabin_slug: cabinSlug,
        poi_slug: poiSlug,
        trail_slug: trailSlugVal,
      })
      .select()
      .single();

    if (insertErr) {
      setUploadStatus({ state: "error", message: insertErr.message });
      return;
    }

    if (row) setMemories((prev) => [row as Memory, ...prev]);
    setUploadStatus({ state: "done" });
    setFile(null);
    setCaption("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTimeout(() => setUploadStatus({ state: "idle" }), 2400);
  };

  // ---------- Lightbox navigation ----------
  const lightbox = useMemo<Memory | null>(() => {
    if (lightboxIndex === null) return null;
    return memories[lightboxIndex] ?? null;
  }, [lightboxIndex, memories]);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const showPrev = useCallback(() => {
    setLightboxIndex((idx) => (idx === null || idx <= 0 ? idx : idx - 1));
  }, []);
  const showNext = useCallback(() => {
    setLightboxIndex((idx) => {
      if (idx === null) return idx;
      if (idx >= memories.length - 1) return idx;
      return idx + 1;
    });
  }, [memories.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [lightboxIndex]);

  const swipeStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    swipeStart.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dt = Date.now() - start.t;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 800) {
      if (dx > 0) showPrev();
      else showNext();
    }
  };

  const currentIndex = lightboxIndex ?? 0;
  const canGoPrev = lightboxIndex !== null && lightboxIndex > 0;
  const canGoNext = lightboxIndex !== null && lightboxIndex < memories.length - 1;

  return (
    <main className="hero-radial min-h-[100svh] w-full pb-16">
      <header className="px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-2 flex items-center gap-3 max-w-3xl mx-auto">
        <Link
          href="/"
          aria-label="Back"
          className="ios-glass-strong ios-press grid h-10 w-10 place-items-center rounded-full text-[#F0E2C2]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1 className="ios-title text-2xl text-[#F0E2C2]">Memories</h1>
          <p className="text-[12px] text-[#B89968] mt-0.5">
            Photos from guests · {memories.length} so far
          </p>
        </div>
      </header>

      {/* Upload form */}
      <section className="px-6 max-w-3xl mx-auto mt-3">
        <form onSubmit={submit} className="ios-glass rounded-3xl p-4 space-y-3">
          <h2 className="text-[10px] uppercase tracking-[0.14em] text-[#B89968]">Share a photo</h2>

          <label className="ios-press block w-full cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="sr-only"
            />
            <div
              className={
                "relative overflow-hidden rounded-2xl aspect-[16/10] flex items-center justify-center text-center " +
                (file
                  ? "bg-[#2A1F18]"
                  : "bg-[#F0E2C2]/8 border-2 border-dashed border-[#F0E2C2]/20")
              }
            >
              {file && previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Selected"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute bottom-3 left-4 text-[12px] text-[#F0E2C2]/90 truncate max-w-[80%]">
                    {file.name}
                  </span>
                </>
              ) : (
                <div className="text-[#F0E2C2]/75 flex flex-col items-center gap-1.5">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <div className="text-[13px] font-semibold">Take a photo or pick one</div>
                  <div className="text-[11px] text-[#F0E2C2]/50">From camera, library, or files</div>
                </div>
              )}
            </div>
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={40}
            className="w-full rounded-2xl bg-[#F0E2C2]/8 px-3.5 py-2.5 text-[14px] text-[#F0E2C2] placeholder-[#F0E2C2]/35 outline-none focus:bg-[#F0E2C2]/12"
          />
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            maxLength={200}
            className="w-full rounded-2xl bg-[#F0E2C2]/8 px-3.5 py-2.5 text-[14px] text-[#F0E2C2] placeholder-[#F0E2C2]/35 outline-none focus:bg-[#F0E2C2]/12"
          />
          <select
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            className="w-full rounded-2xl bg-[#F0E2C2]/8 px-3.5 py-2.5 text-[14px] text-[#F0E2C2] outline-none focus:bg-[#F0E2C2]/12 appearance-none"
          >
            <option value="">Tag a place (optional)</option>
            <optgroup label="Cabins">
              {PLACE_OPTIONS.filter((o) => o.kind === "cabin").map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
            <optgroup label="Spots">
              {PLACE_OPTIONS.filter((o) => o.kind === "poi").map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
            <optgroup label="Trails">
              {PLACE_OPTIONS.filter((o) => o.kind === "trail").map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
          </select>

          {uploadStatus.state === "error" && (
            <div className="rounded-2xl bg-red-900/30 border border-red-400/30 px-3 py-2 text-[13px] text-red-200">
              {uploadStatus.message}
            </div>
          )}
          {uploadStatus.state === "done" && (
            <div className="rounded-2xl bg-[#7d8f5a]/20 border border-[#7d8f5a]/40 px-3 py-2 text-[13px] text-[#cae2a3]">
              Thanks! Photo posted.
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploadStatus.state === "uploading"}
            className="ios-press w-full rounded-2xl bg-[#F0E2C2] text-[#1A1310] font-semibold py-3 shadow-[0_8px_24px_rgba(184,153,104,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadStatus.state === "uploading" ? "Uploading…" : "Post photo"}
          </button>
        </form>
      </section>

      {/* Gallery */}
      <section className="px-6 max-w-3xl mx-auto mt-6">
        {loading ? (
          <div className="text-center text-[#F0E2C2]/55 text-[14px] py-8">Loading photos…</div>
        ) : loadError ? (
          <div className="rounded-2xl bg-red-900/30 border border-red-400/30 px-4 py-3 text-[13px] text-red-200">
            Couldn&apos;t load photos: {loadError}
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center text-[#F0E2C2]/55 text-[14px] py-8">
            No memories yet. Be the first to share one!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {memories.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setLightboxIndex(i)}
                className="ios-press relative overflow-hidden rounded-2xl aspect-square bg-[#2A1F18]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbPhotoUrl(m.storage_path)}
                  alt={m.caption ?? "Guest photo"}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    const fallback = publicPhotoUrl(m.storage_path);
                    if (target.src !== fallback) target.src = fallback;
                  }}
                />
                {(m.caption || m.guest_name) && (
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/85 to-transparent" />
                )}
                {(m.caption || m.guest_name) && (
                  <div className="absolute bottom-1.5 left-2 right-2 text-left">
                    {m.caption && (
                      <div className="text-[11px] text-[#F0E2C2] line-clamp-1 leading-tight">{m.caption}</div>
                    )}
                    {m.guest_name && (
                      <div className="text-[10px] text-[#F0E2C2]/70 leading-tight">{m.guest_name}</div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ============================================================
          LIGHTBOX (rewritten v105 → v107)

          Fixes vs. old version:
            - Close (X) button is now a *fixed* element with z-[60]
              so a tap always hits the button, not the image behind it.
            - Larger touch target (h-12 w-12 = 48px, iOS HIG minimum)
            - Explicit onPointerDown stopPropagation for reliability
            - Chevron prev/next buttons (fixed, z-[60])
            - Photo counter chip at top-left
            - Left/right swipe support via pointer events
            - Escape / arrow key support on desktop
            - Body scroll lock while open (prevents iOS scroll flicker)
        ============================================================ */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90"
          onClick={closeLightbox}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {/* Counter chip (top-left) */}
          <div
            className="fixed left-4 z-[60] ios-glass-strong rounded-full px-3 py-1.5 text-[11px] font-semibold text-[#F0E2C2] tracking-wider uppercase pointer-events-none"
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
          >
            {currentIndex + 1} / {memories.length}
          </div>

          {/* Close (X) button */}
          <button
            type="button"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="fixed right-4 z-[60] ios-press ios-glass-strong grid h-12 w-12 place-items-center rounded-full text-[#F0E2C2]"
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>

          {/* Prev button */}
          {memories.length > 1 && (
            <button
              type="button"
              aria-label="Previous photo"
              disabled={!canGoPrev}
              onClick={(e) => {
                e.stopPropagation();
                showPrev();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="fixed left-3 top-1/2 -translate-y-1/2 z-[60] ios-press ios-glass-strong grid h-12 w-12 place-items-center rounded-full text-[#F0E2C2] disabled:opacity-25"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}

          {/* Next button */}
          {memories.length > 1 && (
            <button
              type="button"
              aria-label="Next photo"
              disabled={!canGoNext}
              onClick={(e) => {
                e.stopPropagation();
                showNext();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="fixed right-3 top-1/2 -translate-y-1/2 z-[60] ios-press ios-glass-strong grid h-12 w-12 place-items-center rounded-full text-[#F0E2C2] disabled:opacity-25"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          )}

          {/* Image (centered) — pointer-events managed so backdrop close still works */}
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={lightbox.id}
              src={publicPhotoUrl(lightbox.storage_path)}
              alt={lightbox.caption ?? "Guest photo"}
              className="max-h-[78svh] max-w-full object-contain rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.65)] pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
          </div>

          {(lightbox.caption || lightbox.guest_name || placeLabel(lightbox)) && (
            <div
              className="ios-glass-strong fixed left-1/2 -translate-x-1/2 rounded-2xl px-4 py-3 text-[#F0E2C2] max-w-[90%] text-center pointer-events-auto"
              style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {lightbox.caption && (
                <div className="font-hand text-[20px] leading-snug">{lightbox.caption}</div>
              )}
              <div className="text-[11px] text-[#B89968] mt-1 uppercase tracking-[0.14em]">
                {[lightbox.guest_name, placeLabel(lightbox), timeAgo(lightbox.created_at)]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
