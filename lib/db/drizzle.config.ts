import { defineConfig } from "drizzle-kit";
import path from "path";
import { config as loadEnv } from "dotenv";

// Load .env — try multiple locations so it works wherever the command is run from
loadEnv({ path: path.join(process.cwd(), "../../.env") });
loadEnv({ path: path.join(process.cwd(), ".env"), override: false });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL not found. Make sure your .env file exists in the project root folder and contains DATABASE_URL=postgresql://..."
  );
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
