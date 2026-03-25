"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createScheduleSchema = z.object({
  accountId: z.string().min(1, "กรุณาเลือกบัญชี"),
  targetGroup: z.string().min(3, "กรุณาระบุ Group ID / URL"),
  messages: z.string().min(1, "กรุณากรอกข้อความอย่างน้อย 1 บรรทัด"),
  scheduledTime: z.string().min(1, "กรุณาเลือกวันเวลา"),
  loopCount: z.coerce.number().int().min(1).max(9999).default(1),
  autoDelay: z.boolean().default(true),
  delayMs: z.coerce.number().int().min(0).max(60000).default(950),
});

export async function createScheduleAction(formData: z.infer<typeof createScheduleSchema>) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "กรุณาเข้าสู่ระบบ" };

  const parsed = createScheduleSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const data = parsed.data;

  const account = await prisma.account.findFirst({
    where: { id: data.accountId, userId: session.user.id, status: "ACTIVE" },
  });
  if (!account) return { success: false, error: "ไม่พบบัญชีที่เลือก หรือบัญชีไม่ได้ Active" };

  const messagesArray = data.messages
    .split("\n")
    .map((m) => m.trim())
    .filter(Boolean);
  if (messagesArray.length === 0) {
    return { success: false, error: "กรุณากรอกข้อความอย่างน้อย 1 รายการ" };
  }

  const scheduledTime = new Date(data.scheduledTime);
  if (isNaN(scheduledTime.getTime())) {
    return { success: false, error: "วันเวลาไม่ถูกต้อง" };
  }

  await prisma.schedule.create({
    data: {
      accountId: data.accountId,
      targetGroup: data.targetGroup,
      messages: JSON.stringify(messagesArray),
      scheduledTime,
      loopCount: data.loopCount,
      autoDelay: data.autoDelay,
      delayMs: data.delayMs,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/schedules");
  return { success: true };
}

export async function deleteScheduleAction(scheduleId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "กรุณาเข้าสู่ระบบ" };

  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId, account: { userId: session.user.id } },
  });
  if (!schedule) return { success: false, error: "ไม่พบรายการนี้" };

  await prisma.schedule.delete({ where: { id: scheduleId } });

  revalidatePath("/dashboard/schedules");
  return { success: true };
}

export async function toggleScheduleStatusAction(scheduleId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "กรุณาเข้าสู่ระบบ" };

  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId, account: { userId: session.user.id } },
  });
  if (!schedule) return { success: false, error: "ไม่พบรายการนี้" };

  const canToggle = schedule.status === "PENDING" || schedule.status === "PAUSED";
  if (!canToggle) {
    return { success: false, error: "ไม่สามารถเปลี่ยนสถานะรายการที่กำลังรันหรือเสร็จแล้ว" };
  }

  const newStatus = schedule.status === "PAUSED" ? "PENDING" : "PAUSED";

  await prisma.schedule.update({
    where: { id: scheduleId },
    data: { status: newStatus },
  });

  revalidatePath("/dashboard/schedules");
  return { success: true, newStatus };
}

export async function getUserActiveAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId, status: "ACTIVE" },
    select: { id: true, accountName: true, platform: true },
    orderBy: { platform: "asc" },
  });
}
