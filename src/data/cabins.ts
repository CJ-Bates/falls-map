import type { Cabin } from "./types";

export const cabins: Cabin[] = [
  {
    slug: "cabin-1",
    name: "Ridge Cabin 1",
    listingTitle: "4 Bedroom Cabin Retreat",
    subtitle: "Full 4-bedroom cabin retreat",
    currentlyRentable: true,
    bedrooms: 4,
    bathrooms: 2,
    maxGuests: 8,
    bedsSummary: "TBD",
    amenities: [
      "Full kitchen (no dishwasher)",
      "Full living space",
      "Washer/dryer",
      "Air conditioning",
      "Fireplace",
      "TV",
      "Free WiFi",
    ],
    description:
      "Spacious 4-bedroom, 2-bathroom cabin nestled in Jefferson County. Secluded location with the perfect blend of comfort and adventure.",
    lat: 38.411291,
    lng: -90.457274,
    coverPhoto:
      "https://bookingenginecdn.hostaway.com/listing/121272-313514-JxMt6wiAcEcc9qYXfxZbH82i3dQ7fbgbE70JSwLQP68-66fc1b0036e77",
    photoCount: 31,
    bookingUrl: "https://booking.thefallsatlionsden.com/listings/313514",
    airbnbUrl: "https://www.airbnb.com/rooms/1257309613473101977",
    bookingId: "313514",
  },
  {
    slug: "cabin-2",
    name: "Ridge Cabin 2",
    listingTitle: "Modern 4 Bedroom Cabin | Games & Pool Table",
    subtitle: "Two-story 4-bedroom with bar & game room",
    currentlyRentable: true,
    bedrooms: 4,
    bathrooms: 3,
    maxGuests: null,
    bedsSummary: "TBD",
    amenities: [
      "Two stories",
      "Full kitchen on main floor",
      "Lower-level living space + bar",
      "Pool table",
      "Vintage Donkey Kong-style multi-game arcade",
    ],
    description:
      "Modern two-story 4-bedroom cabin with bar, pool table, and vintage arcade in the lower level. Full kitchens on both floors.",
    lat: 38.411745,
    lng: -90.456765,
    coverPhoto:
      "https://bookingenginecdn.hostaway.com/listing/121272-398418--NdTKkrWJRBzmpilnReLtwZ4wENFqd9QXsZHWgRPPLc-68600f6db4cf2",
    photoCount: null,
    bookingUrl: "https://booking.thefallsatlionsden.com/listings/398418",
    airbnbUrl: "https://www.airbnb.com/rooms/1435612942707239020",
    bookingId: "398418",
  },
  {
    slug: "cabin-3a",
    name: "Ridge Cabin 3A",
    listingTitle: "Cozy 1-Bedroom Cabin Retreat",
    subtitle: "Cozy King studio",
    currentlyRentable: true,
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: null,
    bedsSummary: "1 King bed",
    amenities: ["Kitchenette", "Full bathroom", "Washer/dryer"],
    description:
      "Half of Ridge Cabin 3 — split into 3A (King) and 3B (Twin) sides. Cozy retreat with kitchenette, bath, and W/D.",
    // Same physical building as 3B — pinned at the SW corner of the cabin.
    lat: 38.411445,
    lng: -90.456637,
    coverPhoto:
      "https://bookingenginecdn.hostaway.com/listing/121272-313511-FieC-Al-0UGZxm0wXkbT17IxW0BOgPBkyBZwWjNQdYs-68ac9fc2a1607",
    photoCount: null,
    bookingUrl: "https://booking.thefallsatlionsden.com/listings/313511",
    airbnbUrl: "https://www.airbnb.com/rooms/1216718886011783505",
    bookingId: "313511",
  },
  {
    slug: "cabin-3b",
    name: "Ridge Cabin 3B",
    listingTitle: "Cozy 1-Bedroom Cabin Retreat",
    subtitle: "Twin retreat",
    currentlyRentable: true,
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: null,
    bedsSummary: "2 Twin beds",
    amenities: ["Kitchenette", "Full bathroom", "Washer/dryer"],
    description:
      "Half of Ridge Cabin 3 — split into 3A (King) and 3B (Twin) sides. Cozy retreat with kitchenette, bath, and W/D.",
    // Same physical building as 3A — pinned at the NE corner of the cabin.
    lat: 38.411517,
    lng: -90.456545,
    coverPhoto:
      "https://bookingenginecdn.hostaway.com/listing/121272-313512-r--G944i4fotZ-Daf1sgTzfjZhaIZRKb2jjX6s--l9GCc-68ac9ff9564c1",
    photoCount: null,
    bookingUrl: "https://booking.thefallsatlionsden.com/listings/313512",
    airbnbUrl: "https://www.airbnb.com/rooms/1257257714600747997",
    bookingId: "313512",
  },
  {
    slug: "cabin-5",
    name: "Ridge Cabin 5",
    listingTitle: "4 Bedroom Cabin Retreat",
    subtitle: "Sister suite (not currently rentable)",
    currentlyRentable: false,
    bedrooms: 4,
    bathrooms: 2,
    maxGuests: null,
    bedsSummary: "TBD",
    amenities: ["Identical layout to Cabin 1", "Full kitchen (no dishwasher)", "Washer/dryer"],
    description:
      "Currently occupied by family — not listed for rental. Hidden from public app by default.",
    lat: 38.411705,
    lng: -90.456331,
    coverPhoto:
      "https://bookingenginecdn.hostaway.com/listing/121272-313513-qGUxqzMs1WsCHBlaEzzMHoyh0veWss9--wkMS6h-ZB0o-68712aad04291",
    photoCount: null,
    bookingUrl: "https://booking.thefallsatlionsden.com/listings/313513",
    airbnbUrl: null,
    bookingId: "313513",
  },
];

// Public-facing cabin list (hides Cabin 5 from guests by default)
export const publicCabins = cabins.filter((c) => c.currentlyRentable);
