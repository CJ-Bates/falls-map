"use client";

import Image from "next/image";
import { categoryStyle } from "@/data/pois";

// Mirror of the pin icon paths so the detail-panel badge shows the same icon.
// Kept as a small map of complete SVG <g> fragments so per-icon fills work.
const ICON_PATHS: Record<string, string> = {
  cabin: '<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4.5v3"/><path d="M3 12 12 4l9 8"/><path d="M5 12v9h14v-9"/><path d="M10 21v-5h4v5"/></g>',
  pavilion: '<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 3l9 8"/><path d="M6 11v10"/><path d="M18 11v10"/><path d="M4 21h16"/></g>',
  firepit: '<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-1.5 3-4 4-4 8 a4 4 0 0 0 8 0c0-4-2.5-5-4-8z"/><path d="M5 21l3-1M19 21l-3-1"/></g>',
  "lake-feature": '<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="M12 6l5 9H12z" fill="#F0E2C2"/><path d="M4 16c3 2.5 13 2.5 16 0"/></g>',
  barn: '<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V11l9-7 9 7v10z"/><path d="M9 21v-5.5h6V21"/><path d="M9 15.5l6 5.5M15 15.5l-6 5.5"/></g>',
  treehouse: '<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.5" r="5.5"/><path d="M10.5 14v7M13.5 14v7"/><path d="M10.5 16h3M10.5 19h3"/></g>',
  shack: '<g fill="none" stroke="#F0E2C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21v-9l8-5 8 5v9z"/><circle cx="12" cy="15" r="3.5"/><circle cx="12" cy="15" r="1.5" fill="#F0E2C2" stroke="none"/></g>',
  bear: '<g stroke="#F0E2C2" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"><circle cx="8.5" cy="4.2" r="1.6" fill="#F0E2C2"/><circle cx="15.5" cy="4.2" r="1.6" fill="#F0E2C2"/><circle cx="12" cy="6.5" r="3.6" fill="#F0E2C2"/><ellipse cx="12" cy="14.5" rx="5" ry="6" fill="#F0E2C2"/><circle cx="10.4" cy="6.1" r="0.55" fill="#1f1410" stroke="none"/><circle cx="13.6" cy="6.1" r="0.55" fill="#1f1410" stroke="none"/><ellipse cx="12" cy="8" rx="1.2" ry="0.7" fill="#1f1410" stroke="none"/></g>',
};
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

  // Photo source: cabins use coverPhoto; POIs use optional photoUrl
  const photoSrc =
    item.kind === "cabin"
      ? item.data.coverPhoto
      : item.data.photoUrl;

  return (
    <div
      className="ios-glass-strong animate-slide-up fixed inset-x-0 bottom-0 z-20 max-h-[55svh] overflow-y-auto rounded-t-[28px] text-[#F0E2C2] shadow-[0_-12px_40px_rgba(0,0,0,0.55)]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
    >
      {/* iOS sheet drag handle */}
      <div className="sticky top-0 z-10 bg-transparent pt-2 pb-1">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-[#F0E2C2]/30" />
      </div>

      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#B89968]/15">
        <div
          className="h-10 w-10 rounded-full grid place-items-center border-2 border-[#F0E2C2] flex-shrink-0"
          style={{ background: style?.color ?? "#7A5A2F" }}
          dangerouslySetInnerHTML={{
            __html: `<svg width="22" height="22" viewBox="0 0 24 24">${
              ICON_PATHS[item.kind === "cabin" ? "cabin" : item.data.category] ?? ""
            }</svg>`,
          }}
        />
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
        {/* Photo block. Cabins use a 16:10 cover-crop (Hostaway gallery
            shots are uniformly landscape). POIs preserve their natural
            aspect ratio inside a max-height bound, so portrait shots
            like Big Lou show head-to-toe. */}
        {photoSrc && item.kind === "cabin" && (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#2A1F18]">
            <Image
              src={photoSrc}
              alt={item.data.name}
              fill
              sizes="(max-width: 640px) 100vw, 640px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        {photoSrc && item.kind === "poi" && (
          <div className="w-full overflow-hidden rounded-2xl bg-[#2A1F18] grid place-items-center">
            <img
              src={photoSrc}
              alt={item.data.name}
              className="block max-h-[340px] w-auto object-contain"
            />
          </div>
        )}

        {item.kind === "cabin" && (
          <>
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
          <>
            <p className="text-[15px] leading-relaxed text-[#F0E2C2]/85">
              {item.data.description}
            </p>
            {item.data.story && (
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.16em] text-[#B89968] mb-2">
                  The Story
                </h3>
                <p className="font-hand text-[19px] leading-relaxed text-[#F0E2C2]/90">
                  {item.data.story}
                </p>
              </div>
            )}
          </>
        )}

        <div className="pt-2 text-[11px] text-[#B89968]/70 border-t border-[#B89968]/15">
          {item.data.lat.toFixed(5)}°N, {Math.abs(item.data.lng).toFixed(5)}°W
        </div>
      </div>
    </div>
  );
}
