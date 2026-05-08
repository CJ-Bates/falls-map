import Link from "next/link";
import trails from "@/data/trails.json";

export const metadata = { title: "Trails · The Falls at Lions Den" };

const SURFACE_LABEL: Record<string, { label: string; color: string; description: string }> = {
  paved: { label: "Paved", color: "#444444", description: "Any car." },
  gravel: { label: "Gravel", color: "#B89968", description: "Any car — drive carefully." },
  "4wd": { label: "4-Wheel Drive", color: "#D9531E", description: "Truck or SUV with 4WD." },
  trail: { label: "Walking Trail", color: "#F0E2C2", description: "On foot only." },
};

// Approximate length in miles using haversine for line strings.
function lineLengthMiles(coords: number[][]): number {
  let m = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    const R = 6371000; // meters
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

export default function TrailsPage() {
  type TrailFeature = {
    properties: { name?: string; surface?: string; description?: string };
    geometry: { coordinates: number[][] };
  };
  const features = (trails.features as unknown as TrailFeature[]).slice();

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
        <h1 className="ios-title text-2xl text-[#F0E2C2]">Trails & Roads</h1>
      </header>

      <div className="px-6 mx-auto max-w-3xl space-y-3">
        {features.map((t, i) => {
          const surface = (t.properties.surface ?? "trail") as keyof typeof SURFACE_LABEL;
          const meta = SURFACE_LABEL[surface] ?? SURFACE_LABEL.trail;
          const miles = lineLengthMiles(t.geometry.coordinates);
          return (
            <article key={i} className="ios-glass rounded-3xl p-5">
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 block h-3 w-3 rounded-full flex-shrink-0"
                  style={{ background: meta.color, boxShadow: `0 0 10px ${meta.color}80` }}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="ios-headline text-[17px] text-[#F0E2C2]">
                    {t.properties.name ?? "Unnamed trail"}
                  </h2>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#B89968] mt-0.5">
                    {meta.label} · {miles.toFixed(2)} mi
                  </p>
                  {t.properties.description && (
                    <p className="text-[14px] text-[#F0E2C2]/80 mt-2 leading-relaxed">
                      {t.properties.description}
                    </p>
                  )}
                </div>
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
          See trails on the map →
        </Link>
      </div>
    </main>
  );
}
