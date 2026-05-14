import { NextRequest, NextResponse } from "next/server";

// Proxies feedback notifications to ntfy.sh so the owner gets a push on their phone.
// Topic name is server-side only (NTFY_TOPIC env var) so guests can't see
// it in client-side source. Category goes in the notification title so
// the owner can triage at a glance.

export const runtime = "edge";

// Basic per-IP rate limit. Edge runtime memory is per-region and resets on
// cold start, so this isn\u2019t bulletproof against a determined attacker, but
// it blocks all drive-by spam and accidental form-resubmission storms.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const recentByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const stamps = (recentByIp.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (stamps.length >= RATE_LIMIT_MAX) {
    recentByIp.set(ip, stamps);
    return true;
  }
  stamps.push(now);
  recentByIp.set(ip, stamps);
  // Sweep stale keys periodically to bound memory growth.
  if (recentByIp.size > 5000) {
    for (const [k, v] of recentByIp.entries()) {
      const fresh = v.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (fresh.length === 0) recentByIp.delete(k);
      else recentByIp.set(k, fresh);
    }
  }
  return false;
}

type Body = {
  message?: string;
  email?: string | null;
  page?: string | null;
  category?: string | null;
};

const CATEGORY_TITLES: Record<string, string> = {
  property: "Property feedback",
  app: "App feedback",
  suggestion: "Suggestion",
  compliment: "Compliment",
  other: "Feedback",
  // Legacy categories — still mapped so old rows produce a sensible title:
  firewood: "Firewood (legacy)",
  towels: "Towels (legacy)",
  repair: "Repair (legacy)",
  trash: "Trash (legacy)",
  note: "Feedback",
};

export async function POST(req: NextRequest) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) {
    return NextResponse.json({ ok: true, notified: false });
  }

  // Per-IP rate limit (5 / hour). x-forwarded-for is set by Vercel\u2019s edge.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 },
    );
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const msg = (body.message ?? "").toString().slice(0, 900);
  if (!msg.trim()) {
    return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
  }

  const from = body.email ? body.email : "anonymous";
  const page = body.page ? body.page : "(home)";
  const cat = (body.category ?? "note").toLowerCase();
  const titlePrefix = CATEGORY_TITLES[cat] ?? "Feedback";
  const title = `${titlePrefix} · The Falls`;

  try {
    await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: {
        Title: title,
        Priority: "default",
        Tags: cat === "compliment" ? "sparkles" : "speech_balloon",
        Click: "https://app.thefallsatlionsden.com/admin/falls-ops-2026",
        "Content-Type": "text/plain; charset=utf-8",
      },
      body: `${msg}\n\nFrom: ${from}\nPage: ${page}`,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, notified: true });
}
