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

  if (error || !code || !state) return fail("fb_cancelled");

  const userId = decodeState(state);
  if (!userId) return fail("invalid_state");

  // Exchange code for user access token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID!,
        client_secret: process.env.FACEBOOK_APP_SECRET!,
        redirect_uri: `${base}/api/connect/facebook/callback`,
        code,
      })
  );
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return fail("fb_token");

  // Exchange short-lived token for long-lived token
  const longTokenRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.FACEBOOK_APP_ID!,
        client_secret: process.env.FACEBOOK_APP_SECRET!,
        fb_exchange_token: tokenData.access_token,
      })
  );
  const longTokenData = await longTokenRes.json();
  const userToken = longTokenData.access_token ?? tokenData.access_token;

  // Fetch managed pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?` +
      new URLSearchParams({
        access_token: userToken,
        fields: "id,name,access_token,picture",
      })
  );
  const pagesData = await pagesRes.json();
  const pages: Array<{
    id: string;
    name: string;
    access_token: string;
    picture?: { data?: { url?: string } };
  }> = pagesData.data ?? [];

  if (pages.length === 0) return fail("no_pages");

  // Check user's quota
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      package: true,
      accounts: { where: { platform: "FACEBOOK" } },
    },
  });
  if (!user?.package) return fail("no_package");

  const maxAllowed = user.package.maxFbAccounts;
  let saved = 0;

  for (const page of pages) {
    if (user.accounts.length + saved >= maxAllowed) break;

    const existing = await prisma.account.findFirst({
      where: { userId, platform: "FACEBOOK", platformAccountId: page.id },
    });

    if (existing) {
      await prisma.account.update({
        where: { id: existing.id },
        data: {
          token: page.access_token,
          accountName: page.name,
          avatarUrl: page.picture?.data?.url ?? existing.avatarUrl,
          status: "ACTIVE",
          connectedViaOAuth: true,
          lastChecked: new Date(),
        },
      });
    } else {
      await prisma.account.create({
        data: {
          userId,
          platform: "FACEBOOK",
          accountName: page.name,
          token: page.access_token,
          platformAccountId: page.id,
          avatarUrl: page.picture?.data?.url ?? null,
          status: "ACTIVE",
          connectedViaOAuth: true,
          lastChecked: new Date(),
        },
      });
      saved++;
    }
  }

  return NextResponse.redirect(
    new URL(`/dashboard/accounts?connected=facebook&saved=${saved}`, base)
  );
}
