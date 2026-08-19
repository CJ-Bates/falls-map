// Tiny client-side analytics helper.
//
// Design notes / privacy posture:
//   - Nothing here identifies a person. No cookies, no localStorage, no
//     advertising IDs, no cross-site anything. The server derives an
//     anonymous visitor hash that rotates every day (see /api/track), so
//     the same guest on two different days is two different hashes.
//   - Payloads are deliberately small and enumerable — an event name, the
//     path, coarse device class, and an optional short label (e.g. which
//     POI was tapped). No free text, no email, no precise geolocation.
//   - Sends use navigator.sendBeacon where available so tracking never
//     blocks navigation or delays a tap. Failures are swallowed: analytics
//     must never break the guest experience.

export type TrackProps = Record<string, string | number | boolean | null | undefined>;

function deviceClass(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  // iPadOS 13+ reports as desktop Safari but has touch points
  if (/Macintosh/.test(ua) && typeof document !== "undefined" && navigator.maxTouchPoints > 1) {
    return "tablet";
  }
  return "desktop";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari legacy flag
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// Per-tab session id. sessionStorage (not localStorage) on purpose: it dies
// when the tab closes, so it groups one visit rather than following a guest
// around for weeks.
function sessionId(): string {
  if (typeof sessionStorage === "undefined") return "nosession";
  try {
    let id = sessionStorage.getItem("falls-sid");
    if (!id) {
      id = Math.random().toString(36).slice(2, 12);
      sessionStorage.setItem("falls-sid", id);
    }
    return id;
  } catch {
    return "nosession";
  }
}

// Referrer host only — never the full URL (which can carry search terms
// or private path info from the referring site).
function referrerHost(): string | null {
  if (typeof document === "undefined" || !document.referrer) return null;
  try {
    const u = new URL(document.referrer);
    if (u.host === window.location.host) return null; // internal navigation
    return u.host.slice(0, 120);
  } catch {
    return null;
  }
}

// If the guest arrived on a cabin welcome page (i.e. scanned a cabin door
// QR), remember which cabin for the rest of the tab session so later events
// can be attributed to that cabin.
function cabinContext(path: string): string | null {
  const m = path.match(/^\/welcome\/([a-z0-9-]+)/i);
  if (m) {
    try {
      sessionStorage.setItem("falls-cabin", m[1]);
    } catch {
      /* ignore */
    }
    return m[1];
  }
  try {
    return sessionStorage.getItem("falls-cabin");
  } catch {
    return null;
  }
}

export function track(event: string, props: TrackProps = {}): void {
  if (typeof window === "undefined") return;
  try {
    const path = window.location.pathname + window.location.search;
    const body = JSON.stringify({
      event: event.slice(0, 60),
      path: path.slice(0, 200),
      session: sessionId(),
      device: deviceClass(),
      standalone: isStandalone(),
      referrer: referrerHost(),
      cabin: cabinContext(window.location.pathname),
      props,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Analytics must never throw into the app.
  }
}

export function trackPageview(): void {
  track("pageview");
}
