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

// Feedback categories shown to guests in the FeedbackButton picker.
// The widget is for stay-feedback (suggestions, compliments, bugs, ideas) \u2014
// NOT for urgent service requests. Those go to the host directly via the
// number in the guest's welcome email.
export const FEEDBACK_CATEGORIES = [
  { value: "property", label: "About the property" },
  { value: "app", label: "About the app" },
  { value: "suggestion", label: "Suggestion" },
  { value: "compliment", label: "Compliment" },
  { value: "other", label: "Something else" },
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

// Full label lookup \u2014 covers both current categories and legacy values
// from the previous service-request flow, so the admin dashboard renders
// old feedback rows correctly.
const ALL_FEEDBACK_LABELS: Record<string, string> = {
  property: "About the property",
  app: "About the app",
  suggestion: "Suggestion",
  compliment: "Compliment",
  other: "Other",
  // Legacy categories from the service-request era:
  firewood: "Firewood (legacy)",
  towels: "Towels (legacy)",
  repair: "Repair (legacy)",
  trash: "Trash (legacy)",
  note: "Note",
};

export function feedbackCategoryLabel(value: string | null): string {
  if (!value) return "Note";
  return ALL_FEEDBACK_LABELS[value] ?? "Note";
}
