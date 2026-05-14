"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, publicPhotoUrl, thumbPhotoUrl, type Memory } from "@/lib/supabase";

// Per-cabin photo strip. Pulls guest photos tagged with this cabin\u2019s slug
// and renders them as a grid. Hides cleanly when there are no photos for
// the cabin so empty welcome pages don\u2019t show a stranded section.

export default function CabinPhotoGallery({
  cabinSlug,
  cabinName,
}: {
  cabinSlug: string;
  cabinName: string;
}) {
  const [photos, setPhotos] = useState<Memory[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .eq("cabin_slug", cabinSlug)
        .order("created_at", { ascending: false })
        .limit(24);
      if (cancelled) return;
      if (error || !data) {
        setPhotos([]);
        return;
      }
      setPhotos(data as Memory[]);
    })();
    return () => { cancelled = true; };
  }, [cabinSlug]);

  // Render nothing while loading or when empty \u2014 keeps the welcome page tight.
  if (!photos || photos.length === 0) return null;

  return (
    <section className="ios-glass rounded-3xl p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="ios-headline text-[15px] text-[#cdac7d]">
          Photos from {cabinName}
        </h2>
        <Link href="/memories" className="text-[11px] text-[#F0E2C2]/60 hover:text-[#F0E2C2]/90">
          See all &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.slice(0, 12).map((m) => (
          <a
            key={m.id}
            href={publicPhotoUrl(m.storage_path)}
            target="_blank"
            rel="noopener noreferrer"
            className="ios-press relative aspect-square overflow-hidden rounded-xl bg-[#2A1F18]"
            title={m.caption ?? "Guest photo"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbPhotoUrl(m.storage_path)}
              alt={m.caption ?? "Guest photo"}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                const t = e.currentTarget as HTMLImageElement;
                const fb = publicPhotoUrl(m.storage_path);
                if (t.src !== fb) t.src = fb;
              }}
            />
          </a>
        ))}
      </div>
      <p className="text-[11px] text-[#F0E2C2]/45 mt-3 leading-snug">
        Tap any photo to view full size. {photos.length > 12 && `Showing 12 of ${photos.length}. `}<Link href="/memories" className="text-[#cdac7d] underline">Share a photo from your stay</Link>.
      </p>
    </section>
  );
}
