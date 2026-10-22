import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SmartLamp Digital Twin",
    short_name: "SmartLamp",
    description:
      "3D smart city digital twin of an ESP32 based adaptive street lighting management system.",
    start_url: "/",
    display: "standalone",
    background_color: "#050816",
    theme_color: "#050816",
    orientation: "any",
    categories: ["education", "utilities", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
