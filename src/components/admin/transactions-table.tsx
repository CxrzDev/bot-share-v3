"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { approveTransaction, rejectTransaction } from "@/lib/actions/admin-actions";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Receipt,
  ImageOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "REJECTED";
  slipUrl: string;
  note: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  package: { id: string; name: string; price: number };
}

const STATUS_MAP = {
  PENDING: { label: "รอตรวจสอบ", classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  SUCCESS: { label: "อนุมัติแล้ว", classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
  REJECTED: { label: "ถูกปฏิเสธ", classes: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800" },
};

function StatusBadge({ status }: { status: "PENDING" | "SUCCESS" | "REJECTED" }) {
  const s = STATUS_MAP[status];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", s.classes)}>
      {s.label}
    </span>
  );
}

function SlipPreviewDialog({ slipUrl, open, onOpenChange }: { slipUrl: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>สลิปการโอนเงิน</DialogTitle>
        </DialogHeader>
        <div className="relative min-h-64 w-full overflow-hidden rounded-xl border bg-muted">
          {imgError ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageOff className="h-10 w-10" />
              <p className="text-sm">ไม่สามารถโหลดรูปภาพได้</p>
            </div>
          ) : (
            <Image
              src={slipUrl}
              alt="สลิปการโอนเงิน"
              width={480}
              height={640}
              className="h-auto w-full object-contain"
              onError={() => setImgError(true)}
            />
          )}
        </div>
        <a
          href={slipUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-xs text-primary hover:underline"
        >
          เปิดในหน้าต่างใหม่ ↗
        </a>
      </DialogContent>
    </Dialog>
  );
}

function ActionButtons({ tx, onDone }: { tx: Transaction; onDone: () => void }) {
  const [approvePending, startApprove] = useTransition();
  const [rejectPending, startReject] = useTransition();

  const handleApprove = () => {
    startApprove(async () => {
      const res = await approveTransaction(tx.id);
      if (res.success) {
        toast.success("อนุมัติสำเร็จ!", {
          description: `แพ็กเกจ ${tx.package.name} ถูกเปิดใช้งานให้ ${tx.user.email} แล้ว`,
        });
        onDone();
      } else {
        toast.error(res.error ?? "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleReject = () => {
    startReject(async () => {
      const res = await rejectTransaction(tx.id);
      if (res.success) {
        toast.warning("ปฏิเสธรายการแล้ว", {
          description: `รายการของ ${tx.user.email} ถูกปฏิเสธ`,
        });
        onDone();
      } else {
        toast.error(res.error ?? "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        className="h-7 gap-1 bg-emerald-600 px-2.5 text-xs hover:bg-emerald-700 text-white"
        onClick={handleApprove}
        disabled={approvePending || rejectPending}
      >
        {approvePending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
        อนุมัติ
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="h-7 gap-1 px-2.5 text-xs"
        onClick={handleReject}
        disabled={approvePending || rejectPending}
      >
        {rejectPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
        ปฏิเสธ
      </Button>
    </div>
  );
}

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const [slipTarget, setSlipTarget] = useState<string | null>(null);
  const [rows, setRows] = useState<Transaction[]>(transactions);

  const refresh = () => {
    window.location.reload();
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card py-16 text-center">
        <Receipt className="h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium">ยังไม่มีรายการชำระเงิน</p>
        <p className="text-sm text-muted-foreground">รายการจะแสดงเมื่อผู้ใช้ส่งสลิป</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">วันที่</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">ผู้ใช้</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">แพ็กเกจ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">จำนวนเงิน</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">สถานะ</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">สลิป</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((tx) => (
                <tr key={tx.id} className="transition-colors hover:bg-muted/20">
                  {/* Date */}
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    <br />
                    <span className="tabular-nums">
                      {new Date(tx.createdAt).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>

                  {/* User */}
                  <td className="px-4 py-3">
                    <p className="font-medium">{tx.user.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{tx.user.email}</p>
                  </td>

                  {/* Package */}
                  <td className="px-4 py-3">
                    <span className="font-medium">{tx.package.name}</span>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                    ฿{tx.amount.toLocaleString()}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={tx.status} />
                  </td>

                  {/* Slip */}
                  <td className="px-4 py-3 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 px-2.5 text-xs"
                      onClick={() => setSlipTarget(tx.slipUrl)}
                    >
                      <Eye className="h-3 w-3" />
                      ดูสลิป
                    </Button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    {tx.status === "PENDING" ? (
                      <ActionButtons tx={tx} onDone={refresh} />
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        {tx.status === "SUCCESS" ? "อนุมัติแล้ว" : "ถูกปฏิเสธ"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slip preview dialog */}
      <SlipPreviewDialog
        slipUrl={slipTarget ?? ""}
        open={!!slipTarget}
        onOpenChange={(v) => { if (!v) setSlipTarget(null); }}
      />
    </>
  );
}
