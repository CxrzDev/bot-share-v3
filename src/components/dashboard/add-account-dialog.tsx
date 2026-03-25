"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addAccountPlaceholder } from "@/lib/actions/accounts";
import { Loader2, Plus, AlertCircle } from "lucide-react";

const accountSchema = z.object({
  platform: z.enum(["FACEBOOK", "LINE"]),
  accountName: z.string().min(2, "ชื่อบัญชีต้องมีอย่างน้อย 2 ตัวอักษร"),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AddAccountDialogProps {
  fbQuota: { current: number; max: number; canAdd: boolean };
  lineQuota: { current: number; max: number; canAdd: boolean };
}

export function AddAccountDialog({
  fbQuota,
  lineQuota,
}: AddAccountDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      platform: "FACEBOOK",
      accountName: "",
    },
  });

  const selectedPlatform = form.watch("platform");
  const currentQuota = selectedPlatform === "FACEBOOK" ? fbQuota : lineQuota;

  const onSubmit = async (data: AccountFormValues) => {
    setError("");
    try {
      await addAccountPlaceholder(data);
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  const isLoading = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          เพิ่มบัญชี
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มบัญชีใหม่</DialogTitle>
          <DialogDescription>
            เชื่อมต่อบัญชี Facebook หรือ LINE เพื่อเริ่มโพสต์อัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>แพลตฟอร์ม</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกแพลตฟอร์ม" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FACEBOOK">Facebook</SelectItem>
                      <SelectItem value="LINE">LINE</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่อบัญชี</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ชื่อเพจหรือบัญชีของคุณ"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quota Warning */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-sm font-medium">
                โควต้า {selectedPlatform === "FACEBOOK" ? "Facebook" : "LINE"}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  ใช้ไปแล้ว
                </span>
                <span className="text-sm font-semibold">
                  {currentQuota.current}/{currentQuota.max}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${currentQuota.max > 0 ? (currentQuota.current / currentQuota.max) * 100 : 0}%`,
                  }}
                />
              </div>
              {!currentQuota.canAdd && (
                <p className="mt-2 text-xs text-destructive">
                  คุณใช้โควต้าครบแล้ว กรุณาอัปเกรดแพ็กเกจ
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !currentQuota.canAdd}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังเพิ่ม...
                  </>
                ) : (
                  "เพิ่มบัญชี"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
