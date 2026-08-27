"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export type RequirementFormState = { error: string | null };

// UI_COMPONENT_SPEC.pdf "Requirement Sheet Handling": the Initial Requirement is a locked
// snapshot, captured once at kickoff (§2 step 6) — never edited afterward. requirement_snapshots
// has a unique project_id, so a second lock attempt fails at the DB and surfaces as a friendly
// error rather than silently overwriting the baseline everyone approved against.
export async function lockRequirement(_prev: RequirementFormState, formData: FormData): Promise<RequirementFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  if (!projectId) return { error: "Missing project." };

  const actor = await guard({ projectId, permission: "PROJECT_EDIT", allowClient: false });
  if (actor.type !== "staff") redirect("/403");

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "Requirement content is required." };

  const admin = createAdminClient();
  const { data: snapshot, error } = await admin
    .from("requirement_snapshots")
    .insert({ project_id: projectId, content, locked_by: actor.id })
    .select()
    .single();
  if (error || !snapshot) return { error: "Requirement is already locked for this project." };

  await logAudit({
    userId: actor.id,
    entityType: "requirement_snapshot",
    entityId: snapshot.id,
    action: "lock",
    newState: snapshot,
  });

  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}

// Minor Change: "Addendum entry appended" — append-only, like every other log in this app.
// A Major Change (scope revision / new quotation) routes through the existing quotation
// revise flow instead of this table, per the same spec section.
export async function addAddendum(_prev: RequirementFormState, formData: FormData): Promise<RequirementFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  if (!projectId) return { error: "Missing project." };

  const actor = await guard({ projectId, permission: "PROJECT_EDIT", allowClient: false });
  if (actor.type !== "staff") redirect("/403");

  const description = String(formData.get("description") ?? "").trim();
  if (!description) return { error: "Describe the change." };

  const admin = createAdminClient();
  const { data: snapshot } = await admin.from("requirement_snapshots").select("id").eq("project_id", projectId).maybeSingle();
  if (!snapshot) return { error: "Lock the initial requirement before adding an addendum." };

  const { data: addendum, error } = await admin
    .from("requirement_addenda")
    .insert({ project_id: projectId, description, created_by: actor.id })
    .select()
    .single();
  if (error || !addendum) return { error: "Could not save the addendum." };

  await logAudit({
    userId: actor.id,
    entityType: "requirement_addendum",
    entityId: addendum.id,
    action: "create",
    newState: addendum,
  });

  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}
