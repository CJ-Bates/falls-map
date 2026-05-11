import type { Poi } from "./types";

export const pois: Poi[] = [
  {
    slug: "main-lake-pavilion",
    name: "Main Lake Pavilion",
    category: "pavilion",
    zone: "cabin-ridge",
    description:
      "Pavilion overlooking the main lake. Great for family meals, gatherings, or shade after a swim.",
    lat: 38.407201,
    lng: -90.45736,
  },
  {
    slug: "beach-firepit",
    name: "Lake Beach Firepit",
    category: "firepit",
    zone: "cabin-ridge",
    description:
      "Firepit on the main lake's beach — perfect for sunset s'mores after a day on the water.",
    lat: 38.40685,
    lng: -90.45765,
  },
  {
    slug: "upper-ridge-firepit",
    name: "Upper Ridge Firepit",
    category: "firepit",
    zone: "cabin-ridge",
    description: "Quieter firepit up on the ridge.",
    lat: 38.40794,
    lng: -90.45948,
  },
  {
    slug: "nature-barn",
    name: "Nature Barn",
    category: "barn",
    zone: "cabin-ridge",
    description: "TBD",
    lat: 38.411086,
    lng: -90.459722,
  },
  {
    slug: "shooting-shack",
    name: "Shooting Shack",
    category: "shack",
    zone: "cabin-ridge",
    description: "TBD",
    lat: 38.406099,
    lng: -90.45972,
  },
  {
    slug: "the-13-pavilion",
    name: "The 13 Pavilion",
    category: "pavilion",
    zone: "the-13",
    description: "Pavilion at The 13 — south parcel.",
    lat: 38.399841,
    lng: -90.4618,
  },
  {
    slug: "the-13-firepit",
    name: "The 13 Firepit",
    category: "firepit",
    zone: "the-13",
    description: "Firepit at The 13.",
    lat: 38.399964,
    lng: -90.461554,
  },
  {
    slug: "the-13-dock",
    name: "The 13 Dock",
    category: "lake-feature",
    zone: "the-13",
    description: "Dock at The 13's lake.",
    lat: 38.400464,
    lng: -90.46106,
  },
  {
    slug: "treehouse",
    name: "Treehouse",
    category: "treehouse",
    zone: "the-13",
    description: "TBD",
    lat: 38.399401,
    lng: -90.460676,
  },
];

// Style metadata per category — used to color pins on the map
export const categoryStyle: Record<
  string,
  { label: string; color: string; emoji: string }
> = {
  cabin: { label: "Cabin", color: "#B23A1F", emoji: "🛖" },
  pavilion: { label: "Pavilion", color: "#7A5A2F", emoji: "⛱️" },
  firepit: { label: "Firepit", color: "#D9531E", emoji: "🔥" },
  "lake-feature": { label: "Lake / Dock", color: "#2E6FA0", emoji: "🛶" },
  barn: { label: "Barn", color: "#6B4423", emoji: "🏚️" },
  treehouse: { label: "Treehouse", color: "#3F6B2A", emoji: "🌳" },
  shack: { label: "Shack", color: "#5A4A3A", emoji: "🎯" },
  trailhead: { label: "Trailhead", color: "#4A6B3A", emoji: "🥾" },
  parking: { label: "Parking", color: "#555", emoji: "🅿️" },
  "scenic-viewpoint": { label: "Viewpoint", color: "#8C6E2A", emoji: "🔭" },
  waterfall: { label: "Waterfall", color: "#3A8FB7", emoji: "💧" },
};
