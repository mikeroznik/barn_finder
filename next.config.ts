import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page reads the visitor's Supabase session cookie, so pages render
  // per request rather than using Cache Components.
  turbopack: {
    // A package-lock.json further up the drive would otherwise be picked as the root.
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
