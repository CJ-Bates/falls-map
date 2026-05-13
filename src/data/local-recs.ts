// Off-property recommendations — places to send guests within ~20 minutes.
// Surfaced on the /nearby page. Coords are best-estimates from addresses;
// each pin gets refined once placement is verified (then we wire them
// onto the property map as a togglable overlay).

export type LocalRecCategory = "food" | "drink" | "shop" | "fuel" | "park";

export type LocalRec = {
  slug: string;
  name: string;
  category: LocalRecCategory;
  town: "Imperial" | "Kimmswick" | "Arnold";
  blurb: string;       // 1-line guest-facing description
  address: string;     // human-readable; deep-linked to maps
  lat: number;
  lng: number;
  approximate?: boolean; // true while pin placement hasn\u2019t been verified
  hours?: string;        // optional schedule note
  url?: string;          // optional website
};

export const LOCAL_RECS: LocalRec[] = [
  // ===== FOOD — Imperial =====
  {
    slug: "frankie-gianinos",
    name: "Frankie Gianino\u2019s Grill & Bar",
    category: "food",
    town: "Imperial",
    blurb: "Top-rated family-owned Italian, pub-grill vibe. Great dinner option.",
    address: "1209 Main St, Imperial, MO 63052",
    lat: 38.36898, lng: -90.38539, approximate: true,
    url: "https://www.dinefg.com/",
  },
  {
    slug: "adelitas-mexican",
    name: "Adelita\u2019s Mexican Cuisine",
    category: "food",
    town: "Imperial",
    blurb: "Newer Mexican spot, well-loved for lunch.",
    address: "1235 Imperial Main, Imperial, MO 63052",
    lat: 38.36932, lng: -90.38509, approximate: true,
    url: "https://adelitasmexicancuisinemo.com/",
  },
  {
    slug: "detour-bar-grill",
    name: "Detour Bar & Grill",
    category: "food",
    town: "Imperial",
    blurb: "Closer-to-property bar & grill. Casual and easy.",
    address: "2855 Seckman Rd, Imperial, MO 63052",
    lat: 38.39615, lng: -90.39203, approximate: true,
    url: "http://detourgrillandbar.com/",
  },
  {
    slug: "star-cafe",
    name: "Star Cafe",
    category: "food",
    town: "Imperial",
    blurb: "Coffee + light bites. Closest cafe to the property.",
    address: "2868 Seckman Rd, Imperial, MO 63052",
    lat: 38.39641, lng: -90.39241, approximate: true,
    url: "https://www.starcafeseckman.com/",
  },

  // ===== FOOD — Kimmswick =====
  {
    slug: "blue-owl-restaurant",
    name: "The Blue Owl Restaurant & Bakery",
    category: "food",
    town: "Kimmswick",
    blurb: "Famous Levee High Apple Pie (Oprah\u2019s Favorite Things). Home-style breakfast + lunch.",
    address: "6116 2nd St, Kimmswick, MO 63053",
    lat: 38.36647, lng: -90.36165, approximate: true,
    hours: "Tue\u2013Sun 10am\u20133pm \u00b7 reservations strongly recommended",
    url: "https://theblueowl.com/",
  },
  {
    slug: "dough-depot",
    name: "Dough Depot",
    category: "food",
    town: "Kimmswick",
    blurb: "Cozy Kimmswick cafe \u2014 pizza and more. Christmas-charm vibe.",
    address: "216 Market St, Kimmswick, MO 63053",
    lat: 38.36668, lng: -90.36245, approximate: true,
    url: "https://www.gokimmswick.com/business-directory/dough-depot-cafe/",
  },
  {
    slug: "lachance-winery",
    name: "LaChance Winery & Restaurant",
    category: "drink",
    town: "Kimmswick",
    blurb: "Wine + dinner in the historic Old House. Evening destination.",
    address: "6035 Second St, Kimmswick, MO 63053",
    lat: 38.36625, lng: -90.36213, approximate: true,
    url: "https://lachancevineyards.com/",
  },

  // ===== FOOD — Arnold =====
  {
    slug: "twisted-tavern",
    name: "Twisted Tavern",
    category: "food",
    town: "Arnold",
    blurb: "Burgers + bourbon. Twisted chicken sandwiches and twisted waffles.",
    address: "3606 W Outer Rd, Arnold, MO 63010",
    lat: 38.40663, lng: -90.39144, approximate: true,
    url: "https://www.twistedtavernstl.com/",
  },
  {
    slug: "sybergs-arnold",
    name: "Syberg\u2019s Arnold",
    category: "food",
    town: "Arnold",
    blurb: "Sports bar / grill. Wings, lobster mac, good service.",
    address: "249 Arnold Crossroads Center, Arnold, MO 63010",
    lat: 38.43441, lng: -90.37562, approximate: true,
    url: "https://sybergs.com/locations/arnold/",
  },
  {
    slug: "sj-snoball-custard",
    name: "S&J Sno-Ball & Custard Shop",
    category: "food",
    town: "Arnold",
    blurb: "Snowballs + frozen custard. Local favorite for hot afternoons.",
    address: "3857 W Outer Rd, Arnold, MO 63010",
    lat: 38.40934, lng: -90.39351, approximate: true,
    url: "https://sjsnoballshop.com/",
  },

  // ===== SHOP — grocery / markets =====
  {
    slug: "herrells-market",
    name: "Herrell\u2019s Market",
    category: "shop",
    town: "Imperial",
    blurb: "Small market with a great butcher. Fresh meats.",
    address: "1015 W Main St, Imperial, MO 63052",
    lat: 38.36833, lng: -90.38700, approximate: true,
    url: "https://www.facebook.com/HerrellsMarket/",
  },
  {
    slug: "schnucks-arnold-richardson",
    name: "Schnucks Richardson Road",
    category: "shop",
    town: "Arnold",
    blurb: "Closest full-size supermarket. Has gas at most locations.",
    address: "3900 Vogel Rd, Arnold, MO 63010",
    lat: 38.41922, lng: -90.37705, approximate: true,
    url: "https://schnucks.com/locations/mo-arnold-127",
  },
  {
    slug: "dierbergs-arnold-commons",
    name: "Dierbergs \u2014 Arnold Commons",
    category: "shop",
    town: "Arnold",
    blurb: "The other big regional grocer. Slightly premium feel.",
    address: "860 Arnold Commons Dr, Arnold, MO 63010",
    lat: 38.43572, lng: -90.37798, approximate: true,
    url: "https://www.dierbergs.com/store-locations/arnold-commons",
  },
  {
    slug: "walmart-arnold",
    name: "Walmart Supercenter",
    category: "shop",
    town: "Arnold",
    blurb: "One-stop for anything you forgot.",
    address: "2201 Michigan Ave, Arnold, MO 63010",
    lat: 38.43389, lng: -90.37352, approximate: true,
    url: "https://www.walmart.com/store/1514-arnold-mo",
  },

  // ===== FUEL =====
  {
    slug: "express-mart-imperial",
    name: "Express Mart",
    category: "fuel",
    town: "Imperial",
    blurb: "Closest gas station to the property.",
    address: "2865 Seckman Rd, Imperial, MO 63052",
    lat: 38.39629, lng: -90.39221, approximate: true,
  },

  // ===== PARK / outdoors / things to do =====
  {
    slug: "mastodon-state-historic-site",
    name: "Mastodon State Historic Site",
    category: "park",
    town: "Imperial",
    blurb: "431-acre archaeology + paleontology site. Hiking trails, museum with mastodon skeleton, Rock Creek for kids to splash in, picnic area, camping.",
    address: "1050 Charles J Becker Dr, Imperial, MO 63052",
    lat: 38.38733, lng: -90.39593, approximate: true,
    url: "https://mostateparks.com/historic-site/mastodon-state-historic-site",
  },
  {
    slug: "anheuser-estate-museum",
    name: "Anheuser Estate & Museum",
    category: "park",
    town: "Kimmswick",
    blurb: "Ancestral home of the Anheuser brewing family. River views, bald eagles overhead, antiques and the Westward Ho crystal collection inside.",
    address: "Anheuser Estate Rd, Kimmswick, MO 63053",
    lat: 38.36511, lng: -90.35763, approximate: true,
    hours: "Walk-in tours every Thursday noon\u20134pm \u00b7 $10/person",
    url: "https://cityofkimmswick.org/community/anheuser-estate/",
  },
  {
    slug: "kimmswick-historic-district",
    name: "Historic Kimmswick",
    category: "park",
    town: "Kimmswick",
    blurb: "20+ shops, antiques, Americana. Apple Butter Festival (last weekend of October) + Strawberry Festival (June) are the big draws.",
    address: "Main St / 2nd St, Kimmswick, MO 63053",
    lat: 38.36658, lng: -90.36200, approximate: true,
    url: "https://www.gokimmswick.com/",
  },
];
