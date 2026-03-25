"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAccounts() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("ไม่ได้เข้าสู่ระบบ");
  }

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return accounts;
}

export async function getUserWithPackage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("ไม่ได้เข้าสู่ระบบ");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      package: true,
      accounts: true,
    },
  });

  if (!user) {
    throw new Error("ไม่พบข้อมูลผู้ใช้");
  }

  return user;
}

export async function checkAccountQuota(platform: "FACEBOOK" | "LINE") {
  const user = await getUserWithPackage();

  if (!user.package) {
    return {
      canAdd: false,
      message: "กรุณาเลือกแพ็กเกจก่อนเพิ่มบัญชี",
      current: 0,
      max: 0,
    };
  }

  const currentCount = user.accounts.filter(
    (acc: { platform: string }) => acc.platform === platform
  ).length;

  const maxAllowed =
    platform === "FACEBOOK"
      ? user.package.maxFbAccounts
      : user.package.maxLineAccounts;

  return {
    canAdd: currentCount < maxAllowed,
    message:
      currentCount >= maxAllowed
        ? `คุณใช้โควต้าครบแล้ว (${currentCount}/${maxAllowed}) กรุณาอัปเกรดแพ็กเกจ`
        : `คุณสามารถเพิ่มได้อีก ${maxAllowed - currentCount} บัญชี`,
    current: currentCount,
    max: maxAllowed,
  };
}

export async function addAccountPlaceholder(data: {
  platform: "FACEBOOK" | "LINE";
  accountName: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("ไม่ได้เข้าสู่ระบบ");
  }

  // Check quota
  const quota = await checkAccountQuota(data.platform);
  if (!quota.canAdd) {
    throw new Error(quota.message);
  }

  // Placeholder: Create account with PENDING status
  const account = await prisma.account.create({
    data: {
      userId: session.user.id,
      platform: data.platform,
      accountName: data.accountName,
      status: "PENDING",
    },
  });

  revalidatePath("/accounts");
  return account;
}

export async function deleteAccount(accountId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("ไม่ได้เข้าสู่ระบบ");
  }

  // Verify ownership
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId: session.user.id,
    },
  });

  if (!account) {
    throw new Error("ไม่พบบัญชีหรือคุณไม่มีสิทธิ์ลบบัญชีนี้");
  }

  await prisma.account.delete({
    where: { id: accountId },
  });

  revalidatePath("/accounts");
  return { success: true };
}
