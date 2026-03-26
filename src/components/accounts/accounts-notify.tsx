"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

const ERROR_MESSAGES: Record<string, string> = {
  fb_cancelled: "ยกเลิกการเชื่อมต่อ Facebook",
  fb_token: "ไม่สามารถรับ Token จาก Facebook ได้",
  fb_config: "ยังไม่ได้ตั้งค่า Facebook App ID",
  no_pages: "ไม่พบ Facebook Page ในบัญชีนี้",
  no_package: "ไม่พบแพ็กเกจ กรุณาเลือกแพ็กเกจก่อน",
  line_cancelled: "ยกเลิกการเชื่อมต่อ LINE",
  line_token: "ไม่สามารถรับ Token จาก LINE ได้",
  line_config: "ยังไม่ได้ตั้งค่า LINE Channel ID",
  line_profile: "ไม่สามารถดึงข้อมูลโปรไฟล์ LINE ได้",
  line_quota: "โควต้า LINE เต็มแล้ว กรุณาอัปเกรดแพ็กเกจ",
  invalid_state: "Session หมดอายุ กรุณาลองใหม่",
};

export function AccountsNotify() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const connected = searchParams.get("connected");
    const saved = searchParams.get("saved");
    const error = searchParams.get("error");

    if (connected === "facebook") {
      const count = parseInt(saved ?? "0", 10);
      toast.success("เชื่อมต่อ Facebook สำเร็จ!", {
        description:
          count > 0
            ? `เพิ่ม ${count} เพจเข้าระบบแล้ว`
            : "อัปเดตข้อมูลเพจที่มีอยู่แล้ว",
      });
    } else if (connected === "line") {
      const count = parseInt(saved ?? "0", 10);
      toast.success("เชื่อมต่อ LINE สำเร็จ!", {
        description:
          count > 0
            ? "เพิ่มบัญชี LINE เข้าระบบแล้ว"
            : "อัปเดต Token LINE ที่มีอยู่แล้ว",
      });
    } else if (error) {
      toast.error(ERROR_MESSAGES[error] ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
    }

    if (connected || error) {
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  return null;
}
