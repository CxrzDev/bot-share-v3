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

    // Fetch user profile (basic permissions only)
    const profileUrl = `https://graph.facebook.com/v18.0/me?` +
      new URLSearchParams({
        access_token: userToken,
        fields: "id,name,email,picture",
      });

    console.log("[FB_OAUTH] Fetching user profile...");
    const profileRes = await fetch(profileUrl);
    const profileData = await profileRes.json();

    if (profileData.error) {
      return fail("fb_token", `Failed to fetch profile: ${profileData.error.message || JSON.stringify(profileData.error)}`);
    }

    console.log("[FB_OAUTH] Profile fetched:", profileData.name);

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
    });

    const maxAllowed = user.package.maxFbAccounts;

    if (user.accounts.length >= maxAllowed) {
      console.log("[FB_OAUTH] Quota limit reached");
      return fail("no_package", "Facebook account quota limit reached");
    }

    // Check if account already exists
    const existing = await prisma.account.findFirst({
      where: { userId, platform: "FACEBOOK", platformAccountId: profileData.id },
    });

    if (existing) {
      console.log("[FB_OAUTH] Updating existing account:", profileData.name);
      await prisma.account.update({
        where: { id: existing.id },
        data: {
          token: userToken,
          accountName: profileData.name,
          avatarUrl: profileData.picture?.data?.url ?? existing.avatarUrl,
          status: "ACTIVE",
          connectedViaOAuth: true,
          lastChecked: new Date(),
        },
      });
      
      console.log("[FB_OAUTH] Successfully updated account");
      return NextResponse.redirect(
        new URL(`/dashboard/accounts?connected=facebook&saved=0`, base)
      );
    } else {
      console.log("[FB_OAUTH] Creating new account:", profileData.name);
      await prisma.account.create({
        data: {
          userId,
          platform: "FACEBOOK",
          accountName: profileData.name,
          token: userToken,
          platformAccountId: profileData.id,
          avatarUrl: profileData.picture?.data?.url ?? null,
          status: "ACTIVE",
          connectedViaOAuth: true,
          lastChecked: new Date(),
        },
      });

      console.log("[FB_OAUTH] Successfully created account");
      return NextResponse.redirect(
        new URL(`/dashboard/accounts?connected=facebook&saved=1`, base)
      );
    }
  } catch (err) {
    console.error("[FB_OAUTH] Unexpected error:", err);
    return fail("fb_token", `Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
