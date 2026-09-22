import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Keeps the Supabase project from being auto-paused.
//
// Supabase pauses free-tier projects after 7 days with no database activity.
// That happened on 2026-09-22: the guest photo gallery, feedback, analytics
// and the admin dashboard all went down until the project was restored by
// hand, and a paused project becomes UNRECOVERABLE after 90 days.
//
// A daily cron (see vercel.json) hits this route and writes exactly one row,
// which guarantees real database activity — a read might not be enough to
// count, and this is cheap insurance against losing the project.
//
// The row goes into analytics_events with event="keepalive" rather than into
// a table of its own, so no schema change was needed. /api/admin/analytics
// filters those rows out, so they never show up in the usage stats. One row
// a day is ~365/year, which is nothing.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Vercel sends this header on cron invocations when CRON_SECRET is set.
  // If the secret isn't configured the route stays open — it's harmless
  // (one insert, no data returned) and this avoids forcing another env var.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { error } = await supabaseAdmin()
    .from("analytics_events")
    .insert({ event: "keepalive", path: "/api/keepalive" });

  if (error) {
    // Surface failures loudly here (unlike /api/track, which swallows them):
    // a silently broken keep-alive is how the project gets paused again.
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
