"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Persistent bottom tab bar — fixes the "every Back button goes Home"
// dead-end by making the four main destinations one tap from anywhere.
// Hidden on /map (immersive full-screen with its own controls) and /admin.

const TABS: { href: string; label: string; icon: React.ReactElement }[] = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11 12 3l9 8" />
        <path d="M5 11v9h14v-9" />
      </svg>
    ),
  },
  {
    href: "/map",
    label: "Map",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
        <path d="M9 3v15" />
        <path d="M15 6v15" />
      </svg>
    ),
  },
  {
    href: "/manual",
    label: "Manual",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
  },
  {
    href: "/memories",
    label: "Photos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-4.35-4.35a1.5 1.5 0 0 0-2.12 0L6 19" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/map") || pathname.startsWith("/admin")) return null;

  return (
    <>
      {/* Spacer keeps page content clear of the fixed bar. */}
      <div aria-hidden className="h-[calc(env(safe-area-inset-bottom,0px)+3.75rem)]" />
      <nav
        aria-label="Main"
        className="ios-glass-strong fixed inset-x-0 bottom-0 z-[60] pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="mx-auto grid h-[3.75rem] max-w-md grid-cols-4">
          {TABS.map((t) => {
            const active =
              t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={
                  "ios-press flex flex-col items-center justify-center gap-0.5 " +
                  (active ? "text-[#cdac7d]" : "text-[#F0E2C2]/60")
                }
              >
                <span className="h-[22px] w-[22px]">{t.icon}</span>
                <span className="text-[10px] font-semibold tracking-wide">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
