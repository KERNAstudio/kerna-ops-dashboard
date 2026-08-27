import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { SYSTEM_SETTINGS } from "@/lib/system-settings";
import { SystemSettingsForm } from "./SystemSettingsForm";

// §4 route map: "/app/settings/profile|team|system — minimal v1; team/system deferred."
// This closes the "system" half — Founder-only, per CLAUDE.md's "thresholds are config,
// not constants" rule.
export default async function SystemSettingsPage() {
  await guard({ allowStaffRoles: ["founder"], allowClient: false });

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("system_settings")
    .select("key, value")
    .in(
      "key",
      SYSTEM_SETTINGS.map((s) => s.key)
    );
  const values = new Map((rows ?? []).map((r) => [r.key, r.value]));

  return (
    <SystemSettingsForm
      settings={SYSTEM_SETTINGS.map((s) => ({
        ...s,
        value: Number(values.get(s.key)) || s.default,
      }))}
    />
  );
}
