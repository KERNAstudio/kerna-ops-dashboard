"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { advanceProjectStatus } from "@/lib/projects/lifecycle";

export type ModuleFormState = { error: string | null };

// §2 step 5, "Project Assignment": modeled as creating the project's modules and assigning
// staff to them — the schema has no project-level "team" concept separate from modules
// (MODULE_ASSIGNMENTS is the only assignment table), so this *is* what assigning a team means.
export async function createModule(_prev: ModuleFormState, formData: FormData): Promise<ModuleFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId, permission: "PROJECT_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const moduleType = String(formData.get("module_type") ?? "").trim();
  if (!moduleType) return { error: "Module name is required." };

  const admin = createAdminClient();
  const { data: mod, error } = await admin
    .from("project_modules")
    .insert({ project_id: projectId, module_type: moduleType, status: "not_started" })
    .select()
    .single();
  if (error || !mod) return { error: "Could not create module." };

  await logAudit({ userId: actor.id, entityType: "project_module", entityId: mod.id, action: "create", newState: mod });

  revalidatePath(`/app/projects/${projectId}/modules`);
  return { error: null };
}

export async function assignModuleUser(_prev: ModuleFormState, formData: FormData): Promise<ModuleFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId, permission: "PROJECT_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const moduleId = String(formData.get("module_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  if (!userId) return { error: "Choose a staff member." };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("module_assignments")
    .select("id")
    .eq("module_id", moduleId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return { error: "Already assigned." };

  const { data: assignment, error } = await admin
    .from("module_assignments")
    .insert({ module_id: moduleId, user_id: userId })
    .select()
    .single();
  if (error || !assignment) return { error: "Could not assign." };

  await logAudit({
    userId: actor.id,
    entityType: "module_assignment",
    entityId: assignment.id,
    action: "create",
    newState: assignment,
  });

  // §2: "...Advance Paid → Team Assigned..." — the first assignment on the project moves it.
  await advanceProjectStatus(projectId, "advance_paid", "team_assigned", actor.id, "status_team_assigned");

  revalidatePath(`/app/projects/${projectId}/modules`);
  return { error: null };
}
