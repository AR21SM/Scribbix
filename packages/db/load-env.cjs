const { config } = require("dotenv");
const { resolve } = require("node:path");

config({
  path: [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")],
  override: process.env.NODE_ENV !== "production",
  quiet: true,
});
