"use client";

import { useState } from "react";

// Native-share button. Uses the Web Share API where available (iOS/Android),
// falls back to copying the URL on desktop. Guests tap once -> their phone's
// native share sheet pops, they pick a contact, done.

const SHARE_TITLE = "The Falls at Lions Den";
const SHARE_TEXT =
  "Our guide for the stay — map of trails, cabins, photos, and how to find your way in.";
const SHARE_URL = "https://app.thefallsatlionsden.com";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    // Web Share API (mobile)
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url: SHARE_URL,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard.
      }
    }
    // Clipboard fallback (desktop)
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Last-resort fallback: select prompt.
      window.prompt("Copy this link", SHARE_URL);
    }
  };

  return (
    <button
      onClick={onShare}
      className={
        "ios-press inline-flex items-center gap-2 rounded-full bg-[#F0E2C2]/8 border border-[#F0E2C2]/18 px-3.5 py-2 text-[12px] font-semibold text-[#F0E2C2] transition-colors " +
        (copied ? "bg-[#cdac7d]/25 border-[#cdac7d]/40" : "")
      }
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Link copied
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share with your group
        </>
      )}
    </button>
  );
}
