import Link from "next/link";

export const metadata = { title: "Getting here · The Falls at Lions Den" };

// Property gate (where Lefarth Dr becomes Valley Lakes Trail). Used as a
// driving waypoint so guests' phones route them via Lefarth and not the wrong
// Sunny Creek entrance.
const ENTRANCE_LAT = 38.4068;
const ENTRANCE_LNG = -90.4450;
// A point well inside the cabin cluster — the actual destination.
const CABINS_LAT = 38.4115;
const CABINS_LNG = -90.4570;

const GOOGLE_DIRECTIONS_URL =
  `https://www.google.com/maps/dir/?api=1` +
  `&destination=${CABINS_LAT},${CABINS_LNG}` +
  `&waypoints=${ENTRANCE_LAT},${ENTRANCE_LNG}` +
  `&travelmode=driving`;
const APPLE_DIRECTIONS_URL =
  `https://maps.apple.com/?daddr=${CABINS_LAT},${CABINS_LNG}` +
  `&saddr=Current+Location&dirflg=d`;

export default function ArrivalPage() {
  return (
    <main className="hero-radial min-h-[100svh] w-full pb-16">
      <header className="px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-2 flex items-center gap-3 max-w-3xl mx-auto">
        <Link
          href="/"
          aria-label="Back"
          className="ios-glass-strong ios-press grid h-10 w-10 place-items-center rounded-full text-[#F0E2C2]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1 className="ios-title text-2xl text-[#F0E2C2]">Getting here</h1>
          <p className="text-[12px] text-[#B89968] mt-0.5">The one way in that isn&apos;t wrong</p>
        </div>
      </header>

      <article className="px-6 mx-auto max-w-2xl space-y-5 mt-4 text-[#F0E2C2]">
        <section className="ios-glass-strong rounded-3xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D9531E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M12 3.5l9.5 16h-19z" fill="#B23A1F" />
              <line x1="12" y1="10" x2="12" y2="14.5" stroke="#F0E2C2" strokeWidth="2.4" />
              <circle cx="12" cy="17.2" r="0.4" fill="#F0E2C2" stroke="none" />
            </svg>
            <h2 className="ios-headline text-[18px] text-[#F0E2C2]">Don&apos;t trust your GPS</h2>
          </div>
          <p className="text-[14px] leading-relaxed text-[#F0E2C2]/85">
            Most phones will try to route you in via <strong className="text-[#F0E2C2]">Sunny Creek Rd</strong>{" "}
            — that&apos;s the Living Well Village entrance and it <em>doesn&apos;t connect</em> to our cabins. If you end up at a locked gate, you&apos;ve gone the wrong way.
          </p>
        </section>

        <section className="ios-glass rounded-3xl p-6 space-y-4">
          <h2 className="ios-headline text-[18px] text-[#cdac7d]">The right way in</h2>
          <ol className="space-y-3.5">
            <li className="flex items-start gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#F0E2C2] text-[#1A1310] text-[13px] font-bold flex-shrink-0">1</span>
              <p className="text-[14px] leading-relaxed text-[#F0E2C2]/90">
                Head to <strong className="text-[#F0E2C2]">Lions Den Rd</strong> in Imperial, MO.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#F0E2C2] text-[#1A1310] text-[13px] font-bold flex-shrink-0">2</span>
              <p className="text-[14px] leading-relaxed text-[#F0E2C2]/90">
                Turn onto <strong className="text-[#F0E2C2]">Lefarth Dr</strong>. It&apos;s a gravel road that winds west into the woods.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#F0E2C2] text-[#1A1310] text-[13px] font-bold flex-shrink-0">3</span>
              <p className="text-[14px] leading-relaxed text-[#F0E2C2]/90">
                Lefarth becomes <strong className="text-[#F0E2C2]">Valley Lakes Trail</strong> at our gate. Stay on it — it&apos;ll take you right to the cabins.
              </p>
            </li>
          </ol>
        </section>

        <section className="ios-glass rounded-3xl p-5 space-y-3">
          <h2 className="ios-headline text-[15px] text-[#cdac7d]">Open driving directions</h2>
          <p className="text-[12px] text-[#F0E2C2]/65 leading-snug">
            These links force a stop at the property gate so your maps app won&apos;t reroute you via Sunny Creek mid-trip.
          </p>
          <a
            href={GOOGLE_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ios-press block text-center rounded-2xl bg-[#F0E2C2] text-[#1A1310] font-semibold py-3 shadow-[0_8px_24px_rgba(184,153,104,0.25)]"
          >
            Open in Google Maps
          </a>
          <a
            href={APPLE_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ios-press block text-center rounded-2xl bg-[#F0E2C2]/10 border border-[#F0E2C2]/20 text-[#F0E2C2] font-semibold py-3"
          >
            Open in Apple Maps
          </a>
          <p className="text-[10px] text-[#F0E2C2]/50 leading-snug text-center">
            Apple Maps doesn&apos;t support multi-stop URLs the way Google does. Use Google Maps if you want the waypoint enforced.
          </p>
        </section>

        <section className="ios-glass rounded-3xl p-6 space-y-2">
          <h2 className="ios-headline text-[15px] text-[#cdac7d]">If you get lost</h2>
          <p className="text-[14px] leading-relaxed text-[#F0E2C2]/85">
            If you find yourself on Sunny Creek Rd, just turn around — it dead-ends at the old camp gate. Head back to Lions Den Rd and look for Lefarth Dr.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <Link
            href="/map"
            className="ios-glass ios-press rounded-2xl p-4 flex flex-col items-center justify-center text-center"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1.5">
              <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
              <path d="M9 3v15" />
              <path d="M15 6v15" />
            </svg>
            <div className="text-[13px] font-semibold text-[#F0E2C2] leading-tight">See it on the map</div>
          </Link>
          <Link
            href="/"
            className="ios-glass ios-press rounded-2xl p-4 flex flex-col items-center justify-center text-center"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1.5">
              <path d="M3 12 12 4l9 8" />
              <path d="M5 12v9h14v-9" />
            </svg>
            <div className="text-[13px] font-semibold text-[#F0E2C2] leading-tight">Back to home</div>
          </Link>
        </div>
      </article>
    </main>
  );
}
