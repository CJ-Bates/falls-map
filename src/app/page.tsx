import Link from "next/link";
import Image from "next/image";
import { publicCabins } from "@/data/cabins";
import { property } from "@/data/property";
import TodayWidget from "@/components/TodayWidget";
import InstallAppButton from "@/components/InstallAppButton";
import WelcomeCarousel from "@/components/WelcomeCarousel";
import ShareButton from "@/components/ShareButton";
import FeedbackButton from "@/components/FeedbackButton";
import PhotoOfTheWeek from "@/components/PhotoOfTheWeek";
import trails from "@/data/trails.json";
import { pois } from "@/data/pois";

const TRAIL_COUNT = trails.features.length;
const CARVING_COUNT = pois.filter((p) => p.category === "bear" || p.category === "bobcat").length;

// "What to do here" tile grid — each opens the map focused on something.
const TILES: { label: string; sub: string; href: string; gradient: string; icon: React.ReactElement }[] = [
  {
    label: "Lakes & swimming",
    sub: "Two lakes, beach, dock",
    href: "/map?focus=trail-valley-lakes-trail",
    gradient: "linear-gradient(135deg, #2E6FA0 0%, #1A3A5C 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      </svg>
    ),
  },
  {
    label: "Firepits",
    sub: "Lake beach + ridge top",
    href: "/map?focus=firepits",
    gradient: "linear-gradient(135deg, #D9531E 0%, #7A2D0A 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c-1.5 3-4 4-4 8 a4 4 0 0 0 8 0c0-4-2.5-5-4-8z"/>
        <path d="M5 21l3-1M19 21l-3-1"/>
      </svg>
    ),
  },
  {
    label: "Trails & roads",
    sub: `${TRAIL_COUNT} named paths`,
    href: "/trails",
    gradient: "linear-gradient(135deg, #7d8f5a 0%, #3a4a32 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/>
        <path d="M9 3v15"/>
        <path d="M15 6v15"/>
      </svg>
    ),
  },
  {
    label: "The 13",
    sub: "South parcel pavilion + treehouse",
    href: "/map?focus=trail-the-13-connector",
    gradient: "linear-gradient(135deg, #B89968 0%, #5A4A1F 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11 12 3l9 8"/>
        <path d="M6 11v10"/>
        <path d="M18 11v10"/>
        <path d="M4 21h16"/>
      </svg>
    ),
  },
  {
    label: "Find the bear",
    sub: `Big Lou + Bobby (${CARVING_COUNT} carvings)`,
    href: "/map?focus=carvings",
    gradient: "linear-gradient(135deg, #3a2d22 0%, #1a1310 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="#F0E2C2">
        <circle cx="8.5" cy="4.2" r="1.6"/>
        <circle cx="15.5" cy="4.2" r="1.6"/>
        <circle cx="12" cy="6.5" r="3.6"/>
        <ellipse cx="12" cy="14.5" rx="5" ry="6"/>
      </svg>
    ),
  },
  {
    label: "House manual",
    sub: "Wi-Fi, codes, more",
    href: "/manual",
    gradient: "linear-gradient(135deg, #6B4423 0%, #2A1F18 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
      </svg>
    ),
  },
  {
    label: "Off-property",
    sub: "Nearby food, gas, parks",
    href: "/nearby",
    gradient: "linear-gradient(135deg, #cdac7d 0%, #5a4a1f 100%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main className="hero-radial min-h-[100svh] w-full pb-16">
      {/* Hero */}
      <section className="relative pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] px-6">
        <div className="mx-auto max-w-2xl text-center">
          {/* Install-as-app button — auto-hides when running as a PWA.
              On Android it triggers the native install prompt; on iOS it
              opens a Share->Add-to-Home-Screen walkthrough. */}
          <div className="mb-3 flex justify-center">
            <InstallAppButton />
          </div>

          {/* Coming for the first time? Don't trust GPS — tap to see the right way in. */}
          <Link
            href="/arrival"
            className="ios-press mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-[#D9531E]/15 border border-[#D9531E]/40 px-4 py-1.5 text-[12px] font-semibold text-[#F0E2C2]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D9531E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3.5l9.5 16h-19z" fill="#B23A1F" />
              <line x1="12" y1="10" x2="12" y2="14.5" stroke="#F0E2C2" strokeWidth="2.4" />
              <circle cx="12" cy="17.2" r="0.45" fill="#F0E2C2" stroke="none" />
            </svg>
            First time visiting? Tap for directions
          </Link>

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

          {/* Property stats row */}
          <ul className="mt-6 flex items-stretch justify-center gap-0 mx-auto max-w-md text-[#F0E2C2]">
            <li className="flex-1 text-center">
              <div className="font-sketch text-2xl text-[#F0E2C2]">194</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mt-0.5">Acres</div>
            </li>
            <li className="w-px bg-[#B89968]/25" />
            <li className="flex-1 text-center">
              <div className="font-sketch text-2xl text-[#F0E2C2]">{publicCabins.length}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mt-0.5">Cabins</div>
            </li>
            <li className="w-px bg-[#B89968]/25" />
            <li className="flex-1 text-center">
              <div className="font-sketch text-2xl text-[#F0E2C2]">{TRAIL_COUNT}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mt-0.5">Trails</div>
            </li>
            <li className="w-px bg-[#B89968]/25" />
            <li className="flex-1 text-center">
              <div className="font-sketch text-2xl text-[#F0E2C2]">{CARVING_COUNT}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mt-0.5">Carvings</div>
            </li>
          </ul>

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

      {/* Today widget */}
      <section className="mt-10 px-6">
        <div className="mx-auto max-w-md">
          <TodayWidget />
        </div>
      </section>

      {/* Photo of the week — renders nothing on empty weeks */}
      <PhotoOfTheWeek />

      {/* Memories — full-width secondary CTA so guests notice it */}
      <section className="mt-6 px-6">
        <Link
          href="/memories"
          className="ios-press group relative mx-auto block max-w-md overflow-hidden rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
          style={{
            background:
              "linear-gradient(135deg, #cdac7d 0%, #6B4423 100%)",
          }}
        >
          <div className="px-6 py-5 flex items-center gap-3 text-[#F0E2C2]">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1A1310]/40 text-[#F0E2C2] flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <circle cx="8.5" cy="10.5" r="1.5"/>
                <path d="m21 16-5-5L5 21"/>
              </svg>
            </span>
            <span className="flex-1 text-left">
              <span className="ios-headline block text-[15px]">Share a photo from your stay</span>
              <span className="block text-[12px] text-[#F0E2C2]/75">Add to the guest album · see everyone else\'s</span>
            </span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-active:translate-x-0.5 flex-shrink-0">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </div>
        </Link>
      </section>

      {/* What to do tile grid */}
      <section className="mt-10 px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="ios-title text-2xl text-[#F0E2C2] mb-4">What to do here</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TILES.map((tile) => (
              <Link
                key={tile.label}
                href={tile.href}
                className="ios-press relative overflow-hidden rounded-2xl p-4 aspect-[5/4] flex flex-col justify-between text-[#F0E2C2] shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
                style={{ background: tile.gradient }}
              >
                <div className="h-8 w-8 opacity-90">{tile.icon}</div>
                <div>
                  <div className="ios-headline text-[15px] leading-tight">{tile.label}</div>
                  <div className="text-[11px] text-[#F0E2C2]/70 mt-0.5 leading-tight">{tile.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cabins */}
      <section className="mt-12 px-6">
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

      {/* Connect + footer */}
      <section className="mt-12 px-6">
        <div className="mx-auto max-w-md grid grid-cols-3 gap-3">
          <Link
            href="/story"
            className="ios-glass ios-press rounded-2xl p-3.5 text-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1">
              <path d="M4 19.5v-15a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15"/>
              <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20"/>
              <path d="M8 7h8M8 11h8M8 15h5"/>
            </svg>
            <div className="text-[12px] font-semibold text-[#F0E2C2]">Our story</div>
          </Link>
          <a
            href="https://www.thefallsatlionsden.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ios-glass ios-press rounded-2xl p-3.5 text-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
              <path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/>
            </svg>
            <div className="text-[12px] font-semibold text-[#F0E2C2]">Website</div>
          </a>
          <a
            href="https://www.instagram.com/thefallsatlionsden/"
            target="_blank"
            rel="noopener noreferrer"
            className="ios-glass ios-press rounded-2xl p-3.5 text-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1">
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
            <div className="text-[12px] font-semibold text-[#F0E2C2]">Instagram</div>
          </a>
        </div>
      </section>

      {/* Share + feedback actions */}
      <section className="mt-10 px-6">
        <div className="mx-auto max-w-md flex flex-wrap items-center justify-center gap-2">
          <ShareButton />
          <FeedbackButton />
        </div>
      </section>
      {/* Footer */}
      <footer className="mt-10 px-6 text-center">
        <p className="text-xs text-[#F0E2C2]/60">
          Made for guests of The Falls at Lions Den · Imperial, MO
        </p>
      </footer>
      <WelcomeCarousel />
    </main>
  );
}
