"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { addAccountAction } from "@/app/actions/account-actions";
import {
  Loader2,
  Plus,
  MessageCircle,
  HelpCircle,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { FacebookIcon } from "@/components/ui/platform-icons";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  platform: z.enum(["FACEBOOK", "LINE"]),
  accountName: z.string().min(2, "ชื่อบัญชีต้องมีอย่างน้อย 2 ตัวอักษร"),
  credential: z.string().min(10, "กรุณากรอกอย่างน้อย 10 ตัวอักษร"),
});
type FormValues = z.infer<typeof schema>;

interface AddAccountModalProps {
  fbQuota: { current: number; max: number; canAdd: boolean };
  lineQuota: { current: number; max: number; canAdd: boolean };
}

// ─── Tooltip help content ─────────────────────────────────────────────────────

const FB_HELP: ReactNode = (
  <div className="space-y-1 text-xs">
    <p className="font-semibold">วิธีรับ Cookie:</p>
    <ol className="list-decimal space-y-0.5 pl-3">
      <li>เปิด Facebook ใน Chrome</li>
      <li>กด F12 → Application → Cookies</li>
      <li>คัดลอก cookie ทั้งหมด</li>
    </ol>
    <p className="text-muted-foreground">หรือใช้ Access Token จาก Graph API Explorer</p>
  </div>
);

const LINE_HELP: ReactNode = (
  <div className="space-y-1 text-xs">
    <p className="font-semibold">วิธีรับ Channel Access Token:</p>
    <ol className="list-decimal space-y-0.5 pl-3">
      <li>ไปที่ developers.line.biz</li>
      <li>เลือก Channel → Messaging API</li>
      <li>คัดลอก Channel access token</li>
    </ol>
  </div>
);

// ─── Field wrapper ─────────────────────────────────────────────────────────────
// label is a block element strictly ABOVE the input — no flex-row mixing

function Field({
  id,
  label,
  error,
  help,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  help?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label
          htmlFor={id}
          style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, lineHeight: 1 }}
          className="text-foreground"
        >
          {label}
        </label>
        {help && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                tabIndex={-1}
                className="text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-52" sideOffset={6}>
              {help}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {/* Input */}
      {children}
      {/* Error */}
      {error && (
        <p style={{ fontSize: "0.75rem", marginTop: 0 }} className="text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function AddAccountModal({ fbQuota, lineQuota }: AddAccountModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<"FACEBOOK" | "LINE">("FACEBOOK");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { platform: "FACEBOOK", accountName: "", credential: "" },
  });

  const quota = platform === "FACEBOOK" ? fbQuota : lineQuota;
  const pct = quota.max > 0 ? Math.round((quota.current / quota.max) * 100) : 0;

  const switchPlatform = (p: "FACEBOOK" | "LINE") => {
    setPlatform(p);
    setValue("platform", p);
    reset({ platform: p, accountName: "", credential: "" });
  };

  const onSubmit = async (data: FormValues) => {
    const result = await addAccountAction(data);
    if (result.success) {
      if (result.warning) {
        toast.warning(result.warning, { duration: 6000 });
      } else {
        toast.success(`เชื่อมต่อ "${result.data?.accountName}" สำเร็จ!`, {
          description: "บัญชีพร้อมใช้งานแล้ว",
        });
      }
      setOpen(false);
      reset();
      router.refresh();
    } else {
      toast.error(result.error ?? "เกิดข้อผิดพลาด", {
        description: "กรุณาตรวจสอบข้อมูลและลองใหม่",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          เพิ่มบัญชี
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>เพิ่มบัญชีใหม่</DialogTitle>
          <DialogDescription>
            เชื่อมต่อบัญชี Facebook หรือ LINE เพื่อเริ่มโพสต์อัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register("platform")} />

          {/* ── Platform switcher (custom — no Tabs component) ── */}
          <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-1">
            {(["FACEBOOK", "LINE"] as const).map((p) => {
              const q = p === "FACEBOOK" ? fbQuota : lineQuota;
              const isActive = platform === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => switchPlatform(p)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {p === "FACEBOOK" ? (
                      <FacebookIcon className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                    )}
                    {p === "FACEBOOK" ? "Facebook" : "LINE"}
                  </span>
                  {/* Inline quota badge */}
                  <Badge
                    variant={q.canAdd ? "secondary" : "destructive"}
                    className="text-xs tabular-nums px-1.5 py-0"
                  >
                    {q.current}/{q.max}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* ── Content area ── */}
          <div
            className="mt-3 flex flex-col gap-y-4 rounded-lg border p-4"
            style={{ minHeight: "260px" }}
          >
            {/* Security notice */}
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/40">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-400" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Token/Cookie ส่งตรงไป Server เท่านั้น ไม่เปิดเผยฝั่ง Client
              </p>
            </div>

            {/* Quota progress bar */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  โควต้า {platform === "FACEBOOK" ? "Facebook" : "LINE"}
                </span>
                <span className={quota.canAdd ? "text-foreground font-medium" : "text-destructive font-medium"}>
                  {quota.current} / {quota.max}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    platform === "FACEBOOK" ? "bg-blue-600" : "bg-green-600"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Quota exceeded message OR form fields */}
            {!quota.canAdd ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <p className="font-medium">โควต้าเต็มแล้ว</p>
                <p className="text-sm text-muted-foreground">
                  กรุณาอัปเกรดแพ็กเกจเพื่อเพิ่มบัญชีได้มากขึ้น
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-y-4">
                <Field
                  id="accountName"
                  label="ชื่อบัญชี"
                  error={errors.accountName?.message}
                >
                  <Input
                    id="accountName"
                    placeholder={
                      platform === "FACEBOOK"
                        ? "ชื่อเพจ Facebook ของคุณ"
                        : "ชื่อ LINE Bot ของคุณ"
                    }
                    {...register("accountName")}
                  />
                </Field>

                <Field
                  id="credential"
                  label={platform === "FACEBOOK" ? "Cookie หรือ Access Token" : "Channel Access Token"}
                  error={errors.credential?.message}
                  help={platform === "FACEBOOK" ? FB_HELP : LINE_HELP}
                >
                  {platform === "FACEBOOK" ? (
                    <Textarea
                      id="credential"
                      rows={4}
                      placeholder="วางค่า Cookie หรือ Access Token ที่นี่..."
                      className="resize-none font-mono text-xs"
                      {...register("credential")}
                    />
                  ) : (
                    <Input
                      id="credential"
                      type="password"
                      placeholder="Channel Access Token จาก LINE Developers"
                      className="font-mono"
                      {...register("credential")}
                    />
                  )}
                </Field>
              </div>
            )}
          </div>

          {/* ── Action buttons ── */}
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !quota.canAdd}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังตรวจสอบ...
                </>
              ) : (
                "เชื่อมต่อบัญชี"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
