import Link from "next/link";
import trails from "@/data/trails.json";

export const metadata = { title: "Trails \u00b7 The Falls at Lions Den" };

const SURFACE_META: Record<
  string,
  { label: string; color: string; sub: string }
> = {
  paved:  { label: "Paved",   color: "#3D3022", sub: "Any car" },
  gravel: { label: "Gravel",  color: "#C9A974", sub: "Any vehicle" },
  "4wd":  { label: "4WD",     color: "#D9531E", sub: "Truck or SUV" },
  trail:  { label: "Walking", color: "#F0E2C2", sub: "On foot only" },
};

const DIFFICULTY_META: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  easy:     { label: "Easy",     color: "#a8c47a", bg: "rgba(168,196,122,0.18)", border: "rgba(168,196,122,0.55)" },
  moderate: { label: "Moderate", color: "#e0b75b", bg: "rgba(224,183,91,0.18)",  border: "rgba(224,183,91,0.55)" },
  hard:     { label: "Hard",     color: "#e07a5b", bg: "rgba(224,122,91,0.18)",  border: "rgba(224,122,91,0.55)" },
};

function lineLengthMiles(coords: number[][]): number {
  let m = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    m += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return m / 1609.344;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function TrailsPage() {
  type TrailFeature = {
    properties: { name?: string; surface?: string; description?: string; difficulty?: string; cj_note?: string };
    geometry: { coordinates: number[][] };
  };
  const features = (trails.features as unknown as TrailFeature[])
    .slice()
    .sort((a, b) => {
      const order: Record<string, number> = { paved: 0, gravel: 1, "4wd": 2, trail: 3 };
      const oa = order[a.properties.surface ?? "trail"] ?? 9;
      const ob = order[b.properties.surface ?? "trail"] ?? 9;
      if (oa !== ob) return oa - ob;
      return lineLengthMiles(b.geometry.coordinates) - lineLengthMiles(a.geometry.coordinates);
    });

  const totalMiles = features.reduce(
    (sum, t) => sum + lineLengthMiles(t.geometry.coordinates),
    0,
  );

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
          <h1 className="ios-title text-2xl text-[#F0E2C2]">Trails &amp; Roads</h1>
          <p className="text-[12px] text-[#B89968] mt-0.5">
            {features.length} named \u00b7 {totalMiles.toFixed(1)} mi total
          </p>
        </div>
      </header>

      {/* Surface + difficulty legend */}
      <div className="px-6 max-w-3xl mx-auto mt-2 mb-5 space-y-2">
        <ul className="flex flex-wrap gap-2">
          {Object.entries(SURFACE_META).map(([id, m]) => (
            <li
              key={id}
              className="ios-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5"
            >
              <span
                className="block h-[3px] w-6 rounded-full"
                style={{ background: m.color, boxShadow: `0 0 6px ${m.color}80` }}
              />
              <span className="text-[12px] text-[#F0E2C2]/85 font-semibold">{m.label}</span>
              <span className="text-[11px] text-[#F0E2C2]/55">\u00b7 {m.sub}</span>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-2">
          {Object.entries(DIFFICULTY_META).map(([id, m]) => (
            <li
              key={id}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] font-semibold"
              style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}
            >
              {m.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="px-6 mx-auto max-w-3xl space-y-3">
        {features.map((t, i) => {
          const surface = (t.properties.surface ?? "trail") as keyof typeof SURFACE_META;
          const meta = SURFACE_META[surface] ?? SURFACE_META.trail;
          const diff = t.properties.difficulty ?? "";
          const diffMeta = DIFFICULTY_META[diff];
          const miles = lineLengthMiles(t.geometry.coordinates);
          const name = t.properties.name ?? "Unnamed trail";
          const slug = slugify(name);
          return (
            <article key={i} className="ios-glass relative overflow-hidden rounded-3xl">
              <div
                aria-hidden
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ background: meta.color, boxShadow: `0 0 12px ${meta.color}60` }}
              />
              <div className="pl-5 pr-4 py-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="ios-headline text-[17px] text-[#F0E2C2] leading-tight">
                      {name}
                    </h2>
                    <span
                      className="text-[10px] uppercase tracking-[0.14em] font-semibold rounded-full px-2 py-0.5"
                      style={{
                        background: `${meta.color}22`,
                        color: meta.color === "#F0E2C2" ? "#F0E2C2" : meta.color,
                        border: `1px solid ${meta.color}55`,
                      }}
                    >
                      {meta.label}
                    </span>
                    {diffMeta && (
                      <span
                        className="text-[10px] uppercase tracking-[0.14em] font-semibold rounded-full px-2 py-0.5"
                        style={{
                          background: diffMeta.bg,
                          color: diffMeta.color,
                          border: `1px solid ${diffMeta.border}`,
                        }}
                      >
                        {diffMeta.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#B89968] mt-1">
                    {miles.toFixed(2)} mi \u00b7 {meta.sub}
                  </p>
                  {t.properties.description && (
                    <p className="text-[14px] text-[#F0E2C2]/85 mt-2 leading-relaxed">
                      {t.properties.description}
                    </p>
                  )}
                  {t.properties.cj_note && (
                    <p className="text-[13px] text-[#F0E2C2]/60 italic mt-1.5 leading-relaxed">
                      {t.properties.cj_note}
                    </p>
                  )}
                </div>
                <Link
                  href={`/map?focus=trail-${slug}`}
                  aria-label={`Show ${name} on the map`}
                  className="ios-press grid h-9 w-9 place-items-center rounded-full bg-[#F0E2C2]/10 text-[#F0E2C2]/75 hover:text-[#F0E2C2] flex-shrink-0"
                  title="Show on map"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
                    <path d="M9 3v15" />
                    <path d="M15 6v15" />
                  </svg>
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="px-6 mx-auto max-w-3xl mt-8">
        <Link
          href="/map"
          className="ios-press block text-center rounded-2xl bg-[#F0E2C2] text-[#1A1310] font-semibold py-3.5"
        >
          See trails on the map \u2192
        </Link>
      </div>
    </main>
  );
}
