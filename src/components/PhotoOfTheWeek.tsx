"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, publicPhotoUrl, thumbPhotoUrl, type Memory } from "@/lib/supabase";

// Featured guest photo on the home page. Renders nothing on empty weeks
// so we don't show an awkward placeholder when no one has uploaded.

const RECENT_DAYS = 14;

export default function PhotoOfTheWeek() {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1);
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setMemory(null);
        setLoaded(true);
        return;
      }
      setMemory(data[0] as Memory);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Render nothing while loading and nothing when empty.
  if (!loaded || !memory) return null;

  const caption = memory.caption?.trim() || "";
  const guest = memory.guest_name?.trim() || "";

  return (
    <section className="mt-6 px-6">
      <Link
        href="/memories"
        className="ios-press group relative mx-auto block max-w-md overflow-hidden rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
      >
        <div className="relative aspect-[4/3] w-full bg-[#2A1F18]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbPhotoUrl(memory.storage_path)}
            alt={caption || "Guest photo"}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              const t = e.currentTarget as HTMLImageElement;
              const fb = publicPhotoUrl(memory.storage_path);
              if (t.src !== fb) t.src = fb;
            }}
          />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0e0a08]/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0e0a08]/95 via-[#0e0a08]/60 to-transparent" />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#1A1310]/70 backdrop-blur px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[#cdac7d] border border-[#cdac7d]/30">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2"/>
              <circle cx="8.5" cy="10.5" r="1.5"/>
              <path d="m21 16-5-5L5 21"/>
            </svg>
            Latest guest photo
          </span>
          <div className="absolute bottom-3 left-4 right-4 text-[#F0E2C2]">
            {caption && (
              <p className="ios-headline text-[14px] leading-snug line-clamp-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                &ldquo;{caption}&rdquo;
              </p>
            )}
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-[11px] text-[#F0E2C2]/75">
                {guest ? `— ${guest}` : ""}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#cdac7d]">
                See album
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-active:translate-x-0.5">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
