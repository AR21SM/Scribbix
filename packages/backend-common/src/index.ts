export const JWT_SECRET =
  process.env.JWT_SECRET ||
  "default-secret-change-in-production-NEVER-use-this";

if (!process.env.JWT_SECRET) {
  console.warn(
    "⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable in production!",
  );
}
