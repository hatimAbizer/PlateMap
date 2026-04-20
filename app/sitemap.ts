import type { MetadataRoute } from "next";
import { createServerSupabase } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("restaurants")
    .select("slug, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5000);

  const rows = (data ?? []) as Array<{ slug: string; updated_at: string }>;

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/search`, changeFrequency: "daily", priority: 0.8 },
  ];

  const restaurantEntries: MetadataRoute.Sitemap = rows.map((r) => ({
    url: `${siteUrl}/restaurant/${r.slug}`,
    lastModified: new Date(r.updated_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...restaurantEntries];
}
