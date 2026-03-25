"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/pricing/payment-modal";
import {
  CheckCircle2,
  Crown,
  Sparkles,
  Zap,
  Clock,
  MessageCircle,
  Receipt,
} from "lucide-react";
import { FacebookIcon } from "@/components/ui/platform-icons";
import { cn } from "@/lib/utils";

interface Package {
  id: string;
  name: string;
  price: number;
  maxFbAccounts: number;
  maxLineAccounts: number;
  isPopular: boolean;
  description: string | null;
}

interface Transaction {
  id: string;
  packageName: string;
  amount: number;
  status: string;
  slipUrl: string;
  createdAt: string;
}

interface PricingClientProps {
  packages: Package[];
  currentPackageId: string | null;
  packageExpiry: string | null;
  recentTransactions: Transaction[];
}

const PACKAGE_ICONS: Record<string, React.ReactNode> = {
  Starter: <Zap className="h-5 w-5" />,
  Value: <Sparkles className="h-5 w-5" />,
  Pro: <Crown className="h-5 w-5" />,
};

const PACKAGE_COLORS: Record<string, string> = {
  Starter: "text-muted-foreground",
  Value: "text-blue-600 dark:text-blue-400",
  Pro: "text-amber-500 dark:text-amber-400",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "รอตรวจสอบ", variant: "secondary" },
  SUCCESS: { label: "สำเร็จ", variant: "default" },
  REJECTED: { label: "ถูกปฏิเสธ", variant: "destructive" },
};

export function PricingClient({
  packages,
  currentPackageId,
  packageExpiry,
  recentTransactions,
}: PricingClientProps) {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const openPayment = (pkg: Package) => {
    setSelectedPackage(pkg);
    setPaymentOpen(true);
  };

  const expiryDate = packageExpiry ? new Date(packageExpiry) : null;
  const isExpired = expiryDate ? expiryDate < new Date() : false;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">แพ็กเกจและราคา</h1>
        <p className="mt-1 text-muted-foreground">
          เลือกแพ็กเกจที่เหมาะกับความต้องการของคุณ
        </p>
        {expiryDate && !isExpired && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>
              แพ็กเกจหมดอายุ{" "}
              <span className="font-semibold">
                {expiryDate.toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </span>
          </div>
        )}
        {isExpired && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-sm text-destructive">
            <Clock className="h-3.5 w-3.5" />
            <span>แพ็กเกจหมดอายุแล้ว กรุณาต่ออายุ</span>
          </div>
        )}
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        {packages.map((pkg) => {
          const isCurrent = pkg.id === currentPackageId && !isExpired;
          const isFree = pkg.price === 0;
          const iconColor = PACKAGE_COLORS[pkg.name] ?? "text-primary";

          return (
            <div
              key={pkg.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-md",
                pkg.isPopular
                  ? "border-primary/50 bg-primary/5 shadow-sm"
                  : "bg-card",
                isCurrent && "ring-2 ring-primary ring-offset-2"
              )}
            >
              {/* Popular badge */}
              {pkg.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground shadow-sm">
                    ยอดนิยม
                  </Badge>
                </div>
              )}

              {/* Current badge */}
              {isCurrent && (
                <div className="absolute right-4 top-4">
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="mr-1 h-3 w-3 text-primary" />
                    ใช้งานอยู่
                  </Badge>
                </div>
              )}

              {/* Icon + Name */}
              <div className={cn("mb-4 flex items-center gap-2", iconColor)}>
                {PACKAGE_ICONS[pkg.name] ?? <Zap className="h-5 w-5" />}
                <span className="text-lg font-bold">{pkg.name}</span>
              </div>

              {/* Price */}
              <div className="mb-6">
                {isFree ? (
                  <p className="text-3xl font-extrabold">ฟรี</p>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">
                      ฿{pkg.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 30 วัน</span>
                  </div>
                )}
                {pkg.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>
                )}
              </div>

              {/* Features */}
              <ul className="mb-8 flex flex-1 flex-col gap-3">
                <li className="flex items-center gap-2 text-sm">
                  <FacebookIcon className="h-4 w-4 shrink-0 text-blue-600" />
                  <span>
                    Facebook{" "}
                    <span className="font-semibold">{pkg.maxFbAccounts}</span> บัญชี
                  </span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <MessageCircle className="h-4 w-4 shrink-0 text-green-600" />
                  <span>
                    LINE <span className="font-semibold">{pkg.maxLineAccounts}</span> บัญชี
                  </span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>โพสต์อัตโนมัติ 24/7</span>
                </li>
                {pkg.price >= 299 && (
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>รองรับทุก Group / Page</span>
                  </li>
                )}
                {pkg.price >= 799 && (
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>Priority Support</span>
                  </li>
                )}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <Button variant="secondary" className="w-full" disabled>
                  <CheckCircle2 className="h-4 w-4" />
                  แพ็กเกจปัจจุบัน
                </Button>
              ) : isFree ? (
                <Button variant="outline" className="w-full" disabled>
                  แพ็กเกจพื้นฐาน
                </Button>
              ) : (
                <Button
                  className={cn(
                    "w-full",
                    pkg.isPopular && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  onClick={() => openPayment(pkg)}
                >
                  อัปเกรด
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent transactions */}
      {recentTransactions.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">ประวัติการชำระเงิน</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">แพ็กเกจ</th>
                  <th className="pb-2 pr-4 font-medium">จำนวนเงิน</th>
                  <th className="pb-2 pr-4 font-medium">สถานะ</th>
                  <th className="pb-2 font-medium">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentTransactions.map((tx) => {
                  const cfg = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.PENDING;
                  return (
                    <tr key={tx.id} className="py-2">
                      <td className="py-3 pr-4 font-medium">{tx.packageName}</td>
                      <td className="py-3 pr-4 tabular-nums">
                        ฿{tx.amount.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={cfg.variant} className="text-xs">
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {selectedPackage && (
        <PaymentModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          package={selectedPackage}
        />
      )}
    </div>
  );
}
