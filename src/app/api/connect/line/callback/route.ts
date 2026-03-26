import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decodeState } from "@/lib/connect-state";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const base = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/dashboard/accounts?error=${reason}`, base));

  if (error || !code || !state) return fail("line_cancelled");

  const userId = decodeState(state);
  if (!userId) return fail("invalid_state");

  // Exchange code for access token
  const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${base}/api/connect/line/callback`,
      client_id: process.env.LINE_CHANNEL_ID!,
      client_secret: process.env.LINE_CHANNEL_SECRET!,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return fail("line_token");

  // Get LINE user profile
  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json();
  if (!profile.userId) return fail("line_profile");

  // Check user's quota
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      package: true,
      accounts: { where: { platform: "LINE" } },
    },
  });
  if (!user?.package) return fail("no_package");

  const maxAllowed = user.package.maxLineAccounts;

  const existing = await prisma.account.findFirst({
    where: { userId, platform: "LINE", platformAccountId: profile.userId },
  });

  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: {
        token: tokenData.access_token,
        accountName: profile.displayName,
        avatarUrl: profile.pictureUrl ?? existing.avatarUrl,
        status: "ACTIVE",
        connectedViaOAuth: true,
        lastChecked: new Date(),
      },
    });
    return NextResponse.redirect(
      new URL("/dashboard/accounts?connected=line&saved=0", base)
    );
  }

  if (user.accounts.length >= maxAllowed) return fail("line_quota");

  await prisma.account.create({
    data: {
      userId,
      platform: "LINE",
      accountName: profile.displayName,
      token: tokenData.access_token,
      platformAccountId: profile.userId,
      avatarUrl: profile.pictureUrl ?? null,
      status: "ACTIVE",
      connectedViaOAuth: true,
      lastChecked: new Date(),
    },
  });

  return NextResponse.redirect(
    new URL("/dashboard/accounts?connected=line&saved=1", base)
  );
}
