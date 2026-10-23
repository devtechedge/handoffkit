import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://handoffkit-seven.vercel.app").replace(
    /\/$/,
    "",
  );
  const routes = ["", "/demo", "/pricing", "/contact", "/terms", "/privacy", "/refunds"];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/demo" || route === "/pricing" ? 0.8 : 0.4,
  }));
}
