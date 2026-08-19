"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageview } from "@/lib/analytics";

// Fires one pageview per client-side navigation. Mounted once in the root
// layout inside <Suspense> (useSearchParams needs a suspense boundary during
// prerender).
function Inner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Don't record the owner poking around the admin dashboard.
    if (pathname.startsWith("/admin")) return;
    trackPageview();
    // searchParams is included so /map?cabin=x counts as its own view.
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsTracker() {
  return <Inner />;
}
