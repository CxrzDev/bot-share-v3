import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decodeState } from "@/lib/connect-state";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const base = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;
  const fail = (reason: string, details?: string) => {
    console.error(`[FB_OAUTH_ERROR] ${reason}`, details || "");
    return NextResponse.redirect(new URL(`/dashboard/accounts?error=${reason}`, base));
  };

  // Log incoming request for debugging
  console.log("[FB_OAUTH] Callback received", { 
    hasCode: !!code, 
    hasState: !!state, 
    error, 
    errorDescription 
  });

  if (error) {
    return fail("fb_cancelled", `Facebook error: ${error} - ${errorDescription || "No description"}`);
  }

  if (!code || !state) {
    return fail("fb_cancelled", "Missing code or state parameter");
  }

  const userId = decodeState(state);
  if (!userId) {
    return fail("invalid_state", "State validation failed or expired");
  }

  console.log("[FB_OAUTH] State validated for user:", userId);

  // Validate environment variables
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    return fail("fb_config", "Missing Facebook credentials in environment");
  }

  try {
    // Exchange code for user access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: `${base}/api/connect/facebook/callback`,
        code,
      });

    console.log("[FB_OAUTH] Exchanging code for token...");
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return fail("fb_token", `Token exchange failed: ${tokenData.error.message || JSON.stringify(tokenData.error)}`);
    }

    if (!tokenData.access_token) {
      return fail("fb_token", `No access token in response: ${JSON.stringify(tokenData)}`);
    }

    console.log("[FB_OAUTH] Token received, exchanging for long-lived token...");

    // Exchange short-lived token for long-lived token
    const longTokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: tokenData.access_token,
      });

    const longTokenRes = await fetch(longTokenUrl);
    const longTokenData = await longTokenRes.json();

    if (longTokenData.error) {
      console.warn("[FB_OAUTH] Long-lived token exchange failed, using short-lived token:", longTokenData.error.message);
    }

    const userToken = longTokenData.access_token ?? tokenData.access_token;
    console.log("[FB_OAUTH] Using token (long-lived):", !!longTokenData.access_token);

    // Fetch managed pages
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?` +
      new URLSearchParams({
        access_token: userToken,
        fields: "id,name,access_token,picture",
      });

    console.log("[FB_OAUTH] Fetching user pages...");
    const pagesRes = await fetch(pagesUrl);
    const pagesData = await pagesRes.json();

    if (pagesData.error) {
      return fail("fb_token", `Failed to fetch pages: ${pagesData.error.message || JSON.stringify(pagesData.error)}`);
    }

    const pages: Array<{
      id: string;
      name: string;
      access_token: string;
      picture?: { data?: { url?: string } };
    }> = pagesData.data ?? [];

    console.log("[FB_OAUTH] Pages found:", pages.length);

    if (pages.length === 0) {
      return fail("no_pages", "User has no Facebook Pages to manage");
    }

    // Check user's quota
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        package: true,
        accounts: { where: { platform: "FACEBOOK" } },
      },
    });
    
    if (!user?.package) {
      return fail("no_package", "User has no active package");
    }

    console.log("[FB_OAUTH] User quota check:", {
      currentAccounts: user.accounts.length,
      maxAllowed: user.package.maxFbAccounts,
      pagesAvailable: pages.length
    });

    const maxAllowed = user.package.maxFbAccounts;
    let saved = 0;

    for (const page of pages) {
      if (user.accounts.length + saved >= maxAllowed) {
        console.log("[FB_OAUTH] Quota limit reached, stopping at", saved, "pages");
        break;
      }

      const existing = await prisma.account.findFirst({
        where: { userId, platform: "FACEBOOK", platformAccountId: page.id },
      });

      if (existing) {
        console.log("[FB_OAUTH] Updating existing page:", page.name);
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
        console.log("[FB_OAUTH] Creating new page:", page.name);
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

    console.log("[FB_OAUTH] Successfully saved", saved, "new pages");

    return NextResponse.redirect(
      new URL(`/dashboard/accounts?connected=facebook&saved=${saved}`, base)
    );
  } catch (err) {
    console.error("[FB_OAUTH] Unexpected error:", err);
    return fail("fb_token", `Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
