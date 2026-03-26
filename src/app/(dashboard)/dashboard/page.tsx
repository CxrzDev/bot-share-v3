import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

async function DashboardStats() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      package: true,
      accounts: true,
      _count: {
        select: {
          accounts: true,
        },
      },
    },
  });

  if (!user) return null;

  const schedules = await prisma.schedule.findMany({
    where: {
      account: {
        userId: session.user.id,
      },
      status: { in: ["PENDING", "RUNNING"] },
    },
  });

  const fbAccounts = user.accounts.filter((a: { platform: string }) => a.platform === "FACEBOOK");
  const lineAccounts = user.accounts.filter((a: { platform: string }) => a.platform === "LINE");

  const fbQuota = user.package?.maxFbAccounts || 0;
  const lineQuota = user.package?.maxLineAccounts || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">แดชบอร์ด</h1>
        <p className="text-muted-foreground">
          ภาพรวมการใช้งานของคุณ
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              บัญชีทั้งหมด
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.accounts}</div>
            <p className="text-xs text-muted-foreground">
              Facebook: {fbAccounts.length} | LINE: {lineAccounts.length}
            </p>
          </CardContent>
        </Card>

        {/* Active Schedules */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              ตารางที่กำลังทำงาน
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
            <p className="text-xs text-muted-foreground">
              รอดำเนินการและกำลังทำงาน
            </p>
          </CardContent>
        </Card>

        {/* Quota Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              การใช้โควต้า
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Facebook</span>
                  <span className="font-medium">
                    {fbAccounts.length}/{fbQuota}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${fbQuota > 0 ? (fbAccounts.length / fbQuota) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">LINE</span>
                  <span className="font-medium">
                    {lineAccounts.length}/{lineQuota}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${lineQuota > 0 ? (lineAccounts.length / lineQuota) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Package Info */}
      {user.package && (
        <Card>
          <CardHeader>
            <CardTitle>แพ็กเกจปัจจุบัน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-xl font-bold sm:text-2xl">{user.package.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {user.package.description}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-bold sm:text-2xl">
                  {user.package.price === 0
                    ? "ฟรี"
                    : `฿${user.package.price}`}
                </p>
                <p className="text-xs text-muted-foreground">ต่อเดือน</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardStats />
    </Suspense>
  );
}
