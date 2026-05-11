import Link from "next/link";
import Image from "next/image";
import { publicCabins } from "@/data/cabins";
import { property } from "@/data/property";

export default function Home() {
  return (
    <main className="hero-radial min-h-[100svh] w-full pb-16">
      {/* Hero */}
      <section className="relative pt-[calc(env(safe-area-inset-top,0px)+3.5rem)] px-6">
        <div className="mx-auto max-w-2xl text-center">
          {/* Round logo as the hero mark */}
          <div className="mx-auto mb-6 h-24 w-24 sm:h-28 sm:w-28">
            <Image
              src="/logo-round.png"
              alt="The Falls at Lions Den"
              width={112}
              height={112}
              className="h-full w-full rounded-full shadow-[0_8px_28px_rgba(0,0,0,0.55)] ring-1 ring-[#B89968]/40"
              priority
            />
          </div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#B89968]">
            Imperial, Missouri
          </p>
          <h1 className="ios-title mt-2 text-5xl sm:text-6xl text-[#F0E2C2]">
            {property.name.split(" at ")[0]}
            <br />
            <span className="text-[#B89968]">at Lions Den</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base sm:text-lg leading-relaxed text-[#F0E2C2]/80">
            {property.tagline}. ~194 acres of cabins, lakes, trails, and quiet woods 30 minutes south of St. Louis.
          </p>

          {/* Primary CTA — open the property map */}
          <Link
            href="/map"
            className="ios-press group mt-8 inline-flex w-full max-w-md items-center justify-between rounded-3xl bg-[#F0E2C2] text-[#1A1310] px-6 py-5 shadow-[0_10px_40px_rgba(184,153,104,0.25)]"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1A1310] text-[#F0E2C2]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
                  <path d="M9 3v15" />
                  <path d="M15 6v15" />
                </svg>
              </span>
              <span className="text-left">
                <span className="ios-headline block text-[15px]">Open property map</span>
                <span className="block text-[12px] text-[#1A1310]/65">cabins · trails · lakes · firepits</span>
              </span>
            </span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-active:translate-x-0.5">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Cabins */}
      <section className="mt-14 px-6">
        <div className="mx-auto max-w-5xl">
          <header className="mb-4 flex items-baseline justify-between">
            <Link href="/cabins" className="ios-press inline-flex items-baseline gap-2">
              <h2 className="ios-title text-2xl text-[#F0E2C2]">Cabins</h2>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-[#B89968] translate-y-[-2px]">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </Link>
            <span className="text-xs text-[#B89968]">{publicCabins.length} available</span>
          </header>

          <div className="snap-row -mx-6 flex gap-4 overflow-x-auto px-6 pb-4">
            {publicCabins.map((c) => (
              <a
                key={c.slug}
                href={c.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ios-glass ios-press relative w-[80vw] sm:w-[340px] flex-shrink-0 overflow-hidden rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
              >
                <div className="relative aspect-[4/3] w-full bg-[#2A1F18]">
                  <Image
                    src={c.coverPhoto}
                    alt={c.name}
                    fill
                    sizes="(max-width: 640px) 80vw, 340px"
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0e0a08] to-transparent" />
                </div>
                <div className="space-y-1 px-5 pt-4 pb-5">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#B89968]">
                    <span>Ridge Cabin</span>
                    <span>·</span>
                    <span>{c.bedrooms} BR · {c.bathrooms} BA</span>
                  </div>
                  <h3 className="ios-headline text-lg text-[#F0E2C2]">{c.name}</h3>
                  <p className="line-clamp-2 text-sm text-[#F0E2C2]/70">{c.description}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#cdac7d]">
                    Book direct
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17 17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* More */}
      <section className="mt-12 px-6">
        <div className="mx-auto max-w-3xl grid grid-cols-2 gap-3">
          <Link
            href="/trails"
            className="ios-glass ios-press rounded-3xl p-5 flex items-center justify-between"
          >
            <span>
              <span className="ios-headline block text-[15px] text-[#F0E2C2]">Trails & Roads</span>
              <span className="block text-[12px] text-[#B89968] mt-0.5">20 named paths</span>
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-[#cdac7d]">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/manual"
            className="ios-glass ios-press rounded-3xl p-5 flex items-center justify-between"
          >
            <span>
              <span className="ios-headline block text-[15px] text-[#F0E2C2]">House Manual</span>
              <span className="block text-[12px] text-[#B89968] mt-0.5">Wi-Fi, codes, more</span>
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-[#cdac7d]">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 px-6 text-center">
        <p className="text-xs text-[#F0E2C2]/45">
          Made for guests of The Falls at Lions Den · Imperial, MO
        </p>
      </footer>
    </main>
  );
}
