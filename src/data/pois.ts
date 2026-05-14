import type { Poi } from "./types";

export const pois: Poi[] = [
  {
    slug: "main-lake-pavilion",
    name: "Main Lake Pavilion",
    category: "pavilion",
    zone: "cabin-ridge",
    description:
      "Open-air pavilion right by the main lake. Picnic-table seating and easy access to the beach, the firepit, the swimming, and the dock.",
    story:
      "Pull up here for the afternoon — picnic, splash, fish, plug in an amp. With the beach firepit a few steps away, the night writes itself.",
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
    lat: 38.40707,
    lng: -90.45752,
  },
  {
    slug: "upper-ridge-firepit",
    name: "Upper Ridge Firepit",
    category: "firepit",
    zone: "cabin-ridge",
    description:
      "The highest firepit on the property — south-facing log benches at the edge of the ridge with an open view over Mastodon Valley. Stacked firewood right there; hitching rail for the horses on the right.",
    story:
      "Best spot to catch the late-afternoon light spilling over the Valley. Bring a folding chair if the benches are full, and a flashlight for the walk back — it gets dark quickly out here.",
    lat: 38.4081,
    lng: -90.459661,
    photoUrl: "/photos/upper-ridge-firepit.jpg",
  },
  {
    slug: "nature-barn",
    name: "Nature Barn",
    category: "barn",
    zone: "cabin-ridge",
    description:
      "Storage shed with a row of weathered animal skulls hanging on the outside wall. Looks haunted, isn't.",
    story:
      "Don't let the skulls fool you — they're just old finds the family hung up over the years. The barn itself is where the lawn mowers live. Worth a walk-by if you like the rustic-spooky look.",
    lat: 38.411086,
    lng: -90.459722,
  },
  {
    slug: "shooting-shack",
    name: "Shooting Shack",
    category: "shack",
    zone: "cabin-ridge",
    description:
      "Tiny pavilion where the family shoots. Picnic table underneath (the birds get to it before guests do).",
    story:
      "Spent shell casings glitter in the grass around it. Bring ear protection if you're putting it to use; otherwise it's still a quiet seat with a view — if the table's clean.",
    lat: 38.406099,
    lng: -90.45972,
  },
  {
    slug: "the-13-pavilion",
    name: "The 13 Pavilion",
    category: "pavilion",
    zone: "the-13",
    description:
      "Heavy-timber pavilion on the shore of The 13's lake. Stone columns and a full chimney, antler chandelier overhead, picnic tables under the roof, sconces that warm the whole place after dark.",
    story:
      "The crown jewel of The 13. Stone foundations, hand-hewn beams, antler chandelier overhead — built to last a century. Pull a chair up to the chimney on a cool fall evening and you'll understand why it's the table everybody fights over.",
    lat: 38.399841,
    lng: -90.4618,
    photoUrl: "/photos/the-13-pavilion.jpg",
  },
  {
    slug: "the-13-firepit",
    name: "The 13 Firepit",
    category: "firepit",
    zone: "the-13",
    description:
      "Massive stone-and-mortar fireplace right at the water's edge, just down the steps from the pavilion. Walkways connect it to the dock; the treehouse looks down from the hill.",
    story:
      "The best bonfire seat on the property. Pour a drink, drop into a chair, and watch the lake while somebody else worries about the fishing.",
    lat: 38.399964,
    lng: -90.461554,
  },
  {
    slug: "the-13-dock",
    name: "The 13 Dock",
    category: "lake-feature",
    zone: "the-13",
    description:
      "Fishing and swimming dock at the south lake. Lay out in the sun, fish off the end, or just jump in.",
    story:
      "Heads up: water snakes hang around the rocks at the base. Harmless but startling — give them a beat and they'll move along.",
    lat: 38.400464,
    lng: -90.46106,
  },
  {
    slug: "treehouse",
    name: "Treehouse",
    category: "treehouse",
    zone: "the-13",
    description:
      "Single room with a deck wrapped around it, perched up the hill from The 13 Pavilion. Best for a moment of quiet — not really a gathering spot.",
    story:
      "Steep walk up from the pavilion, but the deck looks out over the pond and the whole south parcel. Worth the climb if you've got fifteen quiet minutes.",
    lat: 38.399401,
    lng: -90.460676,
  },
  {
    slug: "the-13-bobcat",
    name: "Bobby",
    category: "bobcat",
    zone: "the-13",
    description:
      "Chainsaw-carved bobcat perched on the painted '13' post along the road south, pointing the way to The 13.",
    story:
      "For years a real bobcat used to run this trail ahead of anyone heading down to The 13 — vanishing into the brush whenever you looked, turning up at the next bend like he was making sure you didn\'t take the wrong fork. He\'s mostly retired these days, but sharp-eyed guests still catch a flash of spots through the trees. Bobby just makes sure the post is in the right place.",
    lat: 38.40482,
    lng: -90.45662,
    photoUrl: "/photos/the-13-bobcat.jpg",
  },
  {
    slug: "lake-bear",
    name: "Big Lou",
    category: "bear",
    zone: "cabin-ridge",
    description:
      "Chainsaw-carved black bear standing watch over the main lake. Holding the same fish for years — won't let go for anybody.",
    story:
      "They say Lou was the friendliest black bear ever to wander these woods — showed up at the lake most evenings, fished for a while, and ambled home without bothering a soul. Guests still claim to spot him down by the water from time to time, though biologists insist Missouri black bears don't roam this far north. Lou begs to differ.",
    lat: 38.40763,
    lng: -90.45747,
    photoUrl: "/photos/bear-carving.jpg",
  },
  {
    slug: "property-entrance",
    name: "Property Entrance",
    category: "entrance",
    zone: "cabin-ridge",
    description:
      "The correct way in. Turn off Lions Den Rd onto Lefarth Road — it becomes Valley Lakes Trail at the gate.",
    story:
      "GPS will sometimes try to route you through Living Well Village via Sunny Creek. Don't trust it — that road doesn't connect to our cabins. Lefarth Road is the only way in.",
    lat: 38.4116821,
    lng: -90.4479641,
  },
  {
    slug: "sunny-creek-wrong-way",
    name: "Not the way in",
    category: "warn",
    zone: "cabin-ridge",
    description:
      "Sunny Creek Rd leads to Living Well Village next door. It does not connect to our cabins. Turn around and take Lefarth Road instead.",
    lat: 38.41438,
    lng: -90.45221,
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
  bear: { label: "Bear Carving", color: "#1f1410", emoji: "🐻" },
  bobcat: { label: "Bobcat Carving", color: "#1f1410", emoji: "🐈" },
  entrance: { label: "Property Entrance", color: "#7d8f5a", emoji: "🚪" },
  warn: { label: "Heads up", color: "#B23A1F", emoji: "⚠️" },
  trailhead: { label: "Trailhead", color: "#4A6B3A", emoji: "🥾" },
  parking: { label: "Parking", color: "#555", emoji: "🅿️" },
  "scenic-viewpoint": { label: "Viewpoint", color: "#8C6E2A", emoji: "🔭" },
  waterfall: { label: "Waterfall", color: "#3A8FB7", emoji: "💧" },
};
