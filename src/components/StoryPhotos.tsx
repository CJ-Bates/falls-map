"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, publicPhotoUrl, thumbPhotoUrl, type Memory } from "@/lib/supabase";
import { useOverlayDismiss } from "@/lib/useOverlayDismiss";

// A small "Lately at The Falls" photo strip for the /story page.
// Pulls the 6 most recent guest photos. Renders nothing if the table is
// empty (so a brand new property never sees an awkward empty box).

export default function StoryPhotos() {
  const [photos, setPhotos] = useState<Memory[] | null>(null);
  const [lightbox, setLightbox] = useState<Memory | null>(null);
  useOverlayDismiss(!!lightbox, () => setLightbox(null));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      if (cancelled) return;
      if (!error && data) setPhotos(data as Memory[]);
      else setPhotos([]);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!photos || photos.length === 0) return null;

  return (
    <section className="ios-glass rounded-3xl p-6 space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="ios-headline text-[18px] text-[#cdac7d]">Lately at the Falls</h2>
        <Link href="/memories" className="text-[11px] uppercase tracking-[0.14em] text-[#B89968]">
          See all
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
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="fixed right-4 z-10 ios-press grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white"
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
        </div>
      )}
    </section>
  );
}
