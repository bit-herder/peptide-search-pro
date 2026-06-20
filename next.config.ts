import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const isDesktopBuild = process.env.DESKTOP_BUILD === "1";

const nextConfig: NextConfig = {
  ...(isDesktopBuild ? { output: "standalone" as const } : {}),
  ...(process.env.NEXT_PUBLIC_BASE_PATH
    ? { basePath: process.env.NEXT_PUBLIC_BASE_PATH }
    : {}),
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
