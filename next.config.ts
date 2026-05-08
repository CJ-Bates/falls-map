import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Hostaway CDN images (cabin photos pulled from booking.thefallsatlionsden.com listings)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "bookingenginecdn.hostaway.com" },
    ],
  },
};

export default nextConfig;
