import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const url = process.env.DATABASE_URL;
  console.log("กำลังใช้ฐานข้อมูล:", url);
  
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({
    adapter,
    log: ["info", "warn", "error"],
  });

  console.log("กำลังเพิ่มข้อมูลแพ็กเกจ...");

  await prisma.package.upsert({
    where: { name: "Starter" },
    update: {},
    create: {
      name: "Starter",
      price: 0,
      maxFbAccounts: 1,
      maxLineAccounts: 1,
      isPopular: false,
      description: "เหมาะสำหรับผู้เริ่มต้น",
    },
  });

  await prisma.package.upsert({
    where: { name: "Value" },
    update: {},
    create: {
      name: "Value",
      price: 299,
      maxFbAccounts: 5,
      maxLineAccounts: 3,
      isPopular: true,
      description: "คุ้มค่าที่สุดสำหรับทีมที่กำลังเติบโต",
    },
  });

  await prisma.package.upsert({
    where: { name: "Pro" },
    update: {},
    create: {
      name: "Pro",
      price: 799,
      maxFbAccounts: 20,
      maxLineAccounts: 10,
      isPopular: false,
      description: "พลังไร้ขีดจำกัดสำหรับมืออาชีพ",
    },
  });

  console.log("เพิ่มข้อมูลเรียบร้อยแล้ว");
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });