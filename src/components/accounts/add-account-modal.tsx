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

// ─── Help Guide Dialog ────────────────────────────────────────────────────────

type HelpStep = { title: string; description: string };

const FB_STEPS: HelpStep[] = [
  {
    title: "เปิด Facebook ใน Chrome หรือ Edge",
    description: "ให้แน่ใจว่าคุณล็อกอินเข้าบัญชี Facebook เรียบร้อยแล้ว",
  },
  {
    title: "เปิด Developer Tools (F12)",
    description: "กดปุ่ม F12 หรือคลิกขวา → Inspect เพื่อเปิด DevTools",
  },
  {
    title: "ไปที่แท็บ Application",
    description: "ในแถบด้านบนของ DevTools ให้คลิกแท็บ 'Application' (หรือ 'Storage' ใน Firefox)",
  },
  {
    title: "เลือก Cookies → facebook.com",
    description: "ในเมนูซ้าย ให้ขยาย Cookies แล้วคลิก 'https://www.facebook.com'",
  },
  {
    title: "คัดลอก Cookie ทั้งหมด",
    description: "กด Ctrl+A เพื่อเลือกทุกแถว แล้วคัดลอก หรือใช้ Extension ชื่อ 'Cookie Editor' เพื่อ Export เป็น JSON ได้ง่ายกว่า",
  },
  {
    title: "วางใน BotShare",
    description: "วาง Cookie ที่คัดลอกลงในช่องด้านบน แล้วกด 'เชื่อมต่อบัญชี'",
  },
];

const LINE_STEPS: HelpStep[] = [
  {
    title: "ไปที่ LINE Developers Console",
    description: "เปิดเบราว์เซอร์แล้วไปที่ developers.line.biz แล้วล็อกอินด้วยบัญชี LINE ของคุณ",
  },
  {
    title: "เลือก Provider และ Channel",
    description: "คลิก Provider ของคุณ แล้วเลือก Channel ที่ต้องการ (ต้องเป็นประเภท Messaging API)",
  },
  {
    title: "ไปที่แท็บ Messaging API",
    description: "คลิกแท็บ 'Messaging API' ที่ด้านบนของหน้า Channel",
  },
  {
    title: "เลื่อนลงหา Channel access token",
    description: "เลื่อนลงมาจนเจอส่วน 'Channel access token (long-lived)' แล้วกด 'Issue' ถ้ายังไม่มี Token",
  },
  {
    title: "คัดลอก Token",
    description: "กดปุ่ม Copy ข้าง Token เพื่อคัดลอก หรือคลิกที่ Token แล้วกด Ctrl+C",
  },
  {
    title: "วางใน BotShare",
    description: "วาง Channel Access Token ลงในช่องด้านบน แล้วกด 'เชื่อมต่อบัญชี'",
  },
];

function HelpGuideDialog({ platform }: { platform: "FACEBOOK" | "LINE" }) {
  const [open, setOpen] = useState(false);
  const steps = platform === "FACEBOOK" ? FB_STEPS : LINE_STEPS;
  const title =
    platform === "FACEBOOK"
      ? "วิธีรับ Facebook Cookie / Access Token"
      : "วิธีรับ LINE Channel Access Token";

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 hover:underline"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        ดูวิธีหาได้ที่ไหน?
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {platform === "FACEBOOK" ? (
                <FacebookIcon className="h-4 w-4 text-blue-600" />
              ) : (
                <MessageCircle className="h-4 w-4 text-green-600" />
              )}
              {title}
            </DialogTitle>
            <DialogDescription>
              ทำตามขั้นตอนด้านล่างเพื่อรับ{" "}
              {platform === "FACEBOOK" ? "Cookie หรือ Access Token" : "Channel Access Token"}
            </DialogDescription>
          </DialogHeader>

          <ol className="mt-2 space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/40">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <span className="font-semibold">⚠️ หมายเหตุ:</span>{" "}
              {platform === "FACEBOOK"
                ? "Cookie/Token มีอายุการใช้งาน กรุณาอัปเดตหาก Bot หยุดทำงาน"
                : "Token ระยะยาว (Long-lived) ไม่มีวันหมดอายุ แต่ต้อง Re-issue หากมีการเปลี่ยนแปลง"}
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              เข้าใจแล้ว
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  id,
  label,
  error,
  helpPlatform,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  helpPlatform?: "FACEBOOK" | "LINE";
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
        {helpPlatform && <HelpGuideDialog platform={helpPlatform} />}
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
                  helpPlatform={platform}
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
