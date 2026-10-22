import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://iot-street-lighting.vercel.app";
  const sections = [
    "overview",
    "components",
    "digital-twin",
    "sensors",
    "architecture",
    "dashboard",
    "telegram",
    "faults",
    "workflow",
    "report",
    "benefits",
    "stack",
  ];

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...sections.map((section) => ({
      url: `${base}/#${section}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
