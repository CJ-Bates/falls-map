import Link from "next/link";

export const metadata = { title: "House Manual · The Falls at Lions Den" };

const SECTIONS: { title: string; items: { name: string; status: string }[] }[] = [
  {
    title: "Getting in",
    items: [
      { name: "Check-in / check-out times", status: "TBD" },
      { name: "Door codes", status: "TBD" },
      { name: "Parking", status: "TBD" },
    ],
  },
  {
    title: "Wi-Fi & connectivity",
    items: [
      { name: "Wi-Fi network names + passwords (per cabin)", status: "TBD" },
      { name: "Cell coverage notes", status: "Spotty in some areas — see map" },
    ],
  },
  {
    title: "Smart home features",
    items: [
      { name: "Lutron lighting controls", status: "TBD" },
      { name: "Smart locks (Yale)", status: "TBD" },
      { name: "Thermostats", status: "TBD" },
      { name: "TVs / streaming", status: "TBD" },
    ],
  },
  {
    title: "Around the cabin",
    items: [
      { name: "Trash & recycling", status: "TBD" },
      { name: "Firewood", status: "TBD" },
      { name: "Quiet hours", status: "TBD" },
    ],
  },
  {
    title: "On the property",
    items: [
      { name: "Lake access & rules", status: "TBD" },
      { name: "Trails & where 4WD is required", status: "See Trails page" },
      { name: "Visiting the horses", status: "Walk the connector trail to the pasture" },
      { name: "Firepits — wood, lighting, safety", status: "TBD" },
    ],
  },
  {
    title: "If something goes wrong",
    items: [
      { name: "Maintenance contact", status: "TBD" },
      { name: "Emergency numbers", status: "911 · local hospital TBD" },
    ],
  },
];

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
        <h1 className="ios-title text-2xl text-[#F0E2C2]">House Manual</h1>
      </header>

      <div className="px-6 mx-auto max-w-3xl">
        <p className="text-[14px] text-[#F0E2C2]/70 leading-relaxed mb-6">
          A scaffold for the guest manual. Items marked TBD are waiting on content from CJ — when you fill these out, they'll appear here for guests offline.
        </p>

        <div className="space-y-4">
          {SECTIONS.map((s) => (
            <section key={s.title} className="ios-glass rounded-3xl p-5">
              <h2 className="ios-headline text-[16px] text-[#cdac7d] mb-3">{s.title}</h2>
              <ul className="space-y-2.5">
                {s.items.map((it) => (
                  <li key={it.name} className="flex items-baseline justify-between gap-3">
                    <span className="text-[14px] text-[#F0E2C2]/90">{it.name}</span>
                    <span className="text-[12px] text-[#B89968] flex-shrink-0">{it.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
