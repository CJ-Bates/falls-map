"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  supabase,
  publicPhotoUrl,
  thumbPhotoUrl,
  type Memory,
  type Feedback,
} from "@/lib/supabase";

// Private operator dashboard. Pulls a live snapshot from Supabase: recent
// memories, recent feedback, and quick counts. No analytics yet — those
// require either Vercel Analytics or an events table; if/when CJ wants
// page-view stats we'll wire those in.

type Stats = {
  memoriesTotal: number;
  memoriesWithCaption: number;
  memoriesByCabin: Record<string, number>;
  memoriesByPoi: Record<string, number>;
  memoriesByTrail: Record<string, number>;
  recentMemories: Memory[];
  feedbackTotal: number;
  recentFeedback: Feedback[];
  loading: boolean;
  error: string | null;
};

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    memoriesTotal: 0,
    memoriesWithCaption: 0,
    memoriesByCabin: {},
    memoriesByPoi: {},
    memoriesByTrail: {},
    recentMemories: [],
    feedbackTotal: 0,
    recentFeedback: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Pull memories (capped at 500 for safety — should be plenty for now)
      const memQ = await supabase
        .from("memories")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      const fbQ = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (cancelled) return;

      const memErr = memQ.error?.message;
      const fbErr = fbQ.error?.message;
      const error = memErr || fbErr || null;

      const memories = (memQ.data ?? []) as Memory[];
      const feedback = (fbQ.data ?? []) as Feedback[];

      const byCabin: Record<string, number> = {};
      const byPoi: Record<string, number> = {};
      const byTrail: Record<string, number> = {};
      let withCaption = 0;
      for (const m of memories) {
        if (m.caption) withCaption++;
        if (m.cabin_slug) byCabin[m.cabin_slug] = (byCabin[m.cabin_slug] ?? 0) + 1;
        if (m.poi_slug) byPoi[m.poi_slug] = (byPoi[m.poi_slug] ?? 0) + 1;
        if (m.trail_slug) byTrail[m.trail_slug] = (byTrail[m.trail_slug] ?? 0) + 1;
      }

      setStats({
        memoriesTotal: memories.length,
        memoriesWithCaption: withCaption,
        memoriesByCabin: byCabin,
        memoriesByPoi: byPoi,
        memoriesByTrail: byTrail,
        recentMemories: memories.slice(0, 12),
        feedbackTotal: feedback.length,
        recentFeedback: feedback.slice(0, 20),
        loading: false,
        error,
      });
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="hero-radial min-h-[100svh] w-full pb-16">
      <header className="px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-2 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
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
            <h1 className="ios-title text-2xl text-[#F0E2C2]">Admin</h1>
            <p className="text-[12px] text-[#B89968] mt-0.5">Operator dashboard · private</p>
          </div>
        </div>
      </header>

      <div className="px-6 mx-auto max-w-5xl mt-4 space-y-5 text-[#F0E2C2]">
        {stats.error && (
          <div className="rounded-2xl bg-red-900/30 border border-red-400/30 px-4 py-3 text-[13px] text-red-200">
            {stats.error}
          </div>
        )}

        {/* Quick stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Memories" value={stats.loading ? "…" : stats.memoriesTotal.toString()} />
          <StatCard label="With caption" value={stats.loading ? "…" : stats.memoriesWithCaption.toString()} />
          <StatCard label="Feedback" value={stats.loading ? "…" : stats.feedbackTotal.toString()} />
          <StatCard label="Tagged places" value={stats.loading ? "…" : String(Object.keys(stats.memoriesByCabin).length + Object.keys(stats.memoriesByPoi).length + Object.keys(stats.memoriesByTrail).length)} />
        </section>

        {/* Feedback */}
        <section className="ios-glass rounded-3xl p-5">
          <h2 className="ios-headline text-[16px] text-[#cdac7d] mb-3">
            Recent feedback
          </h2>
          {stats.loading ? (
            <p className="text-[13px] text-[#F0E2C2]/55">Loading…</p>
          ) : stats.recentFeedback.length === 0 ? (
            <p className="text-[13px] text-[#F0E2C2]/55">
              No feedback yet. As soon as a guest taps &ldquo;Send feedback&rdquo; it&apos;ll show up here.
            </p>
          ) : (
            <ul className="space-y-3">
              {stats.recentFeedback.map((f) => (
                <li key={f.id} className="rounded-2xl bg-[#F0E2C2]/5 border border-[#F0E2C2]/10 p-3">
                  <p className="text-[14px] text-[#F0E2C2]/95 leading-relaxed whitespace-pre-wrap">{f.message}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-[#B89968]">
                    <span>{timeAgo(f.created_at)}</span>
                    {f.page && <><span>·</span><span className="text-[#F0E2C2]/55">{f.page}</span></>}
                    {f.email && (
                      <>
                        <span>·</span>
                        <a href={`mailto:${f.email}`} className="text-[#cdac7d] underline">{f.email}</a>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent memories */}
        <section className="ios-glass rounded-3xl p-5">
          <h2 className="ios-headline text-[16px] text-[#cdac7d] mb-3">
            Recent guest photos
          </h2>
          {stats.loading ? (
            <p className="text-[13px] text-[#F0E2C2]/55">Loading…</p>
          ) : stats.recentMemories.length === 0 ? (
            <p className="text-[13px] text-[#F0E2C2]/55">No photos yet.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {stats.recentMemories.map((m) => (
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
          )}
        </section>

        {/* Tag distribution */}
        <section className="ios-glass rounded-3xl p-5">
          <h2 className="ios-headline text-[16px] text-[#cdac7d] mb-3">
            Tagged places (photos)
          </h2>
          {stats.loading ? (
            <p className="text-[13px] text-[#F0E2C2]/55">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TagList title="Cabins" entries={stats.memoriesByCabin} />
              <TagList title="Spots" entries={stats.memoriesByPoi} />
              <TagList title="Trails" entries={stats.memoriesByTrail} />
            </div>
          )}
        </section>

        <p className="text-[10.5px] text-[#F0E2C2]/40 text-center pt-2">
          This page is private. Anyone who knows the URL can see it — don&apos;t share it.
        </p>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="ios-glass rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-[0.14em] text-[#B89968]">{label}</div>
      <div className="ios-title text-3xl text-[#F0E2C2] mt-1">{value}</div>
    </div>
  );
}

function TagList({ title, entries }: { title: string; entries: Record<string, number> }) {
  const sorted = Object.entries(entries).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mb-2">{title}</h3>
      {sorted.length === 0 ? (
        <p className="text-[12px] text-[#F0E2C2]/45">No tags yet</p>
      ) : (
        <ul className="space-y-1">
          {sorted.map(([slug, count]) => (
            <li key={slug} className="flex items-baseline justify-between text-[13px]">
              <span className="text-[#F0E2C2]/85 truncate">{slug}</span>
              <span className="text-[#cdac7d] tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
