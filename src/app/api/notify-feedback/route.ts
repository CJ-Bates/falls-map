import { NextRequest, NextResponse } from "next/server";

// Proxies feedback notifications to ntfy.sh so CJ gets a push on his phone.
// Topic name is server-side only (NTFY_TOPIC env var) so guests can't see
// it in client-side source. Category goes in the notification title so CJ
// can triage at a glance.

export const runtime = "edge";

type Body = {
  message?: string;
  email?: string | null;
  page?: string | null;
  category?: string | null;
};

const CATEGORY_TITLES: Record<string, string> = {
  firewood: "Firewood request",
  towels: "Towels / linens",
  repair: "Broken — needs repair",
  trash: "Trash",
  other: "Guest request",
  note: "Feedback",
};

export async function POST(req: NextRequest) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) {
    return NextResponse.json({ ok: true, notified: false });
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
        Priority: cat === "repair" ? "high" : "default",
        Tags: cat === "repair" ? "warning,tools" : "speech_balloon",
        Click: "https://app.thefallsatlionsden.com/admin/cj-falls-ops-2026",
        "Content-Type": "text/plain; charset=utf-8",
      },
      body: `${msg}\n\nFrom: ${from}\nPage: ${page}`,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, notified: true });
}
