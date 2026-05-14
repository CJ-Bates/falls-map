import Link from "next/link";
import trails from "@/data/trails.json";

export const metadata = { title: "Trails · The Falls at Lions Den" };

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

type TrailFeature = {
  properties: {
    name?: string;
    surface?: string;
    description?: string;
    difficulty?: string;
    cj_note?: string;
  };
  geometry: { coordinates: number[][] };
};

// Build a URL for a chip — toggling the same chip clears the filter.
function chipHref(params: { d?: string; s?: string }) {
  const sp = new URLSearchParams();
  if (params.d) sp.set("d", params.d);
  if (params.s) sp.set("s", params.s);
  const qs = sp.toString();
  return qs ? `/trails?${qs}` : "/trails";
}

export default async function TrailsPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; s?: string }>;
}) {
  const sp = await searchParams;
  const activeDifficulty = (["easy", "moderate", "hard"] as const).find(
    (x) => x === sp.d,
  );
  const activeSurface = (["walk", "drive"] as const).find((x) => x === sp.s);

  const all = trails.features as unknown as TrailFeature[];

  const filtered = all
    .filter((t) => {
      if (activeDifficulty && t.properties.difficulty !== activeDifficulty) return false;
      const surface = t.properties.surface ?? "trail";
      if (activeSurface === "walk" && surface !== "trail") return false;
      if (activeSurface === "drive" && surface === "trail") return false;
      return true;
    })
    .slice()
    .sort((a, b) => {
      const order: Record<string, number> = { paved: 0, gravel: 1, "4wd": 2, trail: 3 };
      const oa = order[a.properties.surface ?? "trail"] ?? 9;
      const ob = order[b.properties.surface ?? "trail"] ?? 9;
      if (oa !== ob) return oa - ob;
      return lineLengthMiles(b.geometry.coordinates) - lineLengthMiles(a.geometry.coordinates);
    });

  const totalMiles = filtered.reduce(
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
            {filtered.length} of {all.length} · {totalMiles.toFixed(1)} mi shown
          </p>
        </div>
      </header>

      {/* Filter chips */}
      <div className="px-6 max-w-3xl mx-auto mt-3 mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mr-1">Difficulty</span>
          <FilterChip href={chipHref({ s: activeSurface })} active={!activeDifficulty} label="All" />
          {(["easy", "moderate", "hard"] as const).map((d) => {
            const m = DIFFICULTY_META[d];
            const active = activeDifficulty === d;
            return (
              <FilterChip
                key={d}
                href={chipHref({ d: active ? undefined : d, s: activeSurface })}
                active={active}
                label={m.label}
                accent={{ bg: m.bg, color: m.color, border: m.border }}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mr-1">Type</span>
          <FilterChip href={chipHref({ d: activeDifficulty })} active={!activeSurface} label="All" />
          <FilterChip
            href={chipHref({ d: activeDifficulty, s: activeSurface === "walk" ? undefined : "walk" })}
            active={activeSurface === "walk"}
            label="Walking only"
          />
          <FilterChip
            href={chipHref({ d: activeDifficulty, s: activeSurface === "drive" ? undefined : "drive" })}
            active={activeSurface === "drive"}
            label="Drivable"
          />
        </div>
      </div>

      <div className="px-6 mx-auto max-w-3xl space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-[14px] text-[#F0E2C2]/55 py-12">
            No trails match those filters. <Link href="/trails" className="text-[#cdac7d] underline">Clear filters</Link>.
          </p>
        ) : (
          filtered.map((t, i) => {
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
                      {miles.toFixed(2)} mi · {meta.sub}
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
          })
        )}
      </div>

      <div className="px-6 mx-auto max-w-3xl mt-8">
        <Link
          href="/map"
          className="ios-press block text-center rounded-2xl bg-[#F0E2C2] text-[#1A1310] font-semibold py-3.5"
        >
          See trails on the map →
        </Link>
      </div>
    </main>
  );
}

function FilterChip({
  href,
  active,
  label,
  accent,
}: {
  href: string;
  active: boolean;
  label: string;
  accent?: { bg: string; color: string; border: string };
}) {
  if (active) {
    return (
      <Link
        href={href}
        className="ios-press inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11.5px] font-semibold"
        style={
          accent
            ? { background: accent.color, color: "#1A1310", border: `1px solid ${accent.color}` }
            : { background: "#F0E2C2", color: "#1A1310", border: "1px solid #F0E2C2" }
        }
      >
        {label}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="ios-press inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors"
      style={
        accent
          ? { background: accent.bg, color: accent.color, border: `1px solid ${accent.border}` }
          : { background: "rgba(240,226,194,0.08)", color: "#F0E2C2", border: "1px solid rgba(240,226,194,0.20)" }
      }
    >
      {label}
    </Link>
  );
}
