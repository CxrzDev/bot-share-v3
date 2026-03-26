import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { encodeState } from "@/lib/connect-state";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) {
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=fb_config", req.url)
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;
  const state = encodeState(session.user.id);

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: `${baseUrl}/api/connect/facebook/callback`,
    scope: "pages_manage_posts,pages_show_list,publish_to_groups,pages_read_engagement",
    state,
    response_type: "code",
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v18.0/dialog/oauth?${params}`
  );
}
