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
    <div
      className="ios-glass-strong animate-slide-up fixed inset-x-0 bottom-0 z-20 max-h-[78svh] overflow-y-auto rounded-t-[28px] text-[#F0E2C2] shadow-[0_-12px_40px_rgba(0,0,0,0.55)]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
    >
      {/* iOS sheet drag handle */}
      <div className="sticky top-0 z-10 bg-transparent pt-2 pb-1">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-[#F0E2C2]/30" />
      </div>

      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#B89968]/15">
        <div
          className="h-10 w-10 rounded-full grid place-items-center text-xl border border-[#B89968]"
          style={{ background: style?.color ?? "#7A5A2F" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0E2C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* Same icon as on the pin — fall back gracefully */}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="ios-headline truncate text-[18px] leading-tight">
            {item.data.name}
          </h2>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#B89968] mt-0.5">
            {subtitle}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="ios-press grid h-9 w-9 place-items-center rounded-full bg-[#F0E2C2]/10 text-[#F0E2C2]/70 hover:text-[#F0E2C2]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {item.kind === "cabin" && (
          <>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#2A1F18]">
              <Image
                src={item.data.coverPhoto}
                alt={item.data.name}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-cover"
                unoptimized
              />
            </div>
            <p className="text-[15px] leading-relaxed text-[#F0E2C2]/85">
              {item.data.description}
            </p>
            {item.data.amenities.length > 0 && (
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.16em] text-[#B89968] mb-2">
                  Amenities
                </h3>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[14px]">
                  {item.data.amenities.map((a) => (
                    <li key={a} className="flex items-start gap-2">
                      <span className="text-[#B89968] mt-1">•</span>
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
                className="ios-press block text-center rounded-2xl bg-[#F0E2C2] text-[#1A1310] font-semibold py-3.5 mt-2 shadow-[0_8px_24px_rgba(184,153,104,0.25)]"
              >
                Book direct
              </a>
            )}
          </>
        )}

        {item.kind === "poi" && (
          <p className="text-[15px] leading-relaxed text-[#F0E2C2]/85">
            {item.data.description}
          </p>
        )}

        <div className="pt-2 text-[11px] text-[#B89968]/70 border-t border-[#B89968]/15">
          {item.data.lat.toFixed(5)}°N, {Math.abs(item.data.lng).toFixed(5)}°W
        </div>
      </div>
    </div>
  );
}
