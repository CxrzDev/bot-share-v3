import { defineConfig } from "@prisma/config";
import * as dotenv from "dotenv";
import path from "path";

// ✅ บังคับให้โหลดไฟล์ .env.local จากโฟลเดอร์ปัจจุบัน
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

export default defineConfig({
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // ดึงค่า DATABASE_URL ที่โหลดมาจาก .env.local
    url: process.env.DATABASE_URL,
  },
});