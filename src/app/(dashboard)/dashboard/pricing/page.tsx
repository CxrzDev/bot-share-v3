import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PricingClient } from "@/components/pricing/pricing-client";

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [packages, user, recentTransactions] = await Promise.all([
    prisma.package.findMany({ orderBy: { price: "asc" } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { currentPackageId: true, packageExpiry: true },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      include: { package: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const serialized = {
    packages: packages.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      maxFbAccounts: p.maxFbAccounts,
      maxLineAccounts: p.maxLineAccounts,
      isPopular: p.isPopular,
      description: p.description ?? null,
    })),
    currentPackageId: user?.currentPackageId ?? null,
    packageExpiry: user?.packageExpiry?.toISOString() ?? null,
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      packageName: t.package.name,
      amount: t.amount,
      status: t.status,
      slipUrl: t.slipUrl,
      createdAt: t.createdAt.toISOString(),
    })),
  };

  return <PricingClient {...serialized} />;
}
