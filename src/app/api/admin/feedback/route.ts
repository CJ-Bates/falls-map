import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Admin-only feedback access. The browser never touches the `feedback`
// table directly anymore (RLS denies anon), so guest emails and messages
// are only reachable through this route, gated by the ADMIN_KEY env var.

function authorized(req: NextRequest): boolean {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${adminKey}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin()
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, feedback: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  let body: { id?: unknown; resolved?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : null;
  if (!id || typeof body.resolved !== "boolean") {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }
  const { error } = await supabaseAdmin()
    .from("feedback")
    .update({ resolved_at: body.resolved ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
