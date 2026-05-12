"use client";

import { useEffect, useState } from "react";

// Chrome / Android type for the install prompt event.
type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// Hides itself entirely when the app is already running as an installed
// PWA. On Android / desktop Chrome, taps trigger the real native install
// prompt (one tap, done). On iOS Safari there is no JS API to install —
// Apple requires the user to use the Share menu manually — so we show a
// clear illustrated walkthrough instead.

export default function InstallAppButton() {
  const [installed, setInstalled] = useState(false);
  const [iosInstructions, setIosInstructions] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Detect installed (running in standalone display mode).
    const inStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS legacy flag
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    if (inStandalone) {
      setInstalled(true);
      return;
    }

    // Detect iOS Safari.
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    setIsIos(iOS);

    // Listen for the prompt event (Android / desktop Chrome).
    const onBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // If they install during the session, also hide the button.
    const onInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!mounted || installed) return null;
  // No native prompt available AND not iOS Safari = nothing useful we can
  // show. Common case: desktop Firefox, Brave, etc. Hide gracefully.
  if (!installPrompt && !isIos) return null;

  const handleClick = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setInstallPrompt(null);
      return;
    }
    if (isIos) setIosInstructions(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="ios-press inline-flex items-center gap-2 rounded-full bg-[#F0E2C2]/10 border border-[#F0E2C2]/25 px-3.5 py-2 text-[12px] font-semibold text-[#F0E2C2] backdrop-blur-md"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Install app
      </button>

      {iosInstructions && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-5"
          onClick={() => setIosInstructions(false)}
        >
          <div
            className="ios-glass-strong relative w-full max-w-sm rounded-3xl p-6 text-[#F0E2C2] shadow-[0_18px_44px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIosInstructions(false)}
              aria-label="Close"
              className="ios-press absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-[#F0E2C2]/10 text-[#F0E2C2]/70"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>

            <h2 className="ios-title text-xl">Add to your home screen</h2>
            <p className="text-[13px] text-[#F0E2C2]/70 mt-1">
              iPhone needs three taps to install. Apple doesn&apos;t let us do
              it for you — but it&apos;s easy.
            </p>

            <ol className="mt-5 space-y-4">
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F0E2C2] text-[#1A1310] text-[14px] font-bold flex-shrink-0">1</span>
                <span className="text-[14px] flex items-center gap-2 flex-wrap">
                  Tap the
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#F0E2C2]/12 px-2 py-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#67B0FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v13" />
                      <path d="m7 8 5-5 5 5" />
                      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                    </svg>
                    <span className="text-[12px] font-semibold">Share</span>
                  </span>
                  button at the bottom of Safari
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F0E2C2] text-[#1A1310] text-[14px] font-bold flex-shrink-0">2</span>
                <span className="text-[14px] flex items-center gap-2 flex-wrap">
                  Scroll down, then tap
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#F0E2C2]/12 px-2 py-1 text-[12px] font-semibold">
                    Add to Home Screen
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="4" width="16" height="16" rx="3" />
                      <path d="M12 8v8" /><path d="M8 12h8" />
                    </svg>
                  </span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F0E2C2] text-[#1A1310] text-[14px] font-bold flex-shrink-0">3</span>
                <span className="text-[14px]">
                  Tap <span className="font-semibold">Add</span> in the top right
                </span>
              </li>
            </ol>

            <p className="mt-5 text-[12px] text-[#F0E2C2]/55 text-center">
              The Falls icon appears on your home screen. Tap it any time —
              works without signal too.
            </p>

            <button
              onClick={() => setIosInstructions(false)}
              className="ios-press mt-5 w-full rounded-2xl bg-[#F0E2C2] text-[#1A1310] font-semibold py-3 shadow-[0_8px_24px_rgba(184,153,104,0.25)]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
