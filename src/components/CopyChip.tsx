"use client";

import { useState } from "react";

// Small "tap to copy" chip for showing Wi-Fi passwords, door codes, etc.
// Copies to clipboard on tap, then briefly shows "Copied" feedback.

export default function CopyChip({
  text,
  mono = false,
  big = false,
}: {
  text: string;
  mono?: boolean;
  big?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Fallback for older browsers / non-https contexts: select the text
      // so the user can copy manually.
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      } catch {}
      document.body.removeChild(el);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`ios-press inline-flex items-center gap-2 rounded-xl bg-[#F0E2C2]/10 border border-[#F0E2C2]/20 px-3 py-2 text-[#F0E2C2] transition ${
        copied ? "bg-[#cdac7d]/25 border-[#cdac7d]/40" : ""
      }`}
      aria-label={`Copy ${text}`}
    >
      <span className={`${big ? "text-[20px]" : "text-[14px]"} ${mono ? "font-mono tracking-wider" : "font-semibold"}`}>
        {text}
      </span>
      <span className="text-[#cdac7d]" aria-hidden>
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </span>
      <span className="sr-only">{copied ? "Copied" : "Tap to copy"}</span>
    </button>
  );
}
