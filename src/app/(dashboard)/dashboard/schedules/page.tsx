import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScheduleList } from "@/components/schedules/schedule-list";
import { CalendarPlus, Calendar } from "lucide-react";

export default async function SchedulesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const schedules = await prisma.schedule.findMany({
    where: { account: { userId: session.user.id } },
    include: {
      account: {
        select: { id: true, accountName: true, platform: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = schedules.map((s) => ({
    id: s.id,
    targetGroup: s.targetGroup,
    messages: s.messages,
    scheduledTime: s.scheduledTime.toISOString(),
    loopCount: s.loopCount,
    runCount: s.runCount,
    status: s.status as "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "PAUSED",
    errorMessage: s.errorMessage ?? null,
    account: {
      id: s.account.id,
      accountName: s.account.accountName,
      platform: s.account.platform as "FACEBOOK" | "LINE",
    },
  }));

  const pending = serialized.filter((s) => s.status === "PENDING").length;
  const running = serialized.filter((s) => s.status === "RUNNING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold sm:text-2xl">ตารางโพสต์</h1>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {schedules.length > 0
                ? `${schedules.length} รายการ · รอ ${pending} · รัน ${running}`
                : "จัดการตารางโพสต์อัตโนมัติของคุณ"}
            </p>
          </div>
        </div>
        <Button asChild className="w-full sm:w-auto shrink-0">
          <Link href="/dashboard/schedules/new">
            <CalendarPlus className="h-4 w-4" />
            ตารางโพสต์ใหม่
          </Link>
        </Button>
      </div>

      {/* List */}
      <ScheduleList schedules={serialized} />
    </div>
  );
}
