import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/rider/",
          "/api/",
          "/auth/",
          "/app/settings/",
          "/app/wallet/",
        ],
      },
    ],
    sitemap: "https://miiam.in/sitemap.xml",
  };
}
