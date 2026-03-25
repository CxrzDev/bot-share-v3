import { prisma } from "../prisma"; // ✅ แก้ Path ให้ชัวร์ 100% ว่าหาไฟล์เจอแน่ๆ
import { Schedule, Account, ScheduleStatus, Platform, AccountStatus } from "@prisma/client"; // ✅ นำเข้า Type ของ Prisma ทั้งหมดมาใช้ตรงๆ

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ExecutionResult {
  ok: boolean;
  statusCode?: number;
  message?: string;
}

export interface ScheduleSummary {
  id: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  runCount: number;
  errorMessage?: string;
}

export interface EngineResult {
  processed: number;
  results: ScheduleSummary[];
  durationMs: number;
}

// ✅ FIX: สร้าง Type ขึ้นมาเองแบบตรงไปตรงมา เข้าใจง่าย และไม่มีทาง Error
export type ScheduleWithAccount = Schedule & { account: Account };

// ─── Utility ─────────────────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseMessages(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((m): m is string => typeof m === "string" && m.trim().length > 0);
    }
  } catch {
    // Fallback
  }
  return raw.trim() ? [raw.trim()] : [];
}

// ─── Platform executors ───────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-unused-vars */ // 👈 ใส่บรรทัดนี้เพื่อปิดคำเตือนเฉพาะส่วนนี้
export async function executeFacebookPost(
  target: string, 
  message: string, 
  cookie: string
): Promise<ExecutionResult> {
  console.log("[FB] POST →", target);
  await sleep(200);
  return { ok: true, statusCode: 200, message: "mock: facebook post sent" };
}

export async function executeLinePost(
  target: string, 
  message: string, 
  token: string
): Promise<ExecutionResult> {
  console.log("[LINE] POST →", target);
  await sleep(150);
  return { ok: true, statusCode: 200, message: "mock: line post sent" };
}
/* eslint-enable @typescript-eslint/no-unused-vars */ // 👈 เปิดการเช็กกลับมาสำหรับโค้ดส่วนอื่น

// ─── DB helpers ───────────────────────────────────────────────────────────────
async function fetchDueSchedules(): Promise<ScheduleWithAccount[]> {
  // ✅ FIX: ดึงข้อมูล Account มาทั้งก้อนเลย ตัดปัญหา Type ไม่ตรง
  const records = await prisma.schedule.findMany({
    where: {
      status: { in: [ScheduleStatus.PENDING, ScheduleStatus.RUNNING] }, // ✅ FIX: ใช้ Enum ของ Prisma แทน String ปกติ
      scheduledTime: { lte: new Date() },
    },
    include: {
      account: true, 
    },
  });
  return records;
}

async function markSuccess(id: string, runCount: number) {
  return prisma.schedule.update({ where: { id }, data: { status: ScheduleStatus.SUCCESS, runCount } });
}

async function markFailed(id: string, runCount: number, errorMessage: string) {
  return prisma.schedule.update({ where: { id }, data: { status: ScheduleStatus.FAILED, runCount, errorMessage } });
}

async function incrementRunCount(id: string, runCount: number) {
  return prisma.schedule.update({ where: { id }, data: { runCount, status: ScheduleStatus.PENDING } });
}

// ─── Single schedule processor ────────────────────────────────────────────────
async function processOneSchedule(schedule: ScheduleWithAccount): Promise<ScheduleSummary> {
  const { id, targetGroup, messages: rawMessages, loopCount, runCount, autoDelay, delayMs, account } = schedule;

  if (account.status !== AccountStatus.ACTIVE) { // ✅ FIX: ใช้ Enum ของ Prisma
    return { id, status: "SKIPPED", runCount };
  }

  if (account.platform === Platform.FACEBOOK && !account.cookie) {
    await markFailed(id, runCount, "บัญชี Facebook ไม่มี Cookie");
    return { id, status: "FAILED", runCount, errorMessage: "Missing Facebook cookie" };
  }
  if (account.platform === Platform.LINE && !account.token) {
    await markFailed(id, runCount, "บัญชี LINE ไม่มี Token");
    return { id, status: "FAILED", runCount, errorMessage: "Missing LINE token" };
  }

  const messages = parseMessages(rawMessages);
  if (messages.length === 0) {
    await markFailed(id, runCount, "ไม่มีข้อความในคิว");
    return { id, status: "FAILED", runCount, errorMessage: "Empty message list" };
  }

  const newRunCount = runCount + 1;

  try {
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (!message) continue;
      
      let result: ExecutionResult;

      if (account.platform === Platform.FACEBOOK) {
        // ✅ FIX: บังคับ Type เป็น string เพื่อปิดปาก TypeScript
        result = await executeFacebookPost(targetGroup, message, account.cookie as string); 
      } else {
        result = await executeLinePost(targetGroup, message, account.token as string);
      }

      if (!result.ok) throw new Error(`Error: ${result.message ?? result.statusCode}`);
      if (autoDelay && i < messages.length - 1) await sleep(delayMs);
    }

    if (newRunCount >= loopCount) {
      await markSuccess(id, newRunCount);
      return { id, status: "SUCCESS", runCount: newRunCount };
    } else {
      await incrementRunCount(id, newRunCount);
      return { id, status: "SKIPPED", runCount: newRunCount };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await markFailed(id, newRunCount, msg);
    return { id, status: "FAILED", runCount: newRunCount, errorMessage: msg };
  }
}

// ─── Main entry point ─────────────────────────────────────────────────────────
export async function processDueSchedules(): Promise<EngineResult> {
  const start = Date.now();
  const due = await fetchDueSchedules();

  if (due.length === 0) {
    return { processed: 0, results: [], durationMs: Date.now() - start };
  }

  console.log(`[engine] Processing ${due.length} due schedule(s) concurrently...`);

  const dueIds = due.map(d => d.id);
  await prisma.schedule.updateMany({
    where: { id: { in: dueIds } },
    data: { status: ScheduleStatus.RUNNING }
  });

  const promises = due.map(schedule => 
    processOneSchedule(schedule).catch((err): ScheduleSummary => ({
      id: schedule.id,
      status: "FAILED",
      runCount: schedule.runCount,
      errorMessage: String(err)
    }))
  );

  const settledResults = await Promise.allSettled(promises);
  
  const results: ScheduleSummary[] = settledResults.map(res => 
    res.status === "fulfilled" 
      ? res.value 
      : { id: "error", status: "FAILED", runCount: 0, errorMessage: "Rejected by Promise.allSettled" }
  );

  const durationMs = Date.now() - start;
  console.log(`[engine] Done in ${durationMs}ms`);

  return { processed: due.length, results, durationMs };
}