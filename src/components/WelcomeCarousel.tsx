"use client";

import { useEffect, useState } from "react";

// First-time welcome carousel. Shows a 3-screen intro the first time a guest
// opens the app (no falls-onboarded flag in localStorage). On dismiss, sets
// the flag so they never see it again. Doesn't show in standalone mode
// either — returning guests who installed the PWA already know what's here.

const STORAGE_KEY = "falls-onboarded-v1";

const SLIDES: { title: string; body: string; icon: React.ReactElement }[] = [
  {
    title: "Welcome to The Falls",
    body: "Your guide to 194 acres of cabins, lakes, trails, and quiet woods.",
    icon: (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21l9-18 9 18z" />
        <path d="M7 21l5-10 5 10" />
        <path d="M10 21l2-4 2 4" />
      </svg>
    ),
  },
  {
    title: "Works offline, anywhere",
    body: "Map tiles, trails, and house info are cached on your phone. Use it deep in the woods, no signal needed.",
    icon: (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13a10 10 0 0 1 14 0" />
        <path d="M8.5 16.5a5 5 0 0 1 7 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
        <path d="M2 8.82a15 15 0 0 1 20 0" />
        <path d="M3 3l18 18" stroke="#1A1310" strokeWidth="2.5" />
        <path d="M3 3l18 18" />
      </svg>
    ),
  },
  {
    title: "Share your stay",
    body: "Snap photos and add them to Memories. Tag the spot on the map and your shot will show up there for future guests.",
    icon: (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
];

export default function WelcomeCarousel() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Already onboarded?
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // localStorage blocked (private mode, etc.) — just skip the carousel.
      return;
    }
    // Don't show if launched as installed PWA — returning user.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    if (standalone) {
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      return;
    }
    // Brief delay so it doesn't feel jumpy on page load.
    const t = setTimeout(() => setOpen(true), 350);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setOpen(false);
  };

  const next = () => {
    if (index < SLIDES.length - 1) setIndex(index + 1);
    else dismiss();
  };

  if (!open) return null;
  const slide = SLIDES[index];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 backdrop-blur-lg p-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="ios-glass-strong relative w-full max-w-sm rounded-3xl p-7 text-center text-[#F0E2C2] shadow-[0_18px_44px_rgba(0,0,0,0.55)]">
        <button
          onClick={dismiss}
          aria-label="Skip"
          className="ios-press absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-[#F0E2C2]/10 text-[#F0E2C2]/70"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-[#F0E2C2]/8 border border-[#F0E2C2]/15" aria-hidden>
          {slide.icon}
        </div>

        <h2 className="ios-title text-2xl mb-2">{slide.title}</h2>
        <p className="text-[14px] leading-relaxed text-[#F0E2C2]/80 max-w-[260px] mx-auto">
          {slide.body}
        </p>

        {/* Dot indicators */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={
                "block h-2 rounded-full transition-all " +
                (i === index ? "w-6 bg-[#cdac7d]" : "w-2 bg-[#F0E2C2]/30")
              }
            />
          ))}
        </div>

        <button
          onClick={next}
          className="ios-press mt-6 w-full rounded-2xl bg-[#F0E2C2] text-[#1A1310] font-semibold py-3 shadow-[0_8px_24px_rgba(184,153,104,0.25)]"
        >
          {index < SLIDES.length - 1 ? "Next" : "Let's go"}
        </button>
      </div>
    </div>
  );
}
