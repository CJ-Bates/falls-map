"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase, publicPhotoUrl, type Memory } from "@/lib/supabase";
import { publicCabins } from "@/data/cabins";
import { pois } from "@/data/pois";

type UploadStatus =
  | { state: "idle" }
  | { state: "uploading"; progress: number }
  | { state: "error"; message: string }
  | { state: "done" };

// Pretty-print "2 hours ago"
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

// Place options for the optional "tag a place" dropdown.
const PLACE_OPTIONS: { value: string; label: string; kind: "cabin" | "poi" }[] = [
  ...publicCabins.map((c) => ({ value: `cabin:${c.slug}`, label: c.name, kind: "cabin" as const })),
  ...pois.map((p) => ({ value: `poi:${p.slug}`, label: p.name, kind: "poi" as const })),
];

function placeLabel(memory: Memory): string | null {
  if (memory.cabin_slug) {
    return publicCabins.find((c) => c.slug === memory.cabin_slug)?.name ?? null;
  }
  if (memory.poi_slug) {
    return pois.find((p) => p.slug === memory.poi_slug)?.name ?? null;
  }
  return null;
}

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<Memory | null>(null);

  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ state: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydrate gallery from Supabase
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
    if (f.size > 10 * 1024 * 1024) {
      setUploadStatus({ state: "error", message: "Photo is over 10 MB — pick a smaller one." });
      return;
    }
    setFile(f);
    setUploadStatus({ state: "idle" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploadStatus({ state: "uploading", progress: 0 });

    // Random filename, preserve extension. Keep original mime type.
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("memories")
      .upload(path, file, { cacheControl: "31536000", contentType: file.type });

    if (uploadErr) {
      setUploadStatus({ state: "error", message: uploadErr.message });
      return;
    }

    const cabinSlug = place.startsWith("cabin:") ? place.slice("cabin:".length) : null;
    const poiSlug = place.startsWith("poi:") ? place.slice("poi:".length) : null;

    const { data: row, error: insertErr } = await supabase
      .from("memories")
      .insert({
        storage_path: path,
        caption: caption.trim() || null,
        guest_name: name.trim() || null,
        cabin_slug: cabinSlug,
        poi_slug: poiSlug,
      })
      .select()
      .single();

    if (insertErr) {
      setUploadStatus({ state: "error", message: insertErr.message });
      return;
    }

    // Optimistically prepend
    if (row) setMemories((prev) => [row as Memory, ...prev]);
    setUploadStatus({ state: "done" });
    setFile(null);
    setCaption("");
    // keep name + place — guests often upload several
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTimeout(() => setUploadStatus({ state: "idle" }), 2400);
  };

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
        <form
          onSubmit={submit}
          className="ios-glass rounded-3xl p-4 space-y-3"
        >
          <h2 className="text-[10px] uppercase tracking-[0.14em] text-[#B89968]">Share a photo</h2>

          {/* File picker — styled to look like a tile */}
          <label className="ios-press block w-full cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
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
              {file ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Selected"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
                  <span className="absolute bottom-3 left-4 text-[12px] text-[#F0E2C2]/90 truncate max-w-[80%]">
                    {file.name}
                  </span>
                </>
              ) : (
                <div className="text-[#F0E2C2]/70">
                  <div className="text-[28px]">📷</div>
                  <div className="text-[13px] font-semibold mt-1">Tap to pick a photo</div>
                  <div className="text-[11px] text-[#F0E2C2]/50 mt-0.5">Up to 10 MB</div>
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
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Spots">
              {PLACE_OPTIONS.filter((o) => o.kind === "poi").map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
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
            {memories.map((m) => (
              <button
                key={m.id}
                onClick={() => setLightbox(m)}
                className="ios-press relative overflow-hidden rounded-2xl aspect-square bg-[#2A1F18]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={publicPhotoUrl(m.storage_path)}
                  alt={m.caption ?? "Guest photo"}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
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

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
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
          {(lightbox.caption || lightbox.guest_name || placeLabel(lightbox)) && (
            <div
              className="ios-glass-strong absolute left-1/2 -translate-x-1/2 rounded-2xl px-4 py-3 text-[#F0E2C2] max-w-[90%] text-center"
              style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
              onClick={(e) => e.stopPropagation()}
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
