import type { Property } from "./types";

export const property: Property = {
  name: "The Falls at Lions Den",
  tagline: "Where the woods meet the water",
  location: { city: "Imperial", state: "MO", country: "USA" },
  center: { lat: 38.4055, lng: -90.4585 },
  bounds: {
    north: 38.4135,
    south: 38.399,
    east: -90.4533,
    west: -90.4672,
  },
};

// Property boundary polygons in [lng, lat] order (GeoJSON convention).
// Main parcel comes from the surveyor's "Approximate Property Lines.xlsx" (13 points).
// The 13 parcel is approximated until CJ provides a real surveyor file for that lot.
export const propertyAreas: { id: string; name: string; ring: [number, number][]; approximate?: boolean }[] = [
  {
    id: "main",
    name: "Cabin Ridge (main parcel)",
    ring: [
      [-90.454472, 38.405861],
      [-90.456806, 38.404611],
      [-90.467000, 38.404667],
      [-90.467167, 38.407639],
      [-90.461222, 38.413167],
      [-90.459361, 38.413028],
      [-90.459250, 38.411306],
      [-90.456750, 38.412111],
      [-90.456139, 38.411972],
      [-90.456111, 38.411472],
      [-90.455833, 38.410361],
      [-90.455944, 38.408556],
      [-90.456639, 38.407917],
      [-90.454472, 38.405861],
    ],
  },
  {
    id: "the-13",
    name: "The 13 (south parcel)",
    approximate: true,
    ring: [
      [-90.4640, 38.398200],
      [-90.4585, 38.398200],
      [-90.4585, 38.401300],
      [-90.4640, 38.401300],
      [-90.4640, 38.398200],
    ],
  },
];

// World rectangle for "off-property" dimming mask. Covers the entire visible world,
// then the property polygons punch holes through it.
export const worldRing: [number, number][] = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];
