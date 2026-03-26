import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CreateScheduleForm } from "@/components/schedules/create-schedule-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarPlus } from "lucide-react";

export default async function NewSchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    select: { id: true, accountName: true, platform: true },
    orderBy: { platform: "asc" },
  });

  const serialized = accounts.map((a) => ({
    id: a.id,
    accountName: a.accountName,
    platform: a.platform as "FACEBOOK" | "LINE",
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/schedules">
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <CalendarPlus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">สร้างตารางโพสต์ใหม่</h1>
          <p className="text-sm text-muted-foreground">กรอกข้อมูลเพื่อตั้งเวลาโพสต์อัตโนมัติ</p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <CreateScheduleForm accounts={serialized} />
      </div>
    </div>
  );
}
