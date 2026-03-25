import { Zap, CheckCircle2, BarChart3, Shield, Clock } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "ตั้งเวลาอัจฉริยะ",
    desc: "กำหนดเวลาโพสต์แบบแม่นยำ พร้อมระบบหน่วงเวลาป้องกันแบน",
  },
  {
    icon: BarChart3,
    title: "หลายบัญชี",
    desc: "จัดการบัญชี Facebook และ LINE จากหน้าเดียว",
  },
  {
    icon: Shield,
    title: "เทคโนโลยีป้องกันแบน",
    desc: "ระบบหน่วงเวลาสุ่มช่วยปกป้องบัญชีของคุณโดยอัตโนมัติ",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left branding panel (desktop only) ── */}
      <aside className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 p-12 flex-shrink-0">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-violet-700/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-800/40 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-violet-900/20 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
            <Zap className="h-5 w-5 text-violet-300" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            BotShare
          </span>
        </div>

        {/* Hero text + features */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight text-white">
              โพสต์โซเชียลอัตโนมัติ
              <br />
              <span className="text-violet-300">ง่ายๆ ไม่ต้องกังวล</span>
            </h1>
            <p className="max-w-sm text-base leading-relaxed text-indigo-200">
              ระบบจัดตารางโพสต์อัจฉริยะสำหรับ Facebook และ LINE
              — สร้างมาเพื่อนักการตลาดที่ไม่อยากโดนแบน
            </p>
          </div>

          <div className="space-y-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10">
                  <Icon className="h-4 w-4 text-violet-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-indigo-100">
                    {title}
                  </p>
                  <p className="text-xs text-indigo-300 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer stat */}
        <div className="relative z-10 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-violet-400" />
          <p className="text-xs text-indigo-400">
            ไว้วางใจโดย{" "}
            <span className="text-indigo-200 font-medium">1,000+</span>{" "}
            นักการตลาดทั่วเอเชียตะวันออกเฉียงใต้
          </p>
        </div>
      </aside>

      {/* ── Right form panel ── */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">BotShare</span>
        </div>

        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}
