import { notFound } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";

// Secret URL gate, validated server-side against the ADMIN_KEY env var
// (Vercel project settings). The key is no longer hardcoded in the repo,
// so rotating it is an env-var change + redeploy, not a code change.
// This page must render dynamically — a static build would bake the
// comparison result (and previously baked the key itself via
// generateStaticParams) into public build output.

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · The Falls",
  robots: "noindex,nofollow",
};

export default async function AdminPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || key !== adminKey) notFound();
  return <AdminDashboard adminKey={key} />;
}
