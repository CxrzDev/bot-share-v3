"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitPaymentAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "กรุณาเข้าสู่ระบบก่อน" };
  }

  const packageId = formData.get("packageId") as string;
  const slip = formData.get("slip") as File | null;

  if (!packageId) return { success: false, error: "ไม่พบข้อมูลแพ็กเกจ" };
  if (!slip || slip.size === 0) return { success: false, error: "กรุณาแนบสลิปการโอนเงิน" };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(slip.type)) {
    return { success: false, error: "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP)" };
  }

  if (slip.size > 5 * 1024 * 1024) {
    return { success: false, error: "ขนาดไฟล์ต้องไม่เกิน 5 MB" };
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) return { success: false, error: "ไม่พบแพ็กเกจที่เลือก" };

  const pendingTx = await prisma.transaction.findFirst({
    where: { userId: session.user.id, packageId, status: "PENDING" },
  });
  if (pendingTx) {
    return { success: false, error: "คุณมีรายการรอตรวจสอบอยู่แล้ว กรุณารอการยืนยัน" };
  }

  const bytes = await slip.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = slip.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "slips");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  const slipUrl = `/uploads/slips/${filename}`;

  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      packageId,
      amount: pkg.price,
      slipUrl,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/pricing");
  return { success: true, packageName: pkg.name };
}

export async function approvePaymentAction(transactionId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "ไม่มีสิทธิ์ดำเนินการ" };
  }

  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });
  if (!tx) return { success: false, error: "ไม่พบรายการ" };
  if (tx.status !== "PENDING") {
    return { success: false, error: "รายการนี้ถูกดำเนินการแล้ว" };
  }

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "SUCCESS" },
    }),
    prisma.user.update({
      where: { id: tx.userId },
      data: { currentPackageId: tx.packageId, packageExpiry: expiry },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pricing");
  return { success: true };
}

export async function rejectPaymentAction(transactionId: string, note?: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "ไม่มีสิทธิ์ดำเนินการ" };
  }

  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!tx) return { success: false, error: "ไม่พบรายการ" };

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: "REJECTED", note: note ?? null },
  });

  revalidatePath("/dashboard/pricing");
  return { success: true };
}

export async function getUserTransactions() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  return prisma.transaction.findMany({
    where: { userId: session.user.id },
    include: { package: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}
