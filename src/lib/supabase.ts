// Supabase client for the guest "Memories" feature.
//
// The publishable key is intentionally hardcoded. Supabase\u2019s new key system
// designates "publishable" keys as safe to ship in the browser \u2014 access is
// gated by the Row-Level Security policies we set on the `memories` table
// and the `memories` storage bucket (anonymous select + insert, no update
// or delete from the browser).

import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://rhhkodqqdjgkrqoqfbxq.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_U9w3oQnTzexgoJ659qh5tg_xJzsh5Fg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
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
//   <id>.jpg         \u2014 the full-resolution original (max 25 MB)
//   <id>-thumb.jpg   \u2014 a 1200px-edge gallery thumbnail
// The DB row only stores the original path; the thumb is derived by
// inserting "-thumb" before ".jpg".
export function thumbPhotoUrl(storagePath: string): string {
  const thumbPath = storagePath.replace(/\.jpg$/i, "-thumb.jpg");
  return publicPhotoUrl(thumbPath);
}

// Feedback categories \u2014 keep in sync with FeedbackButton chips + AdminDashboard.
// `null` (or anything not in this list) is treated as "Note".
export const FEEDBACK_CATEGORIES = [
  { value: "firewood", label: "Firewood" },
  { value: "towels", label: "Towels / linens" },
  { value: "repair", label: "Broken / needs repair" },
  { value: "trash", label: "Trash" },
  { value: "other", label: "Other request" },
  { value: "note", label: "Just a note" },
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]["value"];

export type Feedback = {
  id: string;
  message: string;
  email: string | null;
  page: string | null;
  category: string | null;
  resolved_at: string | null;
  created_at: string;
};

export function feedbackCategoryLabel(value: string | null): string {
  if (!value) return "Note";
  const m = FEEDBACK_CATEGORIES.find((c) => c.value === value);
  return m ? m.label : "Note";
}
