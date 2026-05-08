"use client";

import Image from "next/image";
import { categoryStyle } from "@/data/pois";
import type { SelectedItem } from "./PropertyMap";

type Props = {
  item: SelectedItem | null;
  onClose: () => void;
};

export default function DetailPanel({ item, onClose }: Props) {
  if (!item) return null;

  const style =
    item.kind === "cabin"
      ? categoryStyle.cabin
      : categoryStyle[item.data.category];

  const subtitle =
    item.kind === "cabin"
      ? `${item.data.bedrooms} BR · ${item.data.bathrooms} BA`
      : style?.label ?? "Location";

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 max-h-[70vh] overflow-y-auto rounded-t-3xl bg-[#1A1310] text-[#F0E2C2] shadow-[0_-8px_32px_rgba(0,0,0,0.5)] border-t-4 border-[#B89968] animate-slide-up">
      <div className="sticky top-0 flex items-center gap-3 border-b border-[#B89968]/30 bg-[#1A1310] px-5 py-4">
        <div
          className="h-10 w-10 rounded-full grid place-items-center text-xl border border-[#B89968]"
          style={{ background: style?.color ?? "#7A5A2F" }}
        >
          {style?.emoji ?? "📍"}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-lg leading-tight truncate">
            {item.data.name}
          </h2>
          <p className="text-xs text-[#B89968] uppercase tracking-wide">
            {subtitle}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-[#F0E2C2]/70 hover:text-[#F0E2C2] text-2xl leading-none w-8 h-8 grid place-items-center"
        >
          ×
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {item.kind === "cabin" && (
          <>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#2A1F18]">
              <Image
                src={item.data.coverPhoto}
                alt={item.data.name}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-cover"
                unoptimized
              />
            </div>
            <p className="text-sm leading-relaxed">{item.data.description}</p>
            {item.data.amenities.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wide text-[#B89968] mb-2">
                  Amenities
                </h3>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  {item.data.amenities.map((a) => (
                    <li key={a} className="flex items-start gap-2">
                      <span className="text-[#B89968] mt-0.5">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {item.data.bookingUrl && (
              <a
                href={item.data.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center rounded-xl bg-[#B89968] text-[#1A1310] font-semibold py-3 hover:bg-[#cdac7d] transition"
              >
                Book direct
              </a>
            )}
          </>
        )}

        {item.kind === "poi" && (
          <p className="text-sm leading-relaxed">{item.data.description}</p>
        )}

        <div className="pt-2 text-xs text-[#B89968]/70 border-t border-[#B89968]/20">
          {item.data.lat.toFixed(5)}°N, {Math.abs(item.data.lng).toFixed(5)}°W
        </div>
      </div>
    </div>
  );
}
