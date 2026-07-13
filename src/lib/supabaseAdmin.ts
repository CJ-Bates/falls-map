// Server-only Supabase client using the service-role key. NEVER import this
// from a client component — the service-role key bypasses Row-Level Security.
// The key lives in the SUPABASE_SERVICE_ROLE_KEY env var (Vercel project
// settings + .env.local for local dev); it is not in the repo.

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./supabase";

export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — add it to Vercel env vars (and .env.local for local dev).",
    );
  }
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
