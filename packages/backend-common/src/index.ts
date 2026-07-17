import { config } from "dotenv";
import { resolve } from "node:path";

config({
  path: [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")],
  override: process.env.NODE_ENV !== "production",
  quiet: true,
});

function requireEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is required. Copy .env.example to .env and set it.`,
    );
  }

  return value;
}

function readPort(name: string, fallback: number) {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535.`);
  }

  return value;
}

export const DATABASE_URL = requireEnvironmentVariable("DATABASE_URL");
export const JWT_SECRET = requireEnvironmentVariable("JWT_SECRET");

if (Buffer.byteLength(JWT_SECRET, "utf8") < 32) {
  throw new Error("JWT_SECRET must be at least 32 bytes long.");
}

export const JWT_ISSUER = "scribbix";
export const JWT_AUDIENCE = "scribbix-web";
export const FRONTEND_URL =
  process.env.FRONTEND_URL?.trim() || "http://localhost:3002";
export const HTTP_PORT = process.env.HTTP_PORT?.trim()
  ? readPort("HTTP_PORT", 3001)
  : readPort("PORT", 3001);
export const PUBLIC_HTTP_URL =
  process.env.PUBLIC_HTTP_URL?.trim() || `http://localhost:${HTTP_PORT}`;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim() || "";
export const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID?.trim() || "";
export const GITHUB_CLIENT_SECRET =
  process.env.GITHUB_CLIENT_SECRET?.trim() || "";
export const WS_PORT = readPort("WS_PORT", 8080);
