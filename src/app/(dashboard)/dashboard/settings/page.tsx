import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ตั้งค่า</h1>
        <p className="text-muted-foreground">
          จัดการการตั้งค่าบัญชีและระบบของคุณ
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-4">
            <Settings className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">กำลังพัฒนา</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            หน้าตั้งค่าจะพร้อมใช้งานเร็วๆ นี้
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
