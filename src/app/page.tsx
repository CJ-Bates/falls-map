"use client";

import { useState } from "react";
import PropertyMap, { type SelectedItem } from "@/components/PropertyMap";
import DetailPanel from "@/components/DetailPanel";

export default function Home() {
  const [selected, setSelected] = useState<SelectedItem | null>(null);

  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#2A1F18]">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-10 flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-[#1A1310]/95 to-transparent text-[#F0E2C2]">
        <div className="h-9 w-9 rounded-full bg-[#1A1310] border-2 border-[#B89968] grid place-items-center text-xs font-bold">
          F
        </div>
        <div className="flex-1 leading-tight">
          <div className="text-sm font-semibold">The Falls at Lions Den</div>
          <div className="text-[10px] uppercase tracking-wider text-[#B89968]">
            Property map
          </div>
        </div>
      </header>

      <PropertyMap onSelect={setSelected} />
      <DetailPanel item={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
