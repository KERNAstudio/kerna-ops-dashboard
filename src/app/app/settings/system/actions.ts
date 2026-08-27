"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { SYSTEM_SETTINGS } from "@/lib/system-settings";

export type SystemSettingsFormState = { error: string | null; saved?: boolean };

export async function updateSystemSettings(
  _prev: SystemSettingsFormState,
  formData: FormData
): Promise<SystemSettingsFormState> {
  const actor = await guard({ allowStaffRoles: ["founder"], allowClient: false });
  if (actor.type !== "staff") redirect("/403");

  const admin = createAdminClient();

  for (const setting of SYSTEM_SETTINGS) {
    const raw = String(formData.get(setting.key) ?? "").trim();
    const value = Number(raw);
    if (raw === "" || !Number.isFinite(value) || value < 0) {
      return { error: `${setting.label} must be a non-negative number.` };
    }

    const { data: previous } = await admin.from("system_settings").select("*").eq("key", setting.key).maybeSingle();
    if (previous?.value === value) continue; // no-op, skip the audit noise

    const { data: updated } = await admin
      .from("system_settings")
      .upsert({ key: setting.key, value, updated_by: actor.id, updated_at: new Date().toISOString() }, { onConflict: "key" })
      .select()
      .single();

    await logAudit({
      userId: actor.id,
      entityType: "system_settings",
      entityId: setting.key,
      action: "update",
      previousState: previous,
      newState: updated,
    });
  }

  revalidatePath("/app/settings/system");
  return { error: null, saved: true };
}
