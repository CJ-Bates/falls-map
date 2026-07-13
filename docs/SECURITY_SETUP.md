# Security setup — feedback lockdown (July 2026)

The feedback flow moved server-side. The browser no longer talks to the
`feedback` table at all, which means anonymous Supabase access to it can be
revoked. **Do these steps in order — the code must deploy before the RLS
lockdown, or the live (old) app breaks.**

## 1. Add env vars in Vercel (before deploying this code)

Vercel → falls-map project → Settings → Environment Variables (all environments):

| Name | Value |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API keys → `service_role` secret. Server-only; never expose in the browser. |
| `ADMIN_KEY` | Pick a fresh secret slug for the admin URL (do NOT reuse `falls-ops-2026` — it was hardcoded in the repo and embedded in old ntfy notifications). Something like `falls-ops-<random>`. |

The admin dashboard's new URL becomes `https://app.thefallsatlionsden.com/admin/<ADMIN_KEY>`.
Update any bookmarks. Rotating access is now just changing the env var and redeploying.

For local dev, copy `.env.local.example` to `.env.local` and fill in the same values.

## 2. Deploy this code (push to main)

## 3. Lock down RLS in Supabase (after the deploy is live)

Supabase dashboard → SQL Editor, first inspect what exists:

```sql
select policyname, cmd, roles
from pg_policies
where tablename = 'feedback';
```

Then drop every policy that grants `anon` (or `public`) anything on
`feedback` — SELECT, INSERT, and UPDATE alike:

```sql
drop policy if exists "<each policy name from the query above>" on public.feedback;
```

Keep RLS **enabled** on the table with no anon policies. The server routes
use the service-role key, which bypasses RLS, so the app keeps working.

Verify from a private browser window (no login): the old admin URL
`/admin/falls-ops-2026` should 404, and this should return an error in the
browser console rather than rows:

```js
fetch("https://rhhkodqqdjgkrqoqfbxq.supabase.co/rest/v1/feedback?select=*", {
  headers: { apikey: "sb_publishable_U9w3oQnTzexgoJ659qh5tg_xJzsh5Fg" },
}).then(r => r.json()).then(console.log)
```

## What changed in the code

- `POST /api/feedback` — guest submissions: validates, rate-limits per IP,
  inserts with the service-role key, sends the ntfy push (admin URL removed
  from the notification payload).
- `GET/PATCH /api/admin/feedback` — dashboard reads + resolve/reopen, gated
  by `Authorization: Bearer <ADMIN_KEY>`.
- `/admin/[key]` — compared server-side against the `ADMIN_KEY` env var;
  no longer hardcoded or baked into the static build.
- `memories` table/bucket policies are unchanged — the photo wall is public
  content and still uses the publishable key. (Known accepted risk: anyone
  with the publishable key can upload photos; the app has no delete UI, so
  abuse cleanup is via the Supabase dashboard. A server-side upload gate is
  a possible future hardening step.)
