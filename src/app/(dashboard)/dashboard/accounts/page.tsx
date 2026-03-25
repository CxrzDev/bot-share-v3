import { Suspense } from "react";
import { getAccounts, getUserWithPackage } from "@/lib/actions/accounts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddAccountModal } from "@/components/accounts/add-account-modal";
import { AccountCard } from "@/components/accounts/account-card";
import { MessageCircle } from "lucide-react";
import { FacebookIcon } from "@/components/ui/platform-icons";

async function AccountsList() {
  const [accounts, user] = await Promise.all([
    getAccounts(),
    getUserWithPackage(),
  ]);

  const fbAccounts = accounts.filter((a) => a.platform === "FACEBOOK");
  const lineAccounts = accounts.filter((a) => a.platform === "LINE");

  const fbQuota = {
    current: fbAccounts.length,
    max: user.package?.maxFbAccounts || 0,
    canAdd: fbAccounts.length < (user.package?.maxFbAccounts || 0),
  };

  const lineQuota = {
    current: lineAccounts.length,
    max: user.package?.maxLineAccounts || 0,
    canAdd: lineAccounts.length < (user.package?.maxLineAccounts || 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">บัญชี</h1>
          <p className="text-muted-foreground">
            จัดการบัญชี Facebook และ LINE ของคุณ
          </p>
        </div>
        <AddAccountModal fbQuota={fbQuota} lineQuota={lineQuota} />
      </div>

      {/* Quota Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FacebookIcon className="h-4 w-4 text-blue-600" />
              Facebook
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ใช้ไปแล้ว</span>
                <span className="font-semibold">
                  {fbQuota.current}/{fbQuota.max}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${fbQuota.max > 0 ? (fbQuota.current / fbQuota.max) * 100 : 0}%`,
                  }}
                />
              </div>
              {!fbQuota.canAdd && (
                <p className="text-xs text-destructive">
                  โควต้าเต็มแล้ว กรุณาอัปเกรด
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4 text-green-600" />
              LINE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ใช้ไปแล้ว</span>
                <span className="font-semibold">
                  {lineQuota.current}/{lineQuota.max}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-green-600 transition-all"
                  style={{
                    width: `${lineQuota.max > 0 ? (lineQuota.current / lineQuota.max) * 100 : 0}%`,
                  }}
                />
              </div>
              {!lineQuota.canAdd && (
                <p className="text-xs text-destructive">
                  โควต้าเต็มแล้ว กรุณาอัปเกรด
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">ยังไม่มีบัญชี</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              เริ่มต้นด้วยการเพิ่มบัญชี Facebook หรือ LINE
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-2 h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<AccountsSkeleton />}>
      <AccountsList />
    </Suspense>
  );
}
