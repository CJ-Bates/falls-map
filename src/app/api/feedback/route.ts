import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Guest feedback intake. Replaces the old flow where the browser inserted
// into Supabase directly with the anon key (which required anon INSERT on
// the table and let anyone spam it unbounded) and then pinged
// /api/notify-feedback separately. Now one server call validates,
// rate-limits, inserts with the service-role key, and notifies ntfy —
// so RLS can deny anon access to `feedback` entirely.

// Best-effort per-IP rate limit. Serverless memory is per-instance and
// resets on cold start, so this isn't bulletproof against a determined
// attacker, but it blocks drive-by spam and form-resubmission storms —
// and unlike before, it now actually guards the database insert.
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
  if (recentByIp.size > 5000) {
    for (const [k, v] of recentByIp.entries()) {
      const fresh = v.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (fresh.length === 0) recentByIp.delete(k);
      else recentByIp.set(k, fresh);
    }
  }
  return false;
}

const VALID_CATEGORIES = new Set(["property", "app", "suggestion", "compliment", "other"]);

const CATEGORY_TITLES: Record<string, string> = {
  property: "Property feedback",
  app: "App feedback",
  suggestion: "Suggestion",
  compliment: "Compliment",
  other: "Feedback",
};

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: { message?: unknown; email?: unknown; page?: unknown; category?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "";
  if (!message) {
    return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });
  }
  const emailRaw = typeof body.email === "string" ? body.email.trim().slice(0, 120) : "";
  const email = emailRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : null;
  const page = typeof body.page === "string" ? body.page.slice(0, 200) : null;
  const categoryRaw = typeof body.category === "string" ? body.category.toLowerCase() : "";
  const category = VALID_CATEGORIES.has(categoryRaw) ? categoryRaw : "other";

  const { error } = await supabaseAdmin()
    .from("feedback")
    .insert({ message, email, page, category });
  if (error) {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }

  // Fire-and-forget push to the owner's phone. A notify failure shouldn't
  // fail the submission — the row is already stored.
  const topic = process.env.NTFY_TOPIC;
  if (topic) {
    try {
      await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
        method: "POST",
        headers: {
          Title: `${CATEGORY_TITLES[category] ?? "Feedback"} · The Falls`,
          Priority: "default",
          Tags: category === "compliment" ? "sparkles" : "speech_balloon",
          // Deliberately no admin-dashboard link here: the admin URL is a
          // secret and shouldn't ride along in notification payloads.
          "Content-Type": "text/plain; charset=utf-8",
        },
        body: `${message}\n\nFrom: ${email ?? "anonymous"}\nPage: ${page ?? "(home)"}`,
      });
    } catch {
      // ignore — feedback is saved either way
    }
  }

  return NextResponse.json({ ok: true });
}
