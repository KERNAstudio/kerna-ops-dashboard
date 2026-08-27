import type { createAdminClient } from "@/lib/supabase/admin";
import { getProjectPaidPercent } from "./payment-progress";
import { defaultFor } from "@/lib/system-settings";

// CLAUDE.md non-negotiable: "Vault download is payment-gated. payment_status !== FULLY_PAID
// → downloads disabled, preview still allowed." This used to be a flat "must be 'completed'"
// check — deliberately loosened here into an admin-configurable minimum-%-paid threshold
// (§8 open item "payment unlock rule", system_settings key payment_unlock_min_percent,
// default 100). Default 100 reproduces the old all-or-nothing behavior exactly: nothing
// unlocks below full payment unless a Founder explicitly lowers the threshold in System
// Settings. `status === "completed"` is kept as an unconditional true so a project that's
// fully wrapped up never re-locks due to a rounding edge in paidPercent.
export function isProjectFullyPaid(projectStatus: string, paidPercent: number, unlockThresholdPercent: number): boolean {
  return projectStatus === "completed" || paidPercent >= unlockThresholdPercent;
}

// Convenience wrapper for the three call sites that don't already have paidPercent/threshold
// on hand — resolves both from the DB and system_settings, then applies the rule above.
export async function checkProjectFullyPaid(
  admin: ReturnType<typeof createAdminClient>,
  projectId: string,
  projectStatus: string
): Promise<boolean> {
  if (projectStatus === "completed") return true; // skip the extra queries on the common path

  const [{ data: setting }, paidPercent] = await Promise.all([
    admin.from("system_settings").select("value").eq("key", "payment_unlock_min_percent").maybeSingle(),
    getProjectPaidPercent(admin, projectId),
  ]);
  const threshold = Number(setting?.value);
  return isProjectFullyPaid(projectStatus, paidPercent, Number.isFinite(threshold) ? threshold : defaultFor("payment_unlock_min_percent"));
}
