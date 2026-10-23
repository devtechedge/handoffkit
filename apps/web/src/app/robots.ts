import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://handoffkit-seven.vercel.app").replace(
    /\/$/,
    "",
  );
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app/", "/api/", "/p/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
