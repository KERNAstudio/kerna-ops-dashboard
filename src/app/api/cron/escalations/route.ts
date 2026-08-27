import { NextRequest, NextResponse } from "next/server";
import { runEscalationChecks } from "@/lib/escalations/detect";

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically once CRON_SECRET
// is set as an env var — see vercel.json for the schedule. Manual "Run Checks" in the
// Escalation Center UI (src/app/app/escalations/actions.ts) stays the RBAC-guarded path
// for a logged-in Founder/Management; this route is unauthenticated-by-role on purpose,
// since cron has no user session, and is gated by the shared secret instead.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await runEscalationChecks();
  return NextResponse.json({ ok: true });
}
