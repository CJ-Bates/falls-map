import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Anonymous usage analytics intake.
//
// Follows the same posture as /api/feedback: the browser never touches the
// analytics table directly, so RLS can deny anon entirely. Everything is
// validated and written here with the service-role key.
//
// PRIVACY DESIGN — what is and isn't stored:
//   STORED: event name, path, coarse device class (mobile/tablet/desktop),
//           whether the app is installed to the home screen, referrer HOST
//           (not full URL), which cabin QR the session started from, a
//           per-tab session id, and a short anonymous visitor hash.
//   NOT STORED: IP addresses, user agents, precise location, names, emails,
//           or anything a guest typed.
//
// The visitor hash is sha256(dailySalt + ip + userAgent), truncated. The
// salt changes every UTC day, so the same guest produces a different hash
// tomorrow — you can count "how many distinct people used it today" without
// being able to follow anyone across days or work backwards to an IP. This
// is the standard approach used by privacy-first analytics tools.

export const runtime = "nodejs";

// ---- rate limiting -------------------------------------------------------
// Analytics is chattier than feedback, so the ceiling is higher, but it still
// needs a ceiling: without one, a single client could flood the table.
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 60; // events per IP per minute
const recentByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const stamps = (recentByIp.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (stamps.length >= RATE_MAX) {
    recentByIp.set(ip, stamps);
    return true;
  }
  stamps.push(now);
  recentByIp.set(ip, stamps);
  if (recentByIp.size > 5000) {
    for (const [k, v] of recentByIp.entries()) {
      const fresh = v.filter((t) => now - t < RATE_WINDOW_MS);
      if (fresh.length === 0) recentByIp.delete(k);
      else recentByIp.set(k, fresh);
    }
  }
  return false;
}

// ---- bot filtering -------------------------------------------------------
const BOT_RE =
  /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pingdom|uptime|curl|wget|python-requests|axios|phantomjs|puppeteer|playwright/i;

// ---- allowed events ------------------------------------------------------
// An allow-list keeps the table clean and stops anyone who finds the
// endpoint from inventing arbitrary event names to junk it up.
const VALID_EVENTS = new Set([
  "pageview",
  "poi_open",
  "cabin_open",
  "trail_open",
  "photo_view",
  "photo_upload",
  "basemap_change",
  "offline_save",
  "install_app",
  "install_prompt",
  "nearby_open",
  "feedback_open",
  "locate_me",
  "route_start",
  "share",
]);

const VALID_DEVICES = new Set(["mobile", "tablet", "desktop"]);

function visitorHash(ip: string, ua: string): string {
  // Prefer a dedicated salt; fall back to deriving one from the service-role
  // key so this works without CJ having to add another env var. The key is
  // never recoverable from a truncated sha256, and never leaves the server.
  const secret = process.env.ANALYTICS_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback";
  const day = new Date().toISOString().slice(0, 10); // UTC yyyy-mm-dd
  return createHash("sha256").update(`${secret}|${day}|${ip}|${ua}`).digest("hex").slice(0, 24);
}

// Only allow small, scalar props — no nested objects, no long strings.
function sanitizeProps(raw: unknown): Record<string, string | number | boolean> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, string | number | boolean> = {};
  let n = 0;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (n >= 8) break;
    if (v === null || v === undefined) continue;
    const key = k.slice(0, 32);
    if (typeof v === "string") out[key] = v.slice(0, 80);
    else if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
    else if (typeof v === "boolean") out[key] = v;
    else continue;
    n++;
  }
  return Object.keys(out).length ? out : null;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const ua = req.headers.get("user-agent") ?? "";

  // Silently accept-and-drop bots: returning 200 avoids retry storms.
  if (BOT_RE.test(ua)) return NextResponse.json({ ok: true });
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const event = typeof body.event === "string" ? body.event : "";
  if (!VALID_EVENTS.has(event)) {
    return NextResponse.json({ ok: false, error: "unknown_event" }, { status: 400 });
  }

  const deviceRaw = typeof body.device === "string" ? body.device : "";
  const row = {
    event,
    path: typeof body.path === "string" ? body.path.slice(0, 200) : null,
    session_id: typeof body.session === "string" ? body.session.slice(0, 32) : null,
    device: VALID_DEVICES.has(deviceRaw) ? deviceRaw : null,
    standalone: typeof body.standalone === "boolean" ? body.standalone : null,
    referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 120) : null,
    cabin_slug: typeof body.cabin === "string" ? body.cabin.slice(0, 40) : null,
    visitor_hash: visitorHash(ip, ua),
    props: sanitizeProps(body.props),
  };

  const { error } = await supabaseAdmin().from("analytics_events").insert(row);
  if (error) {
    // Never surface DB detail, and never make the client retry — a dropped
    // analytics event is not worth a single degraded guest interaction.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}
