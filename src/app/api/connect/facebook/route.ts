import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { encodeState } from "@/lib/connect-state";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.log("[FB_OAUTH] No session found, redirecting to login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  console.log("[FB_OAUTH] Initiating OAuth for user:", session.user.id);

  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) {
    console.error("[FB_OAUTH] FACEBOOK_APP_ID not configured");
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=fb_config", req.url)
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;
  const redirectUri = `${baseUrl}/api/connect/facebook/callback`;
  const state = encodeState(session.user.id);

  console.log("[FB_OAUTH] OAuth configuration:", {
    baseUrl,
    redirectUri,
    appId: appId.substring(0, 4) + "...",
    userId: session.user.id
  });

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "public_profile,email",
    state,
    response_type: "code",
  });

  const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
  console.log("[FB_OAUTH] Redirecting to Facebook OAuth dialog");

  return NextResponse.redirect(oauthUrl);
}
