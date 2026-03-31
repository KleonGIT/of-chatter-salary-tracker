import { defineConfig } from "drizzle-kit";
import path from "path";
import { config as loadEnv } from "dotenv";

// Load .env from the project root (two levels up from lib/db)
loadEnv({ path: path.resolve(__dirname, "../../.env") });
// Fallback: also try the current working directory
loadEnv({ path: path.resolve(process.cwd(), "../../.env"), override: false });
loadEnv({ override: false });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL not found. Make sure your .env file exists in the project root folder and contains DATABASE_URL=postgresql://..."
  );
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
