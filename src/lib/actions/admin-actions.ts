"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("ไม่มีสิทธิ์ดำเนินการ");
  }
  return session;
}

export async function approveTransaction(transactionId: string) {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "ไม่มีสิทธิ์ดำเนินการ" };
  }

  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!tx) return { success: false, error: "ไม่พบรายการ" };
  if (tx.status !== "PENDING") return { success: false, error: "รายการนี้ถูกดำเนินการแล้ว" };

  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

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

  revalidatePath("/dashboard/admin/transactions");
  revalidatePath("/dashboard/pricing");
  return { success: true };
}

export async function rejectTransaction(transactionId: string) {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "ไม่มีสิทธิ์ดำเนินการ" };
  }

  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!tx) return { success: false, error: "ไม่พบรายการ" };
  if (tx.status !== "PENDING") return { success: false, error: "รายการนี้ถูกดำเนินการแล้ว" };

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: "REJECTED" },
  });

  revalidatePath("/dashboard/admin/transactions");
  return { success: true };
}

export async function getAllTransactions() {
  try {
    await requireAdmin();
  } catch {
    return [];
  }

  return prisma.transaction.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      package: { select: { id: true, name: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
