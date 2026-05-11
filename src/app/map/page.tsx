"use client";

import { useState } from "react";
import Link from "next/link";
import PropertyMap, { type SelectedItem } from "@/components/PropertyMap";
import DetailPanel from "@/components/DetailPanel";

export default function MapPage() {
  const [selected, setSelected] = useState<SelectedItem | null>(null);

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#2A1F18]">
      {/* iOS-style floating header */}
      <header
        className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 px-3 pb-2"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <Link
          href="/"
          aria-label="Back to home"
          className="ios-glass-strong ios-press grid h-10 w-10 place-items-center rounded-full text-[#F0E2C2]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <div className="ios-glass-strong flex-1 rounded-full px-4 py-2 leading-tight">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[#B89968]">Property Map</div>
          <div className="font-sketch text-lg text-[#F0E2C2] leading-none mt-0.5">The Falls at Lions Den</div>
        </div>
      </header>

      <PropertyMap onSelect={setSelected} />
      {selected && (
        <button
          aria-label="Close detail panel"
          onClick={() => setSelected(null)}
          className="fixed inset-x-0 top-0 z-[15] cursor-default bg-transparent"
          style={{ height: "45svh" }}
        />
      )}
      <DetailPanel item={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
