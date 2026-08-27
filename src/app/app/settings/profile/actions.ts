"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export type ProfileFormState = { error: string | null; saved?: boolean };

// §4: "/app/settings/profile|team|system — minimal v1; team/system deferred." Only
// profile is built — name is the one editable field on USERS beyond what auth already owns.
export async function updateProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const actor = await guard();
  if (actor.type !== "staff") redirect("/403");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const admin = createAdminClient();
  const { data: previous } = await admin.from("users").select("*").eq("id", actor.id).single();

  const { data: updated } = await admin
    .from("users")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", actor.id)
    .select()
    .single();

  await logAudit({
    userId: actor.id,
    entityType: "user",
    entityId: actor.id,
    action: "update_profile",
    previousState: previous,
    newState: updated,
  });

  revalidatePath("/", "layout");
  return { error: null, saved: true };
}
