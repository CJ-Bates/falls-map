// Shared types for the property data layer.
// Keep these in sync with /content/*.json (the human-editable source).

export type LatLng = { lat: number; lng: number };

export type PoiCategory =
  | "pavilion"
  | "firepit"
  | "lake-feature"
  | "barn"
  | "treehouse"
  | "shack"
  | "trailhead"
  | "parking"
  | "scenic-viewpoint"
  | "waterfall"
  | "bear"
  | "bobcat"
  | "entrance"
  | "warn"
  | "cabin";

export type Cabin = {
  slug: string;
  name: string;
  listingTitle: string;
  subtitle: string;
  currentlyRentable: boolean;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number | null;
  bedsSummary: string;
  amenities: string[];
  description: string;
  lat: number;
  lng: number;
  coverPhoto: string;
  photoCount: number | null;
  bookingUrl: string;
  airbnbUrl: string | null;
  bookingId: string;
};

export type Poi = {
  slug: string;
  name: string;
  category: PoiCategory;
  zone: "cabin-ridge" | "the-13";
  description: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  story?: string;
};

export type TrailMeta = {
  slug: string;
  name: string;
  surface: "paved" | "gravel" | "4wd" | "trail";
  description?: string;
  coords: number[][];
  lengthM: number;
};

export type Property = {
  name: string;
  tagline: string;
  location: { city: string; state: string; country: string };
  center: LatLng;
  bounds: { north: number; south: number; east: number; west: number };
};
