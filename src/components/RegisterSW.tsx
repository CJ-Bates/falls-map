"use client";
import { useEffect, useState } from "react";

/**
 * Registers the service worker and shows a one-tap "Update available" toast
 * when a new version takes over.
 *
 * Why: sw.js serves the app shell cached-first, so after a deploy the first
 * open still runs the previous build and only the *next* open gets the new
 * one. That's fine for guests on the property with no signal, but it meant
 * every change we shipped needed "close it and open it twice" to see. Now
 * the new worker activates (it calls skipWaiting), we notice the controller
 * change, and offer a reload instead of silently waiting for the next visit.
 */
export default function RegisterSW() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let hadController = !!navigator.serviceWorker.controller;

    const onControllerChange = () => {
      // First-ever install also fires this; only prompt when we were already
      // controlled by an older worker (i.e. this is a real update).
      if (hadController) setUpdateReady(true);
      hadController = true;
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for a newer sw.js whenever the app comes back to the
          // foreground — PWAs on the home screen can stay open for days.
          const check = () => { reg.update().catch(() => { /* offline — fine */ }); };
          document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") check();
          });
        })
        .catch(() => { /* silent */ });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  if (!updateReady) return null;

  return (
    <div
      role="status"
      className="fixed left-1/2 -translate-x-1/2 z-[80] animate-slide-up"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}
    >
      <button
        onClick={() => window.location.reload()}
        className="ios-glass-strong ios-press rounded-full pl-4 pr-3 py-2.5 flex items-center gap-3 text-[#F0E2C2] shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
      >
        <span className="text-[13px] font-semibold leading-none">Map updated</span>
        <span className="text-[12px] leading-none rounded-full bg-[#F0E2C2] text-[#2A1F18] px-2.5 py-1.5 font-semibold">
          Refresh
        </span>
      </button>
    </div>
  );
}
