import Link from "next/link";
import FeedbackButton from "@/components/FeedbackButton";

export const metadata = { title: "House Manual · The Falls at Lions Den" };

// Keep this page reading-friendly: prose first, lists where useful.
// Cross-link to the cabin welcome pages + /nearby + /trails + /arrival
// so we don't duplicate info that already lives elsewhere.

const CABIN_LINKS = [
  { slug: "cabin-1", name: "Ridge Cabin 1" },
  { slug: "cabin-2", name: "Ridge Cabin 2" },
  { slug: "cabin-3a", name: "Ridge Cabin 3A" },
  { slug: "cabin-3b", name: "Ridge Cabin 3B" },
];

function SectionIcon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d={d} />
    </svg>
  );
}

export default function ManualPage() {
  return (
    <main className="hero-radial min-h-[100svh] w-full pb-16">
      <header className="px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 flex items-center gap-3 max-w-3xl mx-auto">
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
          <h1 className="ios-title text-2xl text-[#F0E2C2]">House Manual</h1>
          <p className="text-[12px] text-[#B89968] mt-0.5">
            Everything you might need during your stay.
          </p>
        </div>
      </header>

      <div className="px-6 mx-auto max-w-3xl space-y-4 text-[#F0E2C2]">
        {/* Quick start */}
        <section className="ios-glass rounded-3xl p-5">
          <h2 className="ios-headline text-[16px] text-[#cdac7d] mb-2 flex items-center gap-2">
            <SectionIcon d="M5 12h14M12 5l7 7-7 7" />
            Quick start
          </h2>
          <ol className="space-y-2.5 text-[14px] text-[#F0E2C2]/85 leading-relaxed list-decimal list-inside">
            <li>
              <span className="font-semibold text-[#F0E2C2]">Install this as an app.</span>{" "}
              Tap the <em>Install as app</em> chip at the top of the home page so the property map, trails, and wi-fi info work even when cell drops.
            </li>
            <li>
              <span className="font-semibold text-[#F0E2C2]">Find your cabin's page.</span>{" "}
              Each cabin has its own welcome page with wi-fi and photos. Links are below.
            </li>
            <li>
              <span className="font-semibold text-[#F0E2C2]">Need anything?</span>{" "}
              For everyday stay needs, reply to your booking email (Amy). For urgent issues, text or call CJ at <a href="tel:+13144097833" className="text-[#cdac7d] underline">(314) 409-7833</a>.
            </li>
          </ol>
        </section>

        {/* Getting in */}
        <section className="ios-glass rounded-3xl p-5">
          <h2 className="ios-headline text-[16px] text-[#cdac7d] mb-2 flex items-center gap-2">
            <SectionIcon d="M3 12l9-9 9 9M5 10v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10" />
            Getting in
          </h2>
          <ul className="space-y-3 text-[14px] text-[#F0E2C2]/85 leading-relaxed">
            <li>
              <span className="font-semibold text-[#F0E2C2]">The right way in.</span>{" "}
              GPS apps sometimes try to route you via Sunny Creek Rd. That's the wrong way and dead-ends in a neighbor's subdivision.{" "}
              <Link href="/arrival" className="text-[#cdac7d] underline">Tap here for the correct route</Link>{" "}
              (Lefarth Road from Lions Den Rd).
            </li>
            <li>
              <span className="font-semibold text-[#F0E2C2]">Door code.</span>{" "}
              Each stay gets a unique keypad code, sent in your welcome email from the booking system. Codes rotate so the next guest can't reuse yours.
            </li>
            <li>
              <span className="font-semibold text-[#F0E2C2]">Parking.</span>{" "}
              Pull up directly in front of your cabin on Ridge Cabin Rd. Drive slowly on the gravel. There's wildlife, kids, and a few hairpins.
            </li>
          </ul>
        </section>

        {/* Cabin welcome pages */}
        <section className="ios-glass rounded-3xl p-5">
          <h2 className="ios-headline text-[16px] text-[#cdac7d] mb-3 flex items-center gap-2">
            <SectionIcon d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
            Your cabin page
          </h2>
          <p className="text-[13px] text-[#F0E2C2]/75 leading-relaxed mb-3">
            Each cabin has a dedicated page with its wi-fi card, photos, and quick links. There's a printed QR code on each cabin door that opens it.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CABIN_LINKS.map((c) => (
              <Link
                key={c.slug}
                href={`/welcome/${c.slug}`}
                className="ios-press rounded-2xl bg-[#F0E2C2]/8 border border-[#F0E2C2]/15 px-3.5 py-2.5 text-[13px] font-semibold text-[#F0E2C2] inline-flex items-center justify-between"
              >
                {c.name}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-[#cdac7d]">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            ))}
          </div>
        </section>

        {/* Wi-Fi & cell */}
        <section className="ios-glass rounded-3xl p-5">
          <h2 className="ios-headline text-[16px] text-[#cdac7d] mb-3 flex items-center gap-2">
            <SectionIcon d="M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 20 0" />
            Wi-Fi &amp; cell
          </h2>
          <p className="text-[14px] text-[#F0E2C2]/85 leading-relaxed mb-3">
            One wired Starlink network covers every cabin. Same SSID and password everywhere on the property.
          </p>
          <div className="space-y-2 text-[13.5px] text-[#F0E2C2]/85">
            <div className="flex items-center justify-between rounded-2xl bg-[#F0E2C2]/8 px-3.5 py-2.5">
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-[#F0E2C2]/55">Network</div>
                <div>The Falls Wifi_Guest</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-[0.12em] text-[#F0E2C2]/55">Password</div>
                <div className="font-mono">CabinFalls!</div>
              </div>
            </div>
          </div>
          <p className="text-[12px] text-[#F0E2C2]/55 leading-snug mt-2">
            <span className="text-[#F0E2C2]/85">Cell coverage</span> can be spotty past the lakes and out at The 13. Install this app to your home screen and the property map will work without a signal.
          </p>
        </section>

        {/* Need something during your stay — direct contacts */}
        <section className="ios-glass rounded-3xl p-5">
          <h2 className="ios-headline text-[16px] text-[#cdac7d] mb-3 flex items-center gap-2">
            <SectionIcon d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            Need something during your stay?
          </h2>
          <p className="text-[14px] text-[#F0E2C2]/85 leading-relaxed mb-3">
            For everyday requests &mdash; firewood, extra towels, trash questions, anything about the property &mdash; the fastest way is to <strong className="text-[#F0E2C2]">reply to your booking email</strong>. Amy handles guest support and will get back to you quickly.
          </p>
          <p className="text-[14px] text-[#F0E2C2]/85 leading-relaxed">
            For urgent issues (broken pipe, power out, you&apos;re locked out, or you can&apos;t reach Amy), text or call CJ:
          </p>
          <div className="mt-3 flex justify-center">
            <a
              href="tel:+13144097833"
              className="ios-press inline-flex items-center gap-2 rounded-full bg-[#cdac7d]/15 border border-[#cdac7d]/40 px-4 py-2 text-[14px] font-semibold text-[#F0E2C2]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              (314) 409-7833
            </a>
          </div>
        </section>

        {/* Stay feedback (general — NOT for urgent needs) */}
        <section className="ios-glass rounded-3xl p-5">
          <h2 className="ios-headline text-[16px] text-[#cdac7d] mb-3 flex items-center gap-2">
            <SectionIcon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            How was your stay?
          </h2>
          <p className="text-[14px] text-[#F0E2C2]/85 leading-relaxed mb-3">
            Tap the feedback button below to share suggestions, compliments, app bugs, or ideas for what to add. We read every note and use it to make future stays better. <em>Not monitored in real time</em> &mdash; for anything you need <strong className="text-[#F0E2C2]">now</strong>, use the contacts above.
          </p>
          <div className="mt-3 flex justify-center">
            <FeedbackButton />
          </div>
        </section>

        {/* On the property */}
        <section className="ios-glass rounded-3xl p-5">
          <h2 className="ios-headline text-[16px] text-[#cdac7d] mb-3 flex items-center gap-2">
            <SectionIcon d="M2 22h20M3 22V8l9-5 9 5v14M9 12h6M9 16h6" />
            On the property
          </h2>
          <ul className="space-y-3 text-[14px] text-[#F0E2C2]/85 leading-relaxed">
            <li>
              <span className="font-semibold text-[#F0E2C2]">194 acres, 22 named paths.</span>{" "}
              <Link href="/trails" className="text-[#cdac7d] underline">See the trail list</Link>{" "}
              for difficulty and notes, or <Link href="/map" className="text-[#cdac7d] underline">open the map</Link>.
            </li>
            <li>
              <span className="font-semibold text-[#F0E2C2]">Two lakes, beach, and a dock.</span>{" "}
              The main lake has the pavilion, fishing dock, and a beach firepit. Swim at your own risk. The water gets warm in late summer.
            </li>
            <li>
              <span className="font-semibold text-[#F0E2C2]">Firepits.</span>{" "}
              The lake-beach firepit and the upper-ridge firepit both have stacked wood. Light it, enjoy, drown it before bed. If wood is low, hit <em>Send feedback &rarr; Firewood</em>.
            </li>
            <li>
              <span className="font-semibold text-[#F0E2C2]">Horses.</span>{" "}
              The horse pasture sits east of the cabins (the Horse Pasture Trail walks the woodline). Feel free to stop and say hello. Just don't feed them.
            </li>
            <li>
              <span className="font-semibold text-[#F0E2C2]">Wildlife.</span>{" "}
              Deer, geese, ducks, wild turkey, the occasional bobcat. Give them space. Dogs welcome on-leash. <em>(Pet policy: confirm in your booking.)</em>
            </li>
            <li>
              <span className="font-semibold text-[#F0E2C2]">Find the bear.</span>{" "}
              There are wooden bear and bobcat carvings tucked around the property. Big Lou by the lake pavilion is the easiest to spot. See if the kids can find them all.
            </li>
          </ul>
        </section>

        {/* Around the cabin */}
        <section className="ios-glass rounded-3xl p-5">
          <h2 className="ios-headline text-[16px] text-[#cdac7d] mb-3 flex items-center gap-2">
            <SectionIcon d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
            Around the cabin
          </h2>
          <ul className="space-y-2.5 text-[14px] text-[#F0E2C2]/85 leading-relaxed">
            <li>
              <span className="font-semibold text-[#F0E2C2]">Quiet hours.</span>{" "}
              Out of respect for the wildlife and the property's natural quiet, keep outdoor music and volume reasonable after 10pm.
            </li>
            <li>
              <span className="font-semibold text-[#F0E2C2]">Trash &amp; recycling.</span>{" "}
              Each cabin has bins. <em>Pickup day and bin location coming soon.</em> If you're unsure, send feedback and we'll guide you.
            </li>
            <li>
              <span className="font-semibold text-[#F0E2C2]">Linens.</span>{" "}
              Fresh sheets and towels are stocked. Leave used ones in the hamper at the end of your stay. No need to wash.
            </li>
            <li>
              <span className="font-semibold text-[#F0E2C2]">Check-out.</span>{" "}
              Time and checklist are in your booking confirmation. Basic ask: lock up, run the dishwasher, kill the firepit.
            </li>
          </ul>
        </section>

        {/* Off-property */}
        <section className="ios-glass rounded-3xl p-5">
          <h2 className="ios-headline text-[16px] text-[#cdac7d] mb-2 flex items-center gap-2">
            <SectionIcon d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7v6M12 16v.01" />
            Off the property
          </h2>
          <p className="text-[14px] text-[#F0E2C2]/85 leading-relaxed mb-3">
            Gas, grocery, restaurants, parks &mdash; all within ~20 minutes.
          </p>
          <Link
            href="/nearby"
            className="ios-press inline-flex items-center gap-2 rounded-full bg-[#F0E2C2]/10 border border-[#F0E2C2]/18 px-3.5 py-2 text-[13px] font-semibold text-[#F0E2C2]"
          >
            Open nearby recommendations
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-[#cdac7d]">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </Link>
        </section>

        {/* If something's wrong */}
        <section className="ios-glass rounded-3xl p-5">
          <h2 className="ios-headline text-[16px] text-[#cdac7d] mb-3 flex items-center gap-2">
            <SectionIcon d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            If something's wrong
          </h2>
          <ul className="space-y-3 text-[14px] text-[#F0E2C2]/85 leading-relaxed">
            <li>
              <span className="font-semibold text-[#F0E2C2]">Non-urgent.</span>{" "}
              Reply to your booking email. Amy handles guest support.
            </li>
            <li>
              <span className="font-semibold text-[#F0E2C2]">Urgent (broken pipe, power out, locked out).</span>{" "}
              Text or call CJ at <a href="tel:+13144097833" className="text-[#cdac7d] underline">(314) 409-7833</a>.
            </li>
            <li>
              <span className="font-semibold text-[#F0E2C2]">Emergency.</span>{" "}
              Dial <span className="font-mono">911</span>. The property address for first responders is on the front of your welcome email. Keep it handy.
            </li>
          </ul>
        </section>

        <p className="text-center text-[11px] text-[#F0E2C2]/40 pt-2">
          This manual is a living document. Things may change &mdash; if anything is out of date, send a quick note.
        </p>
      </div>
    </main>
  );
}
