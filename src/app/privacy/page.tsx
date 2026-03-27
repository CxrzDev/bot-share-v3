import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว | Bot Share V3",
  description: "นโยบายความเป็นส่วนตัวสำหรับผู้ใช้งานระบบ Bot Share V3",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">
        นโยบายความเป็นส่วนตัว (Privacy Policy)
      </h1>

      <div className="space-y-6 text-gray-700">
        <p>
          นโยบายความเป็นส่วนตัวนี้จัดทำขึ้นสำหรับผู้ใช้งานระบบ Bot Share V3
          เพื่ออธิบายถึงการจัดเก็บ ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณ
        </p>

        <section>
          <h2 className="text-xl font-bold mb-3">1. ข้อมูลที่เรารวบรวม</h2>
          <p className="mb-3">
            เมื่อคุณเข้าสู่ระบบผ่าน Facebook หรือ LINE
            เราจะเข้าถึงข้อมูลพื้นฐานที่จำเป็นต่อการให้บริการเท่านั้น ได้แก่:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>ชื่อ-นามสกุล (Name)</li>
            <li>ที่อยู่อีเมล (Email Address)</li>
            <li>รูปโปรไฟล์ (Profile Picture)</li>
            <li>
              รหัสผู้ใช้งาน (User ID / Provider Token) จากแพลตฟอร์มนั้นๆ
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">2. การนำข้อมูลไปใช้</h2>
          <p className="mb-3">
            เราใช้ข้อมูลของคุณเพื่อวัตถุประสงค์ดังต่อไปนี้:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              เพื่อสร้างและจัดการบัญชีผู้ใช้งานในระบบ Bot Share V3
            </li>
            <li>เพื่อใช้ในการยืนยันตัวตน (Authentication)</li>
            <li>
              เพื่อใช้เป็นช่องทางในการส่งคำสั่งโพสต์อัตโนมัติตามที่คุณได้ตั้งค่าไว้
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">3. การปกป้องข้อมูล</h2>
          <p>
            เราให้ความสำคัญกับความปลอดภัยของข้อมูลคุณ รหัสผ่านและ Token ต่างๆ
            จะถูกจัดเก็บอย่างปลอดภัยในฐานข้อมูล
            และเราจะไม่มีการนำข้อมูลส่วนตัวของคุณไปขายหรือส่งต่อให้บุคคลที่สามโดยเด็ดขาด
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-3">
            4. การขอลบข้อมูล (Data Deletion)
          </h2>
          <p>
            หากคุณต้องการยกเลิกการใช้งานและขอลบข้อมูลส่วนบุคคลออกจากระบบของเราทั้งหมด
            สามารถติดต่อผู้ดูแลระบบได้โดยตรง
          </p>
        </section>

        <p className="text-sm text-gray-500 mt-8">
          ปรับปรุงล่าสุด: มีนาคม 2026
        </p>
      </div>
    </div>
  );
}
