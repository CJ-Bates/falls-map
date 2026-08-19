"use client";

import { useEffect, useState } from "react";

// Usage analytics for the admin dashboard. Reads the rollup from
// /api/admin/analytics (ADMIN_KEY-gated) — the browser has no direct access
// to the analytics table.

type Series = { date: string; views: number; visitors: number };
type Pair = [string, number];

type Payload = {
  ok: true;
  days: number;
  totals: {
    views: number; visitors: number; sessions: number;
    viewsToday: number; visitorsToday: number;
    viewsWeek: number; visitorsWeek: number;
    installedShare: number;
    multiPageSessions: number; totalSessions: number;
  };
  series: Series[];
  pages: Pair[];
  devices: Pair[];
  referrers: Pair[];
  cabins: Pair[];
  events: Pair[];
  topPois: Pair[];
  topTrails: Pair[];
};

const RANGES = [7, 30, 90] as const;

const PRETTY_EVENT: Record<string, string> = {
  poi_open: "Opened a spot",
  cabin_open: "Opened a cabin",
  trail_open: "Opened a trail",
  photo_view: "Viewed a photo",
  photo_upload: "Uploaded a photo",
  basemap_change: "Switched map style",
  offline_save: "Saved map offline",
  install_prompt: "Tapped install",
  feedback_open: "Opened feedback",
  nearby_open: "Opened a nearby spot",
  locate_me: "Used locate-me",
  route_start: "Started a route",
  share: "Shared a link",
};

export default function AnalyticsPanel({ adminKey }: { adminKey: string }) {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`, {
      headers: { Authorization: `Bearer ${adminKey}` },
    })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j?.ok) { setData(j as Payload); setErr(null); }
        else setErr("Couldn't load analytics.");
      })
      .catch(() => { if (!cancelled) setErr("Couldn't load analytics."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days, adminKey]);

  const peak = data ? Math.max(1, ...data.series.map((d) => d.views)) : 1;

  return (
    <section className="ios-glass rounded-3xl p-5">
      <div className="flex items-baseline justify-between mb-1 gap-3 flex-wrap">
        <h2 className="ios-headline text-[16px] text-[#cdac7d]">App usage</h2>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={
                "ios-press rounded-full px-3 py-1 text-[11px] font-semibold " +
                (days === r
                  ? "bg-[#cdac7d] text-[#1A1310]"
                  : "bg-[#F0E2C2]/10 text-[#F0E2C2]/70")
              }
            >
              {r}d
            </button>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-[#F0E2C2]/45 mb-4">
        Anonymous — no cookies, no IP addresses stored, and visitor IDs reset every day.
      </p>

      {loading && <div className="text-[13px] text-[#F0E2C2]/55 py-4">Loading…</div>}
      {err && <div className="text-[13px] text-red-200 py-2">{err}</div>}

      {data && !loading && (
        <div className="space-y-5">
          {/* headline numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Mini label="Visitors today" value={data.totals.visitorsToday} />
            <Mini label="Visitors this week" value={data.totals.visitorsWeek} />
            <Mini label={`Visitors · ${days}d`} value={data.totals.visitors} />
            <Mini label={`Page views · ${days}d`} value={data.totals.views} />
          </div>

          {data.totals.views === 0 ? (
            <p className="text-[13px] text-[#F0E2C2]/55">
              No usage recorded yet in this window. Data starts collecting once the
              analytics update is deployed and a guest opens the app.
            </p>
          ) : (
            <>
              {/* daily bar chart */}
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-[#F0E2C2]/50 mb-2">
                  Page views per day
                </div>
                <div className="flex items-end gap-[2px] h-24">
                  {data.series.map((d) => (
                    <div
                      key={d.date}
                      title={`${d.date}: ${d.views} views, ${d.visitors} visitors`}
                      className="flex-1 rounded-t-[2px] bg-[#cdac7d]/70 hover:bg-[#cdac7d] transition-colors"
                      style={{ height: `${Math.max(2, (d.views / peak) * 100)}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-[#F0E2C2]/40 mt-1">
                  <span>{data.series[0]?.date.slice(5)}</span>
                  <span>{data.series[data.series.length - 1]?.date.slice(5)}</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <Bars title="Most-visited pages" rows={data.pages} labelFn={prettyPath} />
                <Bars title="What guests tapped" rows={data.events} labelFn={(e) => PRETTY_EVENT[e] ?? e} />
                <Bars title="Most-opened spots" rows={data.topPois} />
                <Bars title="Most-opened trails" rows={data.topTrails} />
                <Bars title="Devices" rows={data.devices} />
                <Bars title="Arrived from" rows={data.referrers} empty="Direct / QR only" />
                <Bars title="Cabin QR sessions" rows={data.cabins} labelFn={prettyCabin} empty="No cabin-QR sessions yet" />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.12em] text-[#F0E2C2]/50 mb-2">
                    Engagement
                  </div>
                  <dl className="space-y-1.5 text-[13px]">
                    <Row k="Sessions" v={data.totals.totalSessions} />
                    <Row k="Explored past one page" v={data.totals.multiPageSessions} />
                    <Row k="Installed to home screen" v={`${data.totals.installedShare}% of views`} />
                  </dl>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function prettyPath(p: string): string {
  const base = p.split("?")[0];
  if (base === "/") return "Home";
  const m = base.match(/^\/welcome\/(.+)$/);
  if (m) return `Welcome · ${prettyCabin(m[1])}`;
  return base.replace(/^\//, "").replace(/\//g, " › ");
}

function prettyCabin(slug: string): string {
  const m = slug.match(/^cabin-(.+)$/);
  return m ? `Cabin ${m[1].toUpperCase()}` : slug;
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#F0E2C2]/8 px-3 py-3">
      <div className="text-[22px] font-semibold text-[#F0E2C2] tabular-nums leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.1em] text-[#F0E2C2]/50 mt-1.5">{label}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[#F0E2C2]/70">{k}</dt>
      <dd className="text-[#cdac7d] tabular-nums font-semibold">{v}</dd>
    </div>
  );
}

function Bars({
  title, rows, labelFn, empty,
}: {
  title: string;
  rows: Pair[];
  labelFn?: (s: string) => string;
  empty?: string;
}) {
  if (!rows.length) {
    return (
      <div>
        <div className="text-[11px] uppercase tracking-[0.12em] text-[#F0E2C2]/50 mb-2">{title}</div>
        <p className="text-[12px] text-[#F0E2C2]/40">{empty ?? "Nothing yet"}</p>
      </div>
    );
  }
  const max = Math.max(...rows.map((r) => r[1]));
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-[#F0E2C2]/50 mb-2">{title}</div>
      <ul className="space-y-1.5">
        {rows.map(([k, n]) => (
          <li key={k} className="relative">
            <div
              className="absolute inset-y-0 left-0 rounded-md bg-[#cdac7d]/18"
              style={{ width: `${(n / max) * 100}%` }}
            />
            <div className="relative flex items-baseline justify-between gap-3 px-2 py-1">
              <span className="text-[12.5px] text-[#F0E2C2]/85 truncate">
                {labelFn ? labelFn(k) : k}
              </span>
              <span className="text-[12.5px] text-[#cdac7d] tabular-nums font-semibold">{n}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
