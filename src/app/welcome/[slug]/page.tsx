import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cabinInfo, cabinInfoBySlug } from "@/data/cabin-info";
import { cabins } from "@/data/cabins";
import InstallAppButton from "@/components/InstallAppButton";
import CopyChip from "@/components/CopyChip";

export const dynamic = "force-static";

export function generateStaticParams() {
  return cabinInfo.map((c) => ({ slug: c.welcomeSlug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = cabinInfoBySlug(slug);
  if (!info) return { title: "Welcome · The Falls at Lions Den" };
  return { title: `Welcome to ${info.shortName} · The Falls at Lions Den` };
}

export default async function CabinWelcomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = cabinInfoBySlug(slug);
  if (!info) notFound();

  const cabin = cabins.find((c) => c.slug === info.cabinSlug);

  return (
    <main className="hero-radial min-h-[100svh] w-full pb-16">
      <section className="relative px-6 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)]">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <InstallAppButton />
          </div>

          {/* Cabin hero photo */}
          {cabin?.coverPhoto && (
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl mb-5 shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
              <Image
                src={cabin.coverPhoto}
                alt={info.shortName}
                fill
                sizes="(max-width: 640px) 100vw, 600px"
                className="object-cover"
                unoptimized
                priority
              />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0e0a08]/95 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 text-left">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#cdac7d] mb-1">
                  Welcome to
                </p>
                <h1 className="ios-title text-3xl text-[#F0E2C2] drop-shadow-md">
                  {info.shortName}
                </h1>
              </div>
            </div>
          )}

          {!cabin?.coverPhoto && (
            <>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#cdac7d] mb-2 mt-2">
                Welcome to
              </p>
              <h1 className="ios-title text-3xl text-[#F0E2C2] mb-5">
                {info.shortName}
              </h1>
            </>
          )}
        </div>

        <div className="mx-auto max-w-2xl space-y-4">
          {/* Wi-Fi card */}
          <section className="ios-glass rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13a10 10 0 0 1 14 0" />
                <path d="M8.5 16.5a5 5 0 0 1 7 0" />
                <line x1="12" y1="20" x2="12.01" y2="20" />
                <path d="M2 8.82a15 15 0 0 1 20 0" />
              </svg>
              <h2 className="ios-headline text-[15px] text-[#cdac7d]">Wi-Fi</h2>
            </div>
            {info.wifi.ssid && info.wifi.password ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] uppercase tracking-[0.12em] text-[#F0E2C2]/55">Network</span>
                  <CopyChip text={info.wifi.ssid} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] uppercase tracking-[0.12em] text-[#F0E2C2]/55">Password</span>
                  <CopyChip text={info.wifi.password} mono />
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-[#F0E2C2]/65">
                Wi-Fi details will be posted before your arrival.
              </p>
            )}
          </section>

          {/* Door code card */}
          <section className="ios-glass rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <h2 className="ios-headline text-[15px] text-[#cdac7d]">Door code</h2>
            </div>
            {info.doorCode ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] uppercase tracking-[0.12em] text-[#F0E2C2]/55">Keypad</span>
                <CopyChip text={info.doorCode} mono big />
              </div>
            ) : (
              <p className="text-[13px] text-[#F0E2C2]/65">
                Your door code will be sent before check-in.
              </p>
            )}
          </section>

          {/* Notes (parking, TV, anything else) */}
          {(info.parkingNote || info.tvNote || info.cabinSpecificNote) && (
            <section className="ios-glass rounded-3xl p-5 space-y-3">
              <h2 className="ios-headline text-[15px] text-[#cdac7d]">Good to know</h2>
              {info.parkingNote && (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.12em] text-[#F0E2C2]/55 mb-1">
                    Parking
                  </div>
                  <p className="text-[14px] text-[#F0E2C2]/85 leading-relaxed">{info.parkingNote}</p>
                </div>
              )}
              {info.tvNote && (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.12em] text-[#F0E2C2]/55 mb-1">
                    TV
                  </div>
                  <p className="text-[14px] text-[#F0E2C2]/85 leading-relaxed">{info.tvNote}</p>
                </div>
              )}
              {info.cabinSpecificNote && (
                <div>
                  <p className="text-[14px] text-[#F0E2C2]/85 leading-relaxed">{info.cabinSpecificNote}</p>
                </div>
              )}
            </section>
          )}

          {/* Explore CTAs */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Link
              href={cabin ? `/map?cabin=${cabin.slug}` : "/map"}
              className="ios-glass ios-press rounded-2xl p-4 text-center"
            >
              <div className="text-[24px] mb-1">🗺️</div>
              <div className="text-[13px] font-semibold text-[#F0E2C2]">Map &amp; trails</div>
            </Link>
            <Link
              href="/manual"
              className="ios-glass ios-press rounded-2xl p-4 text-center"
            >
              <div className="text-[24px] mb-1">📖</div>
              <div className="text-[13px] font-semibold text-[#F0E2C2]">House manual</div>
            </Link>
            <Link
              href="/memories"
              className="ios-glass ios-press rounded-2xl p-4 text-center col-span-2"
              style={{ background: "linear-gradient(135deg, rgba(205,172,125,0.18), rgba(107,68,35,0.18))" }}
            >
              <div className="text-[24px] mb-1">📸</div>
              <div className="text-[13px] font-semibold text-[#F0E2C2]">Share a photo from your stay</div>
            </Link>
          </div>

          <p className="text-center text-[11px] text-[#F0E2C2]/40 mt-4">
            Tap <span className="font-semibold">Install as app</span> at the top so you can use this offline anywhere on the property.
          </p>
        </div>
      </section>
    </main>
  );
}
