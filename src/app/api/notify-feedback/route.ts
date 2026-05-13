import { NextRequest, NextResponse } from "next/server";

// Proxies feedback notifications to ntfy.sh so CJ gets a push on his phone.
// The topic name is server-side only (Vercel env var NTFY_TOPIC) so guests
// can't see it in client-side source.
//
// Setup:
//   1. Vercel -> Project -> Settings -> Environment Variables
//      Add NTFY_TOPIC = some-long-random-string  (e.g. falls-fb-7k3n9x2p)
//   2. Install ntfy.sh app on phone, subscribe to that exact topic
//   3. Test from /admin or by sending feedback

export const runtime = "edge";

type Body = {
  message?: string;
  email?: string | null;
  page?: string | null;
};

export async function POST(req: NextRequest) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) {
    // Not configured — silently succeed so the client UX still feels good.
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

  try {
    await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: {
        Title: "Feedback \u00b7 The Falls",
        Priority: "default",
        Tags: "speech_balloon",
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
