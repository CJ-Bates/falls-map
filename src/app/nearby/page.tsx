import Link from "next/link";
import { LOCAL_RECS, type LocalRecCategory } from "@/data/local-recs";

export const metadata = { title: "Off-property recommendations \u00b7 The Falls at Lions Den" };

const CATEGORY_META: Record<
  LocalRecCategory,
  { label: string; color: string; bg: string; border: string; icon: React.ReactElement; order: number }
> = {
  food:  {
    label: "Food",
    color: "#e0926b",
    bg: "rgba(224,146,107,0.18)",
    border: "rgba(224,146,107,0.55)",
    order: 1,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7a3 3 0 0 0 6 0V2M6 9v13"/>
        <path d="M18 2v20M21 8c0-3.3-1.5-6-3-6"/>
      </svg>
    ),
  },
  drink: {
    label: "Wine / drinks",
    color: "#b88abb",
    bg: "rgba(184,138,187,0.18)",
    border: "rgba(184,138,187,0.55)",
    order: 2,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 22h8M12 14v8"/>
        <path d="M17 2H7l1 12a4 4 0 0 0 8 0z"/>
      </svg>
    ),
  },
  shop:  {
    label: "Shop / grocery",
    color: "#a8c47a",
    bg: "rgba(168,196,122,0.18)",
    border: "rgba(168,196,122,0.55)",
    order: 3,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  fuel:  {
    label: "Gas",
    color: "#5b9be0",
    bg: "rgba(91,155,224,0.18)",
    border: "rgba(91,155,224,0.55)",
    order: 4,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/>
        <path d="M3 14h12M15 7h2a2 2 0 0 1 2 2v8a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2v-8.5L19 4"/>
      </svg>
    ),
  },
  park:  {
    label: "Parks / things to do",
    color: "#cdac7d",
    bg: "rgba(205,172,125,0.18)",
    border: "rgba(205,172,125,0.55)",
    order: 5,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 4 14h5l-2 8 9-12h-5z"/>
      </svg>
    ),
  },
};

// Direct deep-link to native maps app via address search
function mapsLink(rec: { name: string; address: string }) {
  const q = encodeURIComponent(`${rec.name}, ${rec.address}`);
  return `https://maps.google.com/?q=${q}`;
}

// Group recs by category for sectioned rendering
function groupByCategory() {
  const groups = new Map<LocalRecCategory, typeof LOCAL_RECS>();
  for (const r of LOCAL_RECS) {
    if (!groups.has(r.category)) groups.set(r.category, []);
    groups.get(r.category)!.push(r);
  }
  return Array.from(groups.entries()).sort(
    (a, b) => CATEGORY_META[a[0]].order - CATEGORY_META[b[0]].order,
  );
}

export default function NearbyPage() {
  const grouped = groupByCategory();

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
          <h1 className="ios-title text-2xl text-[#F0E2C2]">Off the property</h1>
          <p className="text-[12px] text-[#B89968] mt-0.5">
            Within ~20 minutes of the property
          </p>
        </div>
      </header>

      <div className="px-6 mx-auto max-w-3xl mt-4 space-y-6">
        {grouped.map(([category, recs]) => {
          const meta = CATEGORY_META[category];
          return (
            <section key={category}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em] font-semibold"
                  style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                >
                  <span className="grid place-items-center" style={{ color: meta.color }}>{meta.icon}</span>
                  {meta.label}
                </span>
                <span className="text-[11px] text-[#F0E2C2]/55">{recs.length}</span>
              </div>

              <div className="space-y-3">
                {recs.map((rec) => (
                  <article
                    key={rec.slug}
                    className="ios-glass relative overflow-hidden rounded-3xl"
                  >
                    <div
                      aria-hidden
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ background: meta.color, boxShadow: `0 0 12px ${meta.color}60` }}
                    />
                    <div className="pl-5 pr-4 py-4">
                      <div className="flex items-baseline justify-between gap-3 flex-wrap">
                        <h2 className="ios-headline text-[16px] text-[#F0E2C2] leading-tight">
                          {rec.name}
                        </h2>
                        <span className="text-[10px] uppercase tracking-[0.14em] text-[#B89968]">
                          {rec.town}
                        </span>
                      </div>
                      <p className="text-[14px] text-[#F0E2C2]/85 mt-1.5 leading-relaxed">
                        {rec.blurb}
                      </p>
                      {rec.hours && (
                        <p className="text-[12px] text-[#cdac7d] mt-1.5 leading-snug">
                          {rec.hours}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                        <a
                          href={mapsLink(rec)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ios-press inline-flex items-center gap-1.5 rounded-full bg-[#F0E2C2]/10 border border-[#F0E2C2]/18 px-3 py-1.5 font-semibold text-[#F0E2C2]"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          Open in Maps
                        </a>
                        {rec.url && (
                          <a
                            href={rec.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ios-press inline-flex items-center gap-1.5 rounded-full bg-[#cdac7d]/15 border border-[#cdac7d]/35 px-3 py-1.5 font-semibold text-[#cdac7d]"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M7 17 17 7"/>
                              <path d="M7 7h10v10"/>
                            </svg>
                            Website
                          </a>
                        )}
                        <span className="text-[11px] text-[#F0E2C2]/45 ml-auto">{rec.address}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        <p className="text-center text-[11px] text-[#F0E2C2]/40 pt-2">
          Pin coords are still being verified. If something opens to the wrong spot, tap &ldquo;Send feedback&rdquo; on the home page.
        </p>
      </div>
    </main>
  );
}
