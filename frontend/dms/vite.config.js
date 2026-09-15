import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        id: "/",
        name: "Prime Rides DMS",
        short_name: "Prime Rides",
        description: "Prime Rides Dealership Management System",
        start_url: "/",
        scope: "/",
        display: "standalone",

        // Leave these as temporary placeholders for now.
        // We will replace them with your actual brand colors.
        theme_color: "#07152D",
        background_color: "#07152D",

        icons: [
          {
            src: "/icons/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/pwa-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
