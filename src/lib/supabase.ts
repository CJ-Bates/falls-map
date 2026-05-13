// Supabase client for the guest "Memories" feature.
//
// The publishable key is intentionally hardcoded. Supabase's new key system
// designates "publishable" keys as safe to ship in the browser — access is
// gated by the Row-Level Security policies we set on the `memories` table
// and the `memories` storage bucket (anonymous select + insert, no update
// or delete from the browser).

import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://rhhkodqqdjgkrqoqfbxq.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_U9w3oQnTzexgoJ659qh5tg_xJzsh5Fg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // We don't use Supabase Auth — uploads are anonymous, policies are the
    // gatekeeper. Disabling auto-refresh keeps the bundle smaller and
    // avoids hitting Supabase on every page load.
    persistSession: false,
    autoRefreshToken: false,
  },
});

export type Memory = {
  id: string;
  storage_path: string;
  caption: string | null;
  guest_name: string | null;
  poi_slug: string | null;
  cabin_slug: string | null;
  trail_slug: string | null;
  created_at: string;
};

export function publicPhotoUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/memories/${storagePath}`;
}

// Each upload produces TWO files in the bucket:
//   <id>.jpg         — the full-resolution original (max 25 MB)
//   <id>-thumb.jpg   — a 1200px-edge gallery thumbnail
// The DB row only stores the original path; the thumb is derived by
// inserting "-thumb" before ".jpg".
export function thumbPhotoUrl(storagePath: string): string {
  const thumbPath = storagePath.replace(/\.jpg$/i, "-thumb.jpg");
  return publicPhotoUrl(thumbPath);
}

export type Feedback = {
  id: string;
  message: string;
  email: string | null;
  page: string | null;
  created_at: string;
};
