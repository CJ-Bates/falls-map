import { notFound } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";

// Secret URL gate. Anyone with this slug gets the dashboard; otherwise 404.
// CJ: change this string and redeploy to rotate access.
const ADMIN_KEY = "cj-falls-ops-2026";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ key: ADMIN_KEY }];
}

export const metadata = {
  title: "Admin · The Falls",
  robots: "noindex,nofollow",
};

export default async function AdminPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (key !== ADMIN_KEY) notFound();
  return <AdminDashboard />;
}
