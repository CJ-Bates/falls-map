"use client";

import { useEffect } from "react";

// Shared behavior for full-screen overlays (lightboxes, modal dialogs):
//   - Escape closes the overlay (desktop / keyboard users)
//   - body scroll is locked while open (prevents iOS background scroll
//     bleeding through and the rubber-band flicker in standalone mode)
export function useOverlayDismiss(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [open, onClose]);
}
