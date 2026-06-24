import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://miiam.in";

  const staticPages = [
    "",
    "/app/explore",
    "/app/services",
    "/app/food",
    "/app/grocery",
    "/app/pharmacy",
    "/app/flowers",
    "/app/printing",
    "/app/cart",
    "/app/checkout",
    "/app/orders",
    "/app/bookings",
    "/app/profile",
    "/app/addresses",
    "/app/notifications",
    "/app/support",
    "/app/feedback",
    "/terms",
    "/privacy",
  ];

  const servicePages = [
    "ac-deep-cleaning",
    "ac-gas-refill",
    "ac-repair",
    "full-home-cleaning",
    "bathroom-cleaning",
    "kitchen-cleaning",
    "tap-repair",
    "toilet-repair",
    "pipe-leakage",
    "fan-installation",
    "switch-board-repair",
    "mcb-trip-fix",
    "salon-for-women",
    "full-body-spa",
    "manicure-pedicure",
    "facial",
    "hair-spa",
    "salon-for-men",
    "cockroach-control",
    "termite-control",
    "bed-bug-control",
    "car-detailing",
    "ac-vent-cleaning",
    "car-waxing",
    "washing-machine",
    "refrigerator",
    "microwave",
    "geyser-installation",
  ];

  const serviceRoutes = servicePages.map((slug) => ({
    url: `${baseUrl}/app/services/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const staticRoutes = staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" as const : "weekly" as const,
    priority: path === "" ? 1.0 : 0.8,
  }));

  return [...staticRoutes, ...serviceRoutes];
}
