import type { NextConfig } from "next";
import { config } from "dotenv";
import { resolve } from "node:path";

config({
  path: [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")],
  override: process.env.NODE_ENV !== "production",
  quiet: true,
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
