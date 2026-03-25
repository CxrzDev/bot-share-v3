"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createScheduleAction } from "@/lib/actions/schedule-actions";
import { cn } from "@/lib/utils";
import { FacebookIcon } from "@/components/ui/platform-icons";
import {
  Loader2,
  MessageCircle,
  Info,
  ChevronDown,
} from "lucide-react";

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  accountId: z.string().min(1, "กรุณาเลือกบัญชี"),
  targetGroup: z.string().min(3, "กรุณาระบุ Group ID หรือ URL"),
  messages: z.string().min(1, "กรุณากรอกข้อความอย่างน้อย 1 บรรทัด"),
  scheduledTime: z.string().min(1, "กรุณาเลือกวันเวลา"),
  loopCount: z.number({ error: "กรุณากรอกตัวเลข" }).int().min(1).max(9999),
  autoDelay: z.boolean(),
  delayMs: z.number({ error: "กรุณากรอกตัวเลข" }).int().min(0).max(60000),
});
type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Account {
  id: string;
  accountName: string;
  platform: "FACEBOOK" | "LINE";
}

interface CreateScheduleFormProps {
  accounts: Account[];
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500 }} className="text-foreground">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Toggle switch (no shadcn Switch component in this project) ───────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function CreateScheduleForm({ accounts }: CreateScheduleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountId: "",
      targetGroup: "",
      messages: "",
      scheduledTime: "",
      loopCount: 1,
      autoDelay: true,
      delayMs: 950,
    },
  });

  const autoDelay = watch("autoDelay");
  const messagesValue = watch("messages");
  const messageCount = messagesValue
    ? messagesValue.split("\n").map((m) => m.trim()).filter(Boolean).length
    : 0;

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await createScheduleAction(data);
      if (result.success) {
        toast.success("สร้างตารางโพสต์สำเร็จ!", {
          description: "รายการถูกเพิ่มเข้าคิวแล้ว",
        });
        router.push("/dashboard/schedules");
      } else {
        toast.error(result.error ?? "เกิดข้อผิดพลาด");
      }
    });
  };

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950/30">
        <Info className="mx-auto mb-2 h-8 w-8 text-amber-500" />
        <p className="font-medium">ยังไม่มีบัญชีที่ Active</p>
        <p className="mt-1 text-sm text-muted-foreground">
          กรุณาเชื่อมต่อบัญชี Facebook หรือ LINE ก่อนสร้างตารางโพสต์
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/accounts")}
        >
          ไปหน้าบัญชี
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Account */}
      <Field label="บัญชีที่ใช้โพสต์" error={errors.accountId?.message}>
        <Controller
          name="accountId"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกบัญชี Facebook / LINE" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    <span className="flex items-center gap-2">
                      {acc.platform === "FACEBOOK" ? (
                        <FacebookIcon className="h-3.5 w-3.5 text-blue-600" />
                      ) : (
                        <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                      )}
                      {acc.accountName}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      {/* Target Group */}
      <Field
        label="Target Group / Page ID หรือ URL"
        error={errors.targetGroup?.message}
        hint="ใส่ URL กลุ่ม Facebook หรือ ID กลุ่ม LINE"
      >
        <Input
          placeholder="เช่น https://facebook.com/groups/123456 หรือ C123456789"
          {...register("targetGroup")}
        />
      </Field>

      {/* Messages */}
      <Field
        label={`ข้อความที่ต้องการโพสต์ ${messageCount > 0 ? `(${messageCount} ข้อความ)` : ""}`}
        error={errors.messages?.message}
        hint="1 บรรทัด = 1 ข้อความ — ระบบจะส่งทีละข้อความตามลำดับ"
      >
        <Textarea
          rows={6}
          placeholder={"ข้อความที่ 1\nข้อความที่ 2\nข้อความที่ 3"}
          className="resize-y font-mono text-sm"
          {...register("messages")}
        />
      </Field>

      {/* Scheduled Time */}
      <Field label="วันเวลาที่ต้องการโพสต์" error={errors.scheduledTime?.message}>
        <input
          type="datetime-local"
          className={cn(
            "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
            errors.scheduledTime && "border-destructive"
          )}
          {...register("scheduledTime")}
        />
      </Field>

      {/* Loop Count */}
      <Field
        label="จำนวนรอบ (Loop Count)"
        error={errors.loopCount?.message}
        hint="จำนวนครั้งที่จะวนส่งข้อความทั้งหมด"
      >
        <Input
          type="number"
          min={1}
          max={9999}
          className="w-32"
          {...register("loopCount", { valueAsNumber: true })}
        />
      </Field>

      {/* Advanced Settings toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")}
          />
          ตั้งค่าขั้นสูง (Delay)
        </button>

        {showAdvanced && (
          <div className="mt-3 flex flex-col gap-4 rounded-lg border bg-muted/30 p-4">
            {/* Auto Delay toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto Delay</p>
                <p className="text-xs text-muted-foreground">
                  ดีเลย์อัตโนมัติระหว่างข้อความ (แนะนำ)
                </p>
              </div>
              <Controller
                name="autoDelay"
                control={control}
                render={({ field }) => (
                  <Toggle checked={field.value} onChange={field.onChange} />
                )}
              />
            </div>

            {/* Custom delay (shown when autoDelay = false) */}
            {!autoDelay && (
              <Field
                label="Delay (มิลลิวินาที)"
                error={errors.delayMs?.message}
                hint="ระยะเวลาหน่วงระหว่างข้อความ (ms) — ค่าแนะนำ 950"
              >
                <Input
                  type="number"
                  min={0}
                  max={60000}
                  className="w-36"
                  {...register("delayMs", { valueAsNumber: true })}
                />
              </Field>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push("/dashboard/schedules")}
          disabled={isPending}
        >
          ยกเลิก
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            "สร้างตารางโพสต์"
          )}
        </Button>
      </div>
    </form>
  );
}
