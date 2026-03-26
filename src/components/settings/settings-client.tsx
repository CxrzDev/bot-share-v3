"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { changePasswordAction } from "@/lib/actions/settings-actions";
import {
  User,
  Mail,
  Package,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";

interface SettingsClientProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: Date;
    package: { name: string; price: number } | null;
  };
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

export function SettingsClient({ user }: SettingsClientProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const displayName = user.name || user.email.split("@")[0];
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinDate = new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(user.createdAt));

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    const formData = new FormData(e.currentTarget);

    const newPw = formData.get("newPassword") as string;
    const confirmPw = formData.get("confirmPassword") as string;

    if (newPw !== confirmPw) {
      setFieldErrors({ confirmPassword: "รหัสผ่านใหม่ไม่ตรงกัน" });
      return;
    }

    setIsLoading(true);
    try {
      const result = await changePasswordAction(formData);
      if (result.success) {
        toast.success("เปลี่ยนรหัสผ่านสำเร็จ!", {
          description: "รหัสผ่านของคุณได้รับการอัปเดตแล้ว",
        });
        formRef.current?.reset();
      } else {
        const msg = result.error ?? "เกิดข้อผิดพลาด";
        if (msg.includes("ปัจจุบัน")) {
          setFieldErrors({ currentPassword: msg });
        } else if (msg.includes("ตรงกัน")) {
          setFieldErrors({ confirmPassword: msg });
        } else {
          toast.error(msg);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">ตั้งค่า</h1>
        <p className="mt-1 text-muted-foreground">จัดการข้อมูลบัญชีและรหัสผ่านของคุณ</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Profile Card ── */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                ข้อมูลโปรไฟล์
              </CardTitle>
              <CardDescription>รายละเอียดบัญชีของคุณ</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Avatar */}
              <div className="mb-4 flex flex-col items-center gap-2">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-semibold">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <Separator />

              <div className="divide-y">
                <InfoRow icon={User} label="ชื่อ" value={user.name || "—"} />
                <InfoRow icon={Mail} label="อีเมล" value={user.email} />
                <InfoRow
                  icon={Package}
                  label="แพ็กเกจปัจจุบัน"
                  value={
                    user.package ? (
                      <Badge variant="secondary" className="font-semibold">
                        {user.package.name}
                        {user.package.price > 0 && (
                          <span className="ml-1 text-muted-foreground">
                            ฿{user.package.price}
                          </span>
                        )}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">ไม่มีแพ็กเกจ</span>
                    )
                  }
                />
                <InfoRow icon={CalendarDays} label="สมัครสมาชิกเมื่อ" value={joinDate} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Change Password Card ── */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4" />
                เปลี่ยนรหัสผ่าน
              </CardTitle>
              <CardDescription>
                อัปเดตรหัสผ่านเพื่อความปลอดภัย ควรใช้รหัสผ่านที่มีความยาวอย่างน้อย 8 ตัวอักษร
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Security tip */}
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  ใช้รหัสผ่านที่ผสมตัวอักษรพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ เพื่อความปลอดภัยสูงสุด
                </p>
              </div>

              <form ref={formRef} onSubmit={handleChangePassword} className="space-y-4">
                {/* Current password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="currentPassword">
                    รหัสผ่านปัจจุบัน
                  </label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrent ? "text" : "password"}
                      placeholder="รหัสผ่านปัจจุบันของคุณ"
                      className={fieldErrors.currentPassword ? "border-destructive pr-10" : "pr-10"}
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowCurrent((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.currentPassword && (
                    <p className="text-xs text-destructive">{fieldErrors.currentPassword}</p>
                  )}
                </div>

                <Separator />

                {/* New password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="newPassword">
                    รหัสผ่านใหม่
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showNew ? "text" : "password"}
                      placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
                      className={fieldErrors.newPassword ? "border-destructive pr-10" : "pr-10"}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.newPassword && (
                    <p className="text-xs text-destructive">{fieldErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="confirmPassword">
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                      className={fieldErrors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        เปลี่ยนรหัสผ่าน
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
