import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TransactionsTable } from "@/components/admin/transactions-table";
import { ShieldCheck } from "lucide-react";

export default async function AdminTransactionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const transactions = await prisma.transaction.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      package: { select: { id: true, name: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = transactions.map((tx) => ({
    id: tx.id,
    amount: tx.amount,
    status: tx.status as "PENDING" | "SUCCESS" | "REJECTED",
    slipUrl: tx.slipUrl,
    note: tx.note ?? null,
    createdAt: tx.createdAt.toISOString(),
    user: tx.user,
    package: tx.package,
  }));

  const counts = {
    total: transactions.length,
    pending: transactions.filter((t) => t.status === "PENDING").length,
    success: transactions.filter((t) => t.status === "SUCCESS").length,
    rejected: transactions.filter((t) => t.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">ตรวจสอบสลิปการชำระเงิน</h1>
          <p className="text-sm text-muted-foreground">Admin Dashboard</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "ทั้งหมด", value: counts.total, color: "text-foreground" },
          { label: "รอตรวจสอบ", value: counts.pending, color: "text-amber-600 dark:text-amber-400" },
          { label: "อนุมัติแล้ว", value: counts.success, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "ถูกปฏิเสธ", value: counts.rejected, color: "text-destructive" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Transactions table */}
      <TransactionsTable transactions={serialized} />
    </div>
  );
}
