// Per-cabin operational info: Wi-Fi, door codes, parking, etc.
//
// SECURITY NOTE: this ships to the browser, so anyone who reaches the URL
// /welcome/<slug> can see the codes. The intended threat model is that
// guest URLs are short-lived (you rotate codes periodically) and access
// is gated by physically possessing the printed QR in the cabin. If you
// need stronger security, move sensitive fields to server-only env vars
// and read them in a Server Component.

export type CabinInfo = {
  cabinSlug: string;         // matches cabins.ts slug (e.g. "cabin-1")
  welcomeSlug: string;       // URL path: /welcome/<welcomeSlug>
  shortName: string;         // friendly heading (e.g. "Ridge Cabin 1")
  wifi: {
    ssid: string | null;
    password: string | null;
  };
  doorCode: string | null;
  parkingNote: string | null;
  tvNote: string | null;
  cabinSpecificNote: string | null;
};

// Update these as CJ provides info. Set fields to null if unknown — the
// welcome page will gracefully say "Coming soon".
//
// To make a welcomeSlug guessable-proof, change it to a random short
// string (e.g. "ridge-1-9k4mz" instead of plain "cabin-1").
export const cabinInfo: CabinInfo[] = [
  {
    cabinSlug: "cabin-1",
    welcomeSlug: "cabin-1",
    shortName: "Ridge Cabin 1",
    wifi: { ssid: null, password: null },
    doorCode: null,
    parkingNote: null,
    tvNote: null,
    cabinSpecificNote: null,
  },
  {
    cabinSlug: "cabin-2",
    welcomeSlug: "cabin-2",
    shortName: "Ridge Cabin 2",
    wifi: { ssid: null, password: null },
    doorCode: null,
    parkingNote: null,
    tvNote: null,
    cabinSpecificNote: null,
  },
  {
    cabinSlug: "cabin-3a",
    welcomeSlug: "cabin-3a",
    shortName: "Ridge Cabin 3A",
    wifi: { ssid: null, password: null },
    doorCode: null,
    parkingNote: null,
    tvNote: null,
    cabinSpecificNote: null,
  },
  {
    cabinSlug: "cabin-3b",
    welcomeSlug: "cabin-3b",
    shortName: "Ridge Cabin 3B",
    wifi: { ssid: null, password: null },
    doorCode: null,
    parkingNote: null,
    tvNote: null,
    cabinSpecificNote: null,
  },
  {
    cabinSlug: "cabin-5",
    welcomeSlug: "cabin-5",
    shortName: "Ridge Cabin 5",
    wifi: { ssid: null, password: null },
    doorCode: null,
    parkingNote: null,
    tvNote: null,
    cabinSpecificNote: null,
  },
];

export function cabinInfoBySlug(welcomeSlug: string): CabinInfo | undefined {
  return cabinInfo.find((c) => c.welcomeSlug === welcomeSlug);
}
