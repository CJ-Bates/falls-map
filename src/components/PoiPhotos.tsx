"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, publicPhotoUrl, thumbPhotoUrl, type Memory } from "@/lib/supabase";

// Renders the "Guest photos" section inside the detail panel for a POI.
// Lazy-fetches memories tagged with this POI's slug, shows a small grid,
// and opens a lightbox on tap.

export default function PoiPhotos({ slug }: { slug: string }) {
  const [photos, setPhotos] = useState<Memory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<Memory | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPhotos(null);
    setError(null);
    (async () => {
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .eq("poi_slug", slug)
        .order("created_at", { ascending: false })
        .limit(24);
      if (cancelled) return;
      if (error) setError(error.message);
      else setPhotos((data ?? []) as Memory[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Don't render anything while loading or on error — keeps the panel quiet
  // for POIs that don't have photos yet.
  if (error) return null;
  if (!photos) return null;
  if (photos.length === 0) {
    return (
      <div className="rounded-2xl bg-[#F0E2C2]/5 border border-[#F0E2C2]/10 p-3 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F0E2C2]/10 flex-shrink-0" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[#F0E2C2]/85 leading-tight">
            No guest photos here yet.
          </div>
          <div className="text-[11px] text-[#F0E2C2]/55 leading-tight">
            Be the first — tag this spot when you upload.
          </div>
        </div>
        <Link
          href="/memories"
          className="ios-press text-[11px] font-semibold text-[#cdac7d] uppercase tracking-[0.14em] rounded-full bg-[#F0E2C2]/10 px-3 py-1.5"
        >
          Add
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-[10px] uppercase tracking-[0.16em] text-[#B89968]">
          Guest photos · {photos.length}
        </h3>
        <Link
          href="/memories"
          className="ios-press inline-flex items-center gap-1 text-[11px] font-semibold text-[#cdac7d] uppercase tracking-[0.14em] rounded-full bg-[#F0E2C2]/10 px-3 py-1"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {photos.map((m) => (
          <button
            key={m.id}
            onClick={() => setLightbox(m)}
            className="ios-press relative overflow-hidden rounded-xl aspect-square bg-[#2A1F18]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbPhotoUrl(m.storage_path)}
              alt={m.caption ?? "Guest photo"}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                const t = e.currentTarget as HTMLImageElement;
                const fallback = publicPhotoUrl(m.storage_path);
                if (t.src !== fallback) t.src = fallback;
              }}
            />
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            aria-label="Close"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 ios-press grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={publicPhotoUrl(lightbox.storage_path)}
            alt={lightbox.caption ?? "Guest photo"}
            className="max-h-[80svh] max-w-full object-contain rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.65)]"
            onClick={(e) => e.stopPropagation()}
          />
          {(lightbox.caption || lightbox.guest_name) && (
            <div
              className="ios-glass-strong absolute left-1/2 -translate-x-1/2 rounded-2xl px-4 py-3 text-[#F0E2C2] max-w-[90%] text-center"
              style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {lightbox.caption && (
                <div className="font-hand text-[20px] leading-snug">{lightbox.caption}</div>
              )}
              {lightbox.guest_name && (
                <div className="text-[11px] text-[#B89968] mt-1 uppercase tracking-[0.14em]">
                  {lightbox.guest_name}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
