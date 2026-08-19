import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Admin-only analytics rollup. Like /api/admin/feedback, the browser has no
// direct access to the table (RLS denies anon) — everything comes through
// here behind the ADMIN_KEY.
//
// The aggregation runs in JS rather than SQL on purpose: at this property's
// volume (tens to low hundreds of events a day) pulling a window of rows and
// counting them in memory is simpler to reason about and to change later
// than a pile of database views.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${adminKey}`;
}

type Row = {
  created_at: string;
  event: string;
  path: string | null;
  session_id: string | null;
  device: string | null;
  standalone: boolean | null;
  referrer: string | null;
  cabin_slug: string | null;
  visitor_hash: string | null;
  props: Record<string, unknown> | null;
};

function tally<T extends string | null>(rows: Row[], pick: (r: Row) => T) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const v = pick(r);
    if (!v) continue;
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get("days") ?? 30), 1), 365);
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const { data, error } = await supabaseAdmin()
    .from("analytics_events")
    .select("created_at,event,path,session_id,device,standalone,referrer,cabin_slug,visitor_hash,props")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20000);

  if (error) {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }

  const rows = (data ?? []) as Row[];
  const views = rows.filter((r) => r.event === "pageview");

  // Daily series of views + unique visitors, oldest first.
  const byDay = new Map<string, { views: number; visitors: Set<string> }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    byDay.set(d, { views: 0, visitors: new Set() });
  }
  for (const r of views) {
    const d = r.created_at.slice(0, 10);
    const b = byDay.get(d);
    if (!b) continue;
    b.views++;
    if (r.visitor_hash) b.visitors.add(r.visitor_hash);
  }
  const series = [...byDay.entries()].map(([date, b]) => ({
    date,
    views: b.views,
    visitors: b.visitors.size,
  }));

  const uniq = (rs: Row[], key: (r: Row) => string | null) =>
    new Set(rs.map(key).filter(Boolean) as string[]).size;

  const dayAgo = new Date(Date.now() - 86400_000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const viewsToday = views.filter((r) => r.created_at >= dayAgo);
  const viewsWeek = views.filter((r) => r.created_at >= weekAgo);

  // Sessions that saw more than one page — a rough "did they actually explore"
  // signal, more meaningful here than bounce rate.
  const pagesPerSession = new Map<string, number>();
  for (const r of views) {
    if (!r.session_id) continue;
    pagesPerSession.set(r.session_id, (pagesPerSession.get(r.session_id) ?? 0) + 1);
  }
  const multiPage = [...pagesPerSession.values()].filter((n) => n > 1).length;

  return NextResponse.json({
    ok: true,
    days,
    totals: {
      views: views.length,
      visitors: uniq(views, (r) => r.visitor_hash),
      sessions: uniq(views, (r) => r.session_id),
      viewsToday: viewsToday.length,
      visitorsToday: uniq(viewsToday, (r) => r.visitor_hash),
      viewsWeek: viewsWeek.length,
      visitorsWeek: uniq(viewsWeek, (r) => r.visitor_hash),
      installedShare: views.length
        ? Math.round((views.filter((r) => r.standalone).length / views.length) * 100)
        : 0,
      multiPageSessions: multiPage,
      totalSessions: pagesPerSession.size,
    },
    series,
    pages: tally(views, (r) => r.path).slice(0, 20),
    devices: tally(views, (r) => r.device),
    referrers: tally(views, (r) => r.referrer).slice(0, 10),
    cabins: tally(views, (r) => r.cabin_slug),
    events: tally(rows.filter((r) => r.event !== "pageview"), (r) => r.event),
    // Most-tapped things, pulled out of the event props.
    topPois: tally(
      rows.filter((r) => r.event === "poi_open"),
      (r) => (typeof r.props?.slug === "string" ? (r.props.slug as string) : null),
    ).slice(0, 12),
    topTrails: tally(
      rows.filter((r) => r.event === "trail_open"),
      (r) => (typeof r.props?.slug === "string" ? (r.props.slug as string) : null),
    ).slice(0, 12),
  });
}
