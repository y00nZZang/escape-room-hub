import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/schema.ts",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://escape_room_hub:escape_room_hub_local@localhost:5432/escape_room_hub",
  },
  strict: true,
});
