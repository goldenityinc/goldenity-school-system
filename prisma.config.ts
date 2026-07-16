import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    // Generate does not need a live DB connection; fallback keeps build-time generation stable.
    url: process.env["DATABASE_URL"] ?? "postgresql://postgres:postgres@localhost:5432/goldenity"
  }
});
