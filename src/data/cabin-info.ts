// Per-cabin operational info: Wi-Fi, door codes, parking, etc.
//
// SECURITY NOTE: this ships to the browser, so anyone who reaches the URL
// /welcome/<slug> can see the codes. The intended threat model is that
// guest URLs are gated by physically possessing the printed QR in the
// cabin AND a unique per-guest door code (sent in the welcome email).
// Door codes are NEVER stored here.

export type WifiNetwork = {
  ssid: string;
  password: string;
  note?: string;
};

export type CabinInfo = {
  cabinSlug: string;         // matches cabins.ts slug (e.g. "cabin-1")
  welcomeSlug: string;       // URL path: /welcome/<welcomeSlug>
  shortName: string;         // friendly heading (e.g. "Ridge Cabin 1")
  wifi: WifiNetwork[];
  wifiNote: string | null;   // shown under the wifi list (e.g. "we're upgrading the network")
  doorCode: string | null;   // always null in source — codes rotate per guest
  parkingNote: string | null;
  tvNote: string | null;
  cabinSpecificNote: string | null;
};

// Wi-Fi as of v101: single hardwired Starlink network covering every cabin.
const CURRENT_WIFI: WifiNetwork[] = [
  { ssid: "The Falls Wifi_Guest", password: "CabinFalls!" },
];
const WIFI_NOTE: string | null = null;

export const cabinInfo: CabinInfo[] = [
  {
    cabinSlug: "cabin-1",
    welcomeSlug: "cabin-1",
    shortName: "Ridge Cabin 1",
    wifi: CURRENT_WIFI,
    wifiNote: WIFI_NOTE,
    doorCode: null,
    parkingNote: null,
    tvNote: null,
    cabinSpecificNote: null,
  },
  {
    cabinSlug: "cabin-2",
    welcomeSlug: "cabin-2",
    shortName: "Ridge Cabin 2",
    wifi: CURRENT_WIFI,
    wifiNote: WIFI_NOTE,
    doorCode: null,
    parkingNote: null,
    tvNote: null,
    cabinSpecificNote: null,
  },
  {
    cabinSlug: "cabin-3a",
    welcomeSlug: "cabin-3a",
    shortName: "Ridge Cabin 3A",
    wifi: CURRENT_WIFI,
    wifiNote: WIFI_NOTE,
    doorCode: null,
    parkingNote: null,
    tvNote: null,
    cabinSpecificNote: null,
  },
  {
    cabinSlug: "cabin-3b",
    welcomeSlug: "cabin-3b",
    shortName: "Ridge Cabin 3B",
    wifi: CURRENT_WIFI,
    wifiNote: WIFI_NOTE,
    doorCode: null,
    parkingNote: null,
    tvNote: null,
    cabinSpecificNote: null,
  },
  {
    cabinSlug: "cabin-5",
    welcomeSlug: "cabin-5",
    shortName: "Ridge Cabin 5",
    wifi: CURRENT_WIFI,
    wifiNote: WIFI_NOTE,
    doorCode: null,
    parkingNote: null,
    tvNote: null,
    cabinSpecificNote: null,
  },
];

export function cabinInfoBySlug(welcomeSlug: string): CabinInfo | undefined {
  return cabinInfo.find((c) => c.welcomeSlug === welcomeSlug);
}
