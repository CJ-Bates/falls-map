"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  supabase,
  publicPhotoUrl,
  thumbPhotoUrl,
  feedbackCategoryLabel,
  type Memory,
  type Feedback,
} from "@/lib/supabase";

// Private operator dashboard. Pulls a live snapshot from Supabase: recent
// memories, recent feedback (open + resolved), and quick counts. Plus
// printable QR codes for each cabin door.

type Stats = {
  memoriesTotal: number;
  memoriesWithCaption: number;
  memoriesByCabin: Record<string, number>;
  memoriesByPoi: Record<string, number>;
  memoriesByTrail: Record<string, number>;
  recentMemories: Memory[];
  feedbackTotal: number;
  feedbackOpen: Feedback[];
  feedbackResolved: Feedback[];
  loading: boolean;
  error: string | null;
};

const CABINS = [
  { slug: "main", name: "Main App (home)" },
  { slug: "cabin-1", name: "Ridge Cabin 1" },
  { slug: "cabin-2", name: "Ridge Cabin 2" },
  { slug: "cabin-3a", name: "Ridge Cabin 3A" },
  { slug: "cabin-3b", name: "Ridge Cabin 3B" },
  { slug: "cabin-5", name: "Ridge Cabin 5" },
];

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
    feedbackOpen: [],
    feedbackResolved: [],
    loading: true,
    error: null,
  });
  const [showResolved, setShowResolved] = useState(false);

  const load = async () => {
    const memQ = await supabase
      .from("memories")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    const fbQ = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

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
      feedbackOpen: feedback.filter((f) => !f.resolved_at),
      feedbackResolved: feedback.filter((f) => !!f.resolved_at),
      loading: false,
      error,
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markResolved = async (id: string) => {
    // Optimistic update
    setStats((s) => ({
      ...s,
      feedbackOpen: s.feedbackOpen.filter((f) => f.id !== id),
      feedbackResolved: [
        { ...(s.feedbackOpen.find((f) => f.id === id) as Feedback), resolved_at: new Date().toISOString() },
        ...s.feedbackResolved,
      ],
    }));
    const { error } = await supabase
      .from("feedback")
      .update({ resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      // Reload to recover from inconsistent state
      void load();
    }
  };

  const reopen = async (id: string) => {
    setStats((s) => ({
      ...s,
      feedbackResolved: s.feedbackResolved.filter((f) => f.id !== id),
      feedbackOpen: [
        { ...(s.feedbackResolved.find((f) => f.id === id) as Feedback), resolved_at: null },
        ...s.feedbackOpen,
      ],
    }));
    const { error } = await supabase
      .from("feedback")
      .update({ resolved_at: null })
      .eq("id", id);
    if (error) void load();
  };

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
          <StatCard label="Open requests" value={stats.loading ? "…" : stats.feedbackOpen.length.toString()} accent={stats.feedbackOpen.length > 0} />
          <StatCard label="Resolved" value={stats.loading ? "…" : stats.feedbackResolved.length.toString()} />
        </section>

        {/* Feedback */}
        <section className="ios-glass rounded-3xl p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="ios-headline text-[16px] text-[#cdac7d]">
              Open requests &amp; notes
            </h2>
            {stats.feedbackResolved.length > 0 && (
              <button
                onClick={() => setShowResolved((v) => !v)}
                className="ios-press text-[11px] font-semibold text-[#F0E2C2]/60 hover:text-[#F0E2C2]/90"
              >
                {showResolved ? "Hide" : "Show"} resolved ({stats.feedbackResolved.length})
              </button>
            )}
          </div>
          {stats.loading ? (
            <p className="text-[13px] text-[#F0E2C2]/55">Loading…</p>
          ) : stats.feedbackOpen.length === 0 && !showResolved ? (
            <p className="text-[13px] text-[#F0E2C2]/55">
              Nothing open. Resolved items: {stats.feedbackResolved.length}.
            </p>
          ) : (
            <ul className="space-y-3">
              {stats.feedbackOpen.map((f) => (
                <FeedbackItem key={f.id} f={f} onResolve={() => markResolved(f.id)} />
              ))}
              {showResolved && stats.feedbackResolved.map((f) => (
                <FeedbackItem key={f.id} f={f} resolved onReopen={() => reopen(f.id)} />
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

        {/* QR codes section */}
        <section className="ios-glass rounded-3xl p-5">
          <h2 className="ios-headline text-[16px] text-[#cdac7d] mb-1">
            Cabin door QR codes
          </h2>
          <p className="text-[12px] text-[#F0E2C2]/60 mb-3 leading-snug">
            Print and stick on each cabin door. Guests scan and land directly on their cabin&apos;s wi-fi + welcome page.
            Use the printable sheet for all five at once, or grab them individually below.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <a
              href="/qr/sheet.png"
              target="_blank"
              rel="noopener noreferrer"
              download="falls-cabin-qrs.png"
              className="ios-press inline-flex items-center gap-2 rounded-full bg-[#F0E2C2] text-[#1A1310] px-3.5 py-2 text-[12px] font-semibold"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download printable sheet
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {CABINS.map((c) => (
              <div key={c.slug} className="rounded-2xl bg-[#F0E2C2] p-3 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/qr/${c.slug}.png`}
                  alt={`QR for ${c.name}`}
                  className="block w-full aspect-square rounded-lg"
                />
                <div className="mt-2 text-[12px] font-semibold text-[#1A1310]">{c.name}</div>
                <div className="text-[10px] text-[#6B4423] truncate">{c.slug === "main" ? "/" : `/welcome/${c.slug}`}</div>
              </div>
            ))}
          </div>
        </section>

        <p className="text-[10.5px] text-[#F0E2C2]/40 text-center pt-2">
          This page is private. Anyone who knows the URL can see it &mdash; don&apos;t share it.
        </p>
      </div>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={"ios-glass rounded-2xl p-4 " + (accent ? "ring-1 ring-[#cdac7d]/60" : "")}>
      <div className="text-[10px] uppercase tracking-[0.14em] text-[#B89968]">{label}</div>
      <div className={"ios-title text-3xl mt-1 " + (accent ? "text-[#F0E2C2]" : "text-[#F0E2C2]")}>{value}</div>
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

function FeedbackItem({
  f,
  resolved,
  onResolve,
  onReopen,
}: {
  f: Feedback;
  resolved?: boolean;
  onResolve?: () => void;
  onReopen?: () => void;
}) {
  const label = feedbackCategoryLabel(f.category);
  return (
    <li className={"rounded-2xl border p-3 " + (resolved ? "bg-[#F0E2C2]/3 border-[#F0E2C2]/5 opacity-65" : "bg-[#F0E2C2]/5 border-[#F0E2C2]/10")}>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#cdac7d]/15 border border-[#cdac7d]/30 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#cdac7d]">
          {label}
        </span>
        {!resolved && onResolve && (
          <button
            onClick={onResolve}
            className="ios-press inline-flex items-center gap-1 rounded-full bg-[#7d8f5a]/20 hover:bg-[#7d8f5a]/30 border border-[#7d8f5a]/40 px-2.5 py-1 text-[11px] font-semibold text-[#cae2a3]"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
            Mark resolved
          </button>
        )}
        {resolved && onReopen && (
          <button
            onClick={onReopen}
            className="ios-press text-[11px] font-semibold text-[#F0E2C2]/55 hover:text-[#F0E2C2]/90"
          >
            Reopen
          </button>
        )}
      </div>
      <p className={"text-[14px] leading-relaxed whitespace-pre-wrap " + (resolved ? "text-[#F0E2C2]/60 line-through" : "text-[#F0E2C2]/95")}>{f.message}</p>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-[#B89968]">
        <span>{timeAgo(f.created_at)}</span>
        {f.page && <><span>·</span><span className="text-[#F0E2C2]/55">{f.page}</span></>}
        {f.email && (
          <>
            <span>·</span>
            <a href={`mailto:${f.email}`} className="text-[#cdac7d] underline">{f.email}</a>
          </>
        )}
        {resolved && f.resolved_at && (
          <>
            <span>·</span>
            <span className="text-[#cae2a3]/70">resolved {timeAgo(f.resolved_at)}</span>
          </>
        )}
      </div>
    </li>
  );
}
