import type { Property } from "./types";

export const property: Property = {
  name: "The Falls at Lions Den",
  tagline: "Where the woods meet the water",
  location: { city: "Imperial", state: "MO", country: "USA" },
  // Center recomputed to encompass all 7 parcels (north Cabin Ridge cluster + south "The 13")
  center: { lat: 38.4055, lng: -90.458 },
  bounds: {
    north: 38.4135,
    south: 38.397,
    east: -90.4467, // shifted slightly east to fit horse pasture
    west: -90.4672,
  },
};

// World rectangle for "off-property" dimming mask. Real parcel polygons
// (loaded from parcels.json) punch holes through it.
export const worldRing: [number, number][] = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];
