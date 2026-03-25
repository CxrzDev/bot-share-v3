"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  Play,
  Trash2,
  Loader2,
} from "lucide-react";
import { FacebookIcon } from "@/components/ui/platform-icons";
import { deleteAccountAction, toggleAccountStatus } from "@/app/actions/account-actions";
import dayjs from "dayjs";
import "dayjs/locale/th";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale("th");

interface AccountCardProps {
  account: {
    id: string;
    accountName: string;
    platform: string;
    status: string;
    lastChecked: Date | null;
  };
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-3 w-3" />
          ใช้งานได้
        </Badge>
      );
    case "ERROR":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Token ผิดพลาด
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          รอดำเนินการ
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function AccountCard({ account }: AccountCardProps) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isFacebook = account.platform === "FACEBOOK";

  const handleToggle = async () => {
    setIsToggling(true);
    const result = await toggleAccountStatus(account.id);
    if (result.success) {
      const msg =
        account.status === "ACTIVE" ? "หยุดใช้งานบัญชีแล้ว" : "เปิดใช้งานบัญชีแล้ว";
      toast.success(msg);
      router.refresh();
    } else {
      toast.error(result.error ?? "เกิดข้อผิดพลาด");
    }
    setIsToggling(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteAccountAction(account.id);
    if (result.success) {
      toast.success(`ลบบัญชี "${account.accountName}" สำเร็จ`);
      router.refresh();
    } else {
      toast.error(result.error ?? "เกิดข้อผิดพลาดในการลบ");
      setIsDeleting(false);
    }
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="pt-5 pb-4 px-5">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11">
            <AvatarFallback
              className={
                isFacebook
                  ? "bg-blue-100 dark:bg-blue-900/30"
                  : "bg-green-100 dark:bg-green-900/30"
              }
            >
              {isFacebook ? (
                <FacebookIcon className="h-5 w-5 text-blue-600" />
              ) : (
                <MessageCircle className="h-5 w-5 text-green-600" />
              )}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{account.accountName}</h3>
            <p className="text-xs text-muted-foreground">
              {isFacebook ? "Facebook" : "LINE"}
            </p>
          </div>
        </div>

        {/* Status & last checked */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">สถานะ</span>
            <StatusBadge status={account.status} />
          </div>
          {account.lastChecked && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ตรวจสอบล่าสุด</span>
              <span className="text-xs text-muted-foreground">
                {dayjs(account.lastChecked).fromNow()}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          {/* Toggle Active / Pause */}
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleToggle}
            disabled={isToggling || account.status === "ERROR"}
          >
            {isToggling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : account.status === "ACTIVE" ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                หยุดใช้งาน
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                เปิดใช้งาน
              </>
            )}
          </Button>

          {/* Delete with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ยืนยันการลบบัญชี?</AlertDialogTitle>
                <AlertDialogDescription>
                  คุณต้องการลบบัญชี{" "}
                  <span className="font-semibold text-foreground">
                    &quot;{account.accountName}&quot;
                  </span>{" "}
                  ใช่หรือไม่?
                  <br />
                  <span className="text-destructive">
                    ตารางโพสต์ที่เกี่ยวข้องทั้งหมดจะถูกลบด้วย
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  ลบบัญชี
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
