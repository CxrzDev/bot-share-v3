"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { submitPaymentAction } from "@/lib/actions/payment";
import {
  Loader2,
  Upload,
  X,
  CheckCircle2,
  Building2,
  CreditCard,
  User,
} from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package: {
    id: string;
    name: string;
    price: number;
  };
}

export function PaymentModal({ open, onOpenChange, package: pkg }: PaymentModalProps) {
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ไฟล์ใหญ่เกิน 5 MB");
      return;
    }
    setSlipFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setSlipPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearSlip = () => {
    setSlipFile(null);
    setSlipPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!slipFile) {
      toast.error("กรุณาแนบสลิปการโอนเงิน");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("packageId", pkg.id);
      formData.append("slip", slipFile);

      const result = await submitPaymentAction(formData);
      if (result.success) {
        toast.success("ส่งสลิปสำเร็จ!", {
          description: `รายการแพ็กเกจ ${pkg.name} อยู่ระหว่างการตรวจสอบ ทีมงานจะยืนยันภายใน 24 ชั่วโมง`,
          duration: 6000,
        });
        onOpenChange(false);
        clearSlip();
      } else {
        toast.error(result.error ?? "เกิดข้อผิดพลาด");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ชำระเงิน
            <Badge variant="secondary" className="text-sm font-semibold">
              {pkg.name}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            โอนเงินจำนวน{" "}
            <span className="font-bold text-foreground">
              {pkg.price.toLocaleString()} บาท
            </span>{" "}
            ไปยังบัญชีด้านล่าง แล้วแนบสลิป
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Bank details + QR */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex gap-4">
              {/* QR Code */}
              <div className="flex-shrink-0">
                <div className="relative h-28 w-28 overflow-hidden rounded-lg border-2 border-border bg-white">
                  <Image
                    src="/images/payment-qr.png"
                    alt="PromptPay QR Code"
                    fill
                    className="object-contain p-1"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = "none";
                      const parent = img.parentElement;
                      if (parent && !parent.querySelector(".qr-fallback")) {
                        const fb = document.createElement("div");
                        fb.className = "qr-fallback flex h-full w-full items-center justify-center text-center text-[10px] text-muted-foreground p-1";
                        fb.textContent = "ติดต่อแอดมิน";
                        parent.appendChild(fb);
                      }
                    }}
                  />
                </div>
                <p className="mt-1 text-center text-xs text-muted-foreground">สแกน QR</p>
              </div>

              {/* Bank info */}
              <div className="flex flex-1 flex-col justify-center gap-2.5">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">ธนาคาร</p>
                    <p className="text-sm font-semibold">TMB (ttb)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">เลขบัญชี</p>
                    <p className="font-mono text-sm font-semibold tracking-wider">
                      049-297-5917
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">ชื่อบัญชี</p>
                    <p className="text-sm font-semibold">Mr. Anusit</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount highlight */}
            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 py-2 text-center">
              <p className="text-xs text-muted-foreground">ยอดที่ต้องโอน</p>
              <p className="text-2xl font-bold text-primary">
                ฿{pkg.price.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Slip upload */}
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              แนบสลิปการโอนเงิน <span className="text-destructive">*</span>
            </p>

            {slipPreview ? (
              <div className="relative">
                <div className="relative h-48 w-full overflow-hidden rounded-xl border-2 border-primary/40 bg-muted">
                  <Image
                    src={slipPreview}
                    alt="สลิปการโอนเงิน"
                    fill
                    className="object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={clearSlip}
                  className="absolute right-2 top-2 rounded-full bg-background p-1 shadow-md ring-1 ring-border hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {slipFile?.name} · {((slipFile?.size ?? 0) / 1024).toFixed(0)} KB
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 py-8 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50 hover:text-foreground"
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">คลิกเพื่ออัปโหลดสลิป</span>
                <span className="text-xs">JPG, PNG, WEBP · ไม่เกิน 5 MB</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || !slipFile}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  ส่งสลิป
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            ทีมงานจะตรวจสอบและเปิดใช้งานภายใน 24 ชั่วโมง
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
