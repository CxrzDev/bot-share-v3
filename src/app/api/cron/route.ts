import { NextRequest, NextResponse } from "next/server";
import { processDueSchedules } from "@/lib/services/bot-engine";

/**
 * GET /api/cron
 *
 * Invoked by an external cron service (e.g. cron-job.org, Vercel Cron).
 * Protected by a Bearer token that must match CRON_SECRET env var.
 *
 * Example header:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Vercel Cron invocation (vercel.json):
 *   { "crons": [{ "path": "/api/cron", "schedule": "* * * * *" }] }
 *   Set the Authorization header via CRON_SECRET in Vercel environment variables.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[cron] CRON_SECRET is not set — refusing to run");
    return NextResponse.json(
      { error: "Server misconfiguration: CRON_SECRET not set" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const provided = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (provided !== cronSecret) {
    console.warn("[cron] Unauthorized request — token mismatch");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Run engine ────────────────────────────────────────────────────────────
  try {
    const result = await processDueSchedules();
    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron] Engine threw unexpected error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// Prevent Next.js from caching this route
export const dynamic = "force-dynamic";
