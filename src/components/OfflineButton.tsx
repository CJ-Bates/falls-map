"use client";

import { useState } from "react";
import type { OfflineStatus, PrefetchProgress } from "@/lib/offlineTiles";

// Floating "Save for offline" button on the right edge of the map.
// Its own button + popover, separate from the Layers stack so guests can
// reach the most important pre-trip action in one tap.

type Props = {
  offlineStatus: OfflineStatus | null;
  downloading: PrefetchProgress | null;
  onDownload: () => void;
  hidden?: boolean;
};

function formatAgo(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function OfflineButton({ offlineStatus, downloading, onDownload, hidden }: Props) {
  const [open, setOpen] = useState(false);
  if (hidden) return null;

  const hasOffline = !!offlineStatus;
  const progressPct = downloading
    ? downloading.total === 0
      ? 0.08
      : downloading.done / downloading.total
    : null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Save map for offline use"
        aria-expanded={open}
        className={
          "ios-press absolute z-10 grid h-12 w-12 place-items-center rounded-full transition-colors " +
          (open
            ? "bg-[#F0E2C2] text-[#1A1310] shadow-[0_8px_24px_rgba(184,153,104,0.45)]"
            : "ios-glass-strong text-[#F0E2C2]")
        }
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 9rem)", right: "1rem" }}
      >
        <span className="relative grid place-items-center h-full w-full">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {hasOffline && !downloading && (
            <span
              className="absolute -top-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-[#7d8f5a] text-[#0e0a08]"
              aria-hidden
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
          )}
          {downloading && (
            <span
              className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-[#cdac7d] border-t-transparent animate-spin"
              aria-hidden
            />
          )}
        </span>
      </button>

      {open && (
        <>
          <button
            aria-label="Close offline panel"
            onClick={() => setOpen(false)}
            className="absolute inset-0 z-[11] cursor-default bg-transparent"
          />
          <div
            className="ios-glass-strong animate-pop-up absolute z-[12] rounded-3xl text-[#F0E2C2] shadow-[0_18px_44px_rgba(0,0,0,0.45)]"
            style={{
              right: "1rem",
              bottom: "calc(env(safe-area-inset-bottom, 0px) + 12.25rem)",
              width: "min(320px, calc(100vw - 2rem))",
              padding: "16px 16px 14px 16px",
              transformOrigin: "bottom right",
            }}
            role="dialog"
            aria-label="Offline map"
          >
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="ios-headline text-[15px] text-[#F0E2C2]">Offline map</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="ios-press text-[11px] uppercase tracking-[0.14em] text-[#B89968]"
              >
                Close
              </button>
            </div>

            {downloading ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[12px] text-[#F0E2C2]/85 leading-none">
                  <span>Downloading tiles…</span>
                  <span>
                    {downloading.total === 0
                      ? "preparing"
                      : `${Math.round((downloading.done / downloading.total) * 100)}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F0E2C2]/15">
                  <div
                    className="h-full bg-[#F0E2C2]"
                    style={{
                      width: `${Math.max(0.08, progressPct ?? 0) * 100}%`,
                      transition: "width 120ms linear",
                    }}
                  />
                </div>
                <p className="text-[11px] text-[#F0E2C2]/55 leading-snug">
                  Keep this screen open while it finishes. You can close the popover; the download keeps going.
                </p>
              </div>
            ) : (
              <>
                <p className="text-[13px] text-[#F0E2C2]/85 leading-relaxed mb-3">
                  {hasOffline
                    ? `Saved on this phone${offlineStatus ? ` ${formatAgo(offlineStatus.cachedAt)}` : ""}. The whole property's map works without cell signal.`
                    : "Download every map tile for the property so the app works without cell signal anywhere on the land. About 5–15 MB."}
                </p>
                <button
                  onClick={onDownload}
                  className="ios-press w-full rounded-2xl bg-[#F0E2C2] text-[#1A1310] font-semibold py-3 shadow-[0_8px_24px_rgba(184,153,104,0.25)]"
                >
                  {hasOffline ? "Refresh offline tiles" : "Save for offline"}
                </button>
                {hasOffline && offlineStatus?.totalTiles && (
                  <p className="mt-2 text-[11px] text-[#F0E2C2]/55 text-center">
                    {offlineStatus.totalTiles.toLocaleString()} tiles cached
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
