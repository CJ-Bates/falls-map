import Link from "next/link";
import StoryPhotos from "@/components/StoryPhotos";

export const metadata = { title: "Our Story · The Falls at Lions Den" };

export default function StoryPage() {
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
          <h1 className="ios-title text-2xl text-[#F0E2C2]">Our Story</h1>
          <p className="text-[12px] text-[#B89968] mt-0.5">A 30-minute escape from St. Louis</p>
        </div>
      </header>

      <article className="px-6 mx-auto max-w-2xl space-y-6 mt-4 text-[#F0E2C2]">
        <section className="ios-glass rounded-3xl p-6 space-y-4">
          <h2 className="ios-headline text-[18px] text-[#cdac7d]">How it started</h2>
          <p className="text-[15px] leading-relaxed text-[#F0E2C2]/85">
            The Falls at Lions Den was inspired by a shared love for the land
            and a desire to preserve its charm. When a local non-profit sold
            the property, Chris and Stephanie Bates saw an opportunity to
            protect this incredible 194 acres from high-density development
            and share it with others instead.
          </p>
          <p className="text-[15px] leading-relaxed text-[#F0E2C2]/85">
            The place holds a special meaning for Chris. As a child, he rode
            horses through these same trails when the property was operated
            by the Cub Scouts of America. Decades later, he and Stephanie are
            stewards of it.
          </p>
        </section>

        <section className="ios-glass rounded-3xl p-6 space-y-4">
          <h2 className="ios-headline text-[18px] text-[#cdac7d]">The cabins</h2>
          <p className="text-[15px] leading-relaxed text-[#F0E2C2]/85">
            Newly renovated in 2024, the cabins offer a modern rustic feel
            with a seamless blend of comfort and the outdoors. Wi-Fi, Sonos
            sound, and full kitchens on the inside; woods, trails, lakes,
            and quiet on the outside.
          </p>
        </section>

        <section className="ios-glass rounded-3xl p-6 space-y-4">
          <h2 className="ios-headline text-[18px] text-[#cdac7d]">On the way in</h2>
          <p className="text-[15px] leading-relaxed text-[#F0E2C2]/85">
            As you arrive, you&apos;ll pass Bates Farm — pastures and grazing
            horses that set the tone for the property. From here you can
            kayak, hike, paddleboard, or fish on nearby lakes. The historic
            town of Kimmswick is a short drive away: antique shops, charming
            restaurants, occasional Mississippi River cruises.
          </p>
        </section>

        <section className="ios-glass rounded-3xl p-6 space-y-4">
          <h2 className="ios-headline text-[18px] text-[#cdac7d]">What&apos;s next</h2>
          <p className="text-[15px] leading-relaxed text-[#F0E2C2]/85">
            The Falls is always being added to. Future plans include more
            firepits, hot tubs, and further developing the natural waterfalls
            that gave the property its name.
          </p>
        </section>

        <section className="ios-glass-strong rounded-3xl p-6 text-center space-y-3">
          <p className="font-hand text-[22px] leading-snug text-[#F0E2C2]">
            We can&apos;t wait to welcome you to The Falls — where you&apos;ll
            find adventure, relaxation, and the beauty of nature all in
            one place.
          </p>
          <p className="text-[12px] uppercase tracking-[0.18em] text-[#cdac7d]">
            — Chris &amp; Stephanie Bates
          </p>
        </section>

        <StoryPhotos />

        <div className="grid grid-cols-2 gap-3 mt-2">
          <a
            href="https://www.thefallsatlionsden.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ios-glass ios-press rounded-2xl p-4 flex flex-col items-center justify-center text-center"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
              <path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/>
            </svg>
            <div className="text-[13px] font-semibold text-[#F0E2C2] leading-tight">Visit website</div>
            <div className="text-[10px] text-[#F0E2C2]/55 mt-0.5">thefallsatlionsden.com</div>
          </a>
          <a
            href="https://www.instagram.com/thefallsatlionsden/"
            target="_blank"
            rel="noopener noreferrer"
            className="ios-glass ios-press rounded-2xl p-4 flex flex-col items-center justify-center text-center"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1.5">
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
            <div className="text-[13px] font-semibold text-[#F0E2C2] leading-tight">Follow on Instagram</div>
            <div className="text-[10px] text-[#F0E2C2]/55 mt-0.5">@thefallsatlionsden</div>
          </a>
        </div>
      </article>
    </main>
  );
}
