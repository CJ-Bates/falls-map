import Link from "next/link";
import Image from "next/image";
import { publicCabins } from "@/data/cabins";

export const metadata = { title: "Cabins · The Falls at Lions Den" };

export default function CabinsPage() {
  return (
    <main className="hero-radial min-h-[100svh] w-full pb-16">
      <header
        className="px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 flex items-center gap-3 max-w-3xl mx-auto"
      >
        <Link
          href="/"
          aria-label="Back"
          className="ios-glass-strong ios-press grid h-10 w-10 place-items-center rounded-full text-[#F0E2C2]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="ios-title text-2xl text-[#F0E2C2]">Cabins</h1>
      </header>

      <div className="px-6 mx-auto max-w-3xl space-y-5">
        {publicCabins.map((c) => (
          <article
            key={c.slug}
            className="ios-glass overflow-hidden rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
          >
            <div className="relative aspect-[16/10] w-full bg-[#2A1F18]">
              <Image
                src={c.coverPhoto}
                alt={c.name}
                fill
                sizes="(max-width: 640px) 100vw, 600px"
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0e0a08]/90 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <h2 className="ios-headline text-2xl text-[#F0E2C2] drop-shadow-md">{c.name}</h2>
                <p className="text-xs uppercase tracking-[0.16em] text-[#cdac7d] mt-1">
                  {c.bedrooms} BR · {c.bathrooms} BA{c.maxGuests ? ` · sleeps ${c.maxGuests}` : ""}
                </p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[15px] leading-relaxed text-[#F0E2C2]/85">{c.description}</p>
              {c.amenities.length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.16em] text-[#B89968] mb-2">
                    Amenities
                  </h3>
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[14px]">
                    {c.amenities.map((a) => (
                      <li key={a} className="flex items-start gap-2">
                        <span className="text-[#B89968] mt-1">•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {c.bookingUrl && (
                <a
                  href={c.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ios-press block text-center rounded-2xl bg-[#F0E2C2] text-[#1A1310] font-semibold py-3.5 shadow-[0_8px_24px_rgba(184,153,104,0.25)]"
                >
                  Book direct →
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
