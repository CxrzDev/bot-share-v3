"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  validateFacebookCredential,
  validateLineToken,
} from "@/lib/services/validator";

export type ActionResult<T = undefined> = {
  success: boolean;
  error?: string;
  warning?: string;
  data?: T;
};

// ─── Add Account ─────────────────────────────────────────────────────────────

export async function addAccountAction(input: {
  platform: "FACEBOOK" | "LINE";
  accountName: string;
  credential: string;
}): Promise<ActionResult<{ id: string; accountName: string; status: string }>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "ไม่ได้เข้าสู่ระบบ กรุณาล็อกอินใหม่" };
  }

  try {
    // ── 1. Quota check ──────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { package: true, accounts: true },
    });

    if (!user?.package) {
      return {
        success: false,
        error: "ไม่พบข้อมูลแพ็กเกจ กรุณาเลือกแพ็กเกจก่อน",
      };
    }

    const samePlatformCount = user.accounts.filter(
      (a) => a.platform === input.platform
    ).length;

    const maxAllowed =
      input.platform === "FACEBOOK"
        ? user.package.maxFbAccounts
        : user.package.maxLineAccounts;

    if (samePlatformCount >= maxAllowed) {
      return {
        success: false,
        error: `โควต้าครบแล้ว (${samePlatformCount}/${maxAllowed}) กรุณาอัปเกรดแพ็กเกจ`,
      };
    }

    // ── 2. Token/cookie validation (server-side — never expose to client) ───
    const validation =
      input.platform === "FACEBOOK"
        ? await validateFacebookCredential(input.credential)
        : await validateLineToken(input.credential);

    const status = validation.valid ? "ACTIVE" : "ERROR";
    // Use the name resolved from the API if available, otherwise use user input
    const resolvedName = validation.resolvedName?.trim() || input.accountName;

    // ── 3. Persist to DB ────────────────────────────────────────────────────
    const account = await prisma.account.create({
      data: {
        userId: session.user.id,
        platform: input.platform,
        accountName: resolvedName,
        ...(input.platform === "FACEBOOK"
          ? { cookie: input.credential }
          : { token: input.credential }),
        status,
        lastChecked: new Date(),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");

    if (!validation.valid) {
      return {
        success: true,
        warning: `บันทึกบัญชีแล้ว แต่ตรวจสอบ Token ไม่ผ่าน: ${validation.error} — สถานะถูกตั้งเป็น "ผิดพลาด"`,
        data: {
          id: account.id,
          accountName: account.accountName,
          status: account.status,
        },
      };
    }

    return {
      success: true,
      data: {
        id: account.id,
        accountName: account.accountName,
        status: account.status,
      },
    };
  } catch (err) {
    console.error("[ADD_ACCOUNT_ERROR]", err);
    return { success: false, error: "เกิดข้อผิดพลาดในฐานข้อมูล กรุณาลองใหม่" };
  }
}

// ─── Toggle Account Status ────────────────────────────────────────────────────

export async function toggleAccountStatus(
  accountId: string
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "ไม่ได้เข้าสู่ระบบ" };
  }

  try {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: session.user.id },
    });

    if (!account) {
      return { success: false, error: "ไม่พบบัญชีหรือคุณไม่มีสิทธิ์เข้าถึง" };
    }

    const newStatus = account.status === "ACTIVE" ? "PENDING" : "ACTIVE";

    await prisma.account.update({
      where: { id: accountId },
      data: { status: newStatus },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    return { success: true };
  } catch (err) {
    console.error("[TOGGLE_ACCOUNT_ERROR]", err);
    return { success: false, error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
  }
}

// ─── Delete Account ───────────────────────────────────────────────────────────

export async function deleteAccountAction(
  accountId: string
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "ไม่ได้เข้าสู่ระบบ" };
  }

  try {
    // Verify ownership before deleting
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: session.user.id },
    });

    if (!account) {
      return {
        success: false,
        error: "ไม่พบบัญชีหรือคุณไม่มีสิทธิ์ลบบัญชีนี้",
      };
    }

    // Cascade delete removes all related schedules (onDelete: Cascade in schema)
    await prisma.account.delete({ where: { id: accountId } });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    return { success: true };
  } catch (err) {
    console.error("[DELETE_ACCOUNT_ERROR]", err);
    return { success: false, error: "เกิดข้อผิดพลาดในการลบ กรุณาลองใหม่" };
  }
}
