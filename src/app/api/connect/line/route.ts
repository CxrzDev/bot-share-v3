import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { encodeState } from "@/lib/connect-state";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const channelId = process.env.LINE_CHANNEL_ID;
  if (!channelId) {
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=line_config", req.url)
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;
  const state = encodeState(session.user.id);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: channelId,
    redirect_uri: `${baseUrl}/api/connect/line/callback`,
    state,
    scope: "profile openid",
  });

  return NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?${params}`
  );
}
