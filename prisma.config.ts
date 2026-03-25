import { defineConfig } from "@prisma/config";
import * as dotenv from "dotenv";
import path from "path";

// ✅ บังคับให้โหลดค่าจาก .env.local เพื่อให้ Prisma เห็นค่า DATABASE_URL ของ Supabase
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

export default defineConfig({
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // ดึงค่ามาใช้ ถ้าไม่มีค่าจะฟ้อง Error ชัดเจนก่อนรันครับ
    url: process.env.DATABASE_URL,
  },
});