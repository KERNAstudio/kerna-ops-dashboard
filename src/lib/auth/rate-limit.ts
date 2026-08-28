import type { createAdminClient } from "@/lib/supabase/admin";

const MAX_FAILURES = 5;
const WINDOW_MINUTES = 15;

// Locks out further attempts for this identifier (email, lowercased) once MAX_FAILURES
// failed logins land inside WINDOW_MINUTES — resets the moment a login succeeds, since a
// stale lockout after the real user finally gets their password right serves no purpose.
export async function isRateLimited(admin: ReturnType<typeof createAdminClient>, identifier: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - WINDOW_MINUTES * 60000).toISOString();
  const { data: attempts } = await admin
    .from("login_attempts")
    .select("success")
    .eq("identifier", identifier)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(MAX_FAILURES);

  if (!attempts || attempts.length < MAX_FAILURES) return false;
  return attempts.every((a) => !a.success);
}

export async function recordLoginAttempt(admin: ReturnType<typeof createAdminClient>, identifier: string, success: boolean): Promise<void> {
  await admin.from("login_attempts").insert({ identifier, success });
}
