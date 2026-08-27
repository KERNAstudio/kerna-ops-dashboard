"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { getModuleDetail } from "@/lib/modules/access";
import { advanceProjectStatus } from "@/lib/projects/lifecycle";

export type ModuleActionState = { error: string | null };

// §7 Module Workspace upload panel. V1 preview support is image/PDF/web-preview only —
// no file storage bucket is wired yet, so file_url is a plain URL for now (same cut as
// the vault/resources tables).
export async function uploadVersion(_prev: ModuleActionState, formData: FormData): Promise<ModuleActionState> {
  const projectId = String(formData.get("project_id") ?? "");
  const moduleId = String(formData.get("module_id") ?? "");
  const actor = await guard({ projectId, moduleId, permission: "MODULE_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const { latestVersion, latestApproval } = await getModuleDetail(moduleId);
  if (latestApproval?.status === "approved") {
    return { error: "This module's latest version is approved and locked. Ask the POC to reopen it first." };
  }

  const fileUrl = String(formData.get("file_url") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!fileUrl) return { error: "A file URL is required." };

  const admin = createAdminClient();
  const nextVersionNumber = (latestVersion?.version_number ?? 0) + 1;

  const { data: version, error } = await admin
    .from("module_versions")
    .insert({
      module_id: moduleId,
      version_number: nextVersionNumber,
      file_url: fileUrl,
      notes: notes || null,
      uploaded_by: actor.id,
    })
    .select()
    .single();
  if (error || !version) return { error: "Could not save version." };

  const { data: approval } = await admin
    .from("approvals")
    .insert({ module_version_id: version.id, status: "pending" })
    .select()
    .single();

  await logAudit({
    userId: actor.id,
    entityType: "module_version",
    entityId: version.id,
    action: "upload",
    newState: { version, approval },
  });

  // §2: "...Scope Approved → In Development..." — the first version uploaded on the
  // project starts the Development phase.
  await advanceProjectStatus(projectId, "scope_approved", "in_development", actor.id, "status_in_development");

  revalidatePath(`/app/projects/${projectId}/modules/${moduleId}`);
  return { error: null };
}

// §3 Special rule: "Client approval lock — once a version is APPROVED, edits blocked.
// Only POC can reopen, with a reason. Founder cannot silently override." — so this is
// deliberately NOT guard()'s usual founder-bypass; it's checked directly against
// clients.poc_user_id, excluding founder.
export async function reopenApproval(_prev: ModuleActionState, formData: FormData): Promise<ModuleActionState> {
  const projectId = String(formData.get("project_id") ?? "");
  const moduleId = String(formData.get("module_id") ?? "");
  const actor = await guard({ projectId });
  if (actor.type !== "staff") redirect("/403");

  const admin = createAdminClient();
  const { data: project } = await admin.from("projects").select("client_id").eq("id", projectId).maybeSingle();
  const { data: client } = project
    ? await admin.from("clients").select("poc_user_id").eq("id", project.client_id).maybeSingle()
    : { data: null };
  if (client?.poc_user_id !== actor.id) {
    return { error: "Only the project's POC can reopen an approved version." };
  }

  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "A reason is required to reopen an approved version." };

  const { latestApproval } = await getModuleDetail(moduleId);
  if (!latestApproval || latestApproval.status !== "approved") {
    return { error: "The latest version isn't in an approved state." };
  }

  const { data: updated } = await admin
    .from("approvals")
    .update({ withdrawn_at: new Date().toISOString(), withdrawn_by: actor.id, status: "withdrawn" })
    .eq("id", latestApproval.id)
    .select()
    .single();

  await logAudit({
    userId: actor.id,
    entityType: "approval",
    entityId: latestApproval.id,
    action: "reopen",
    previousState: { ...latestApproval, reason },
    newState: updated,
  });

  revalidatePath(`/app/projects/${projectId}/modules/${moduleId}`);
  return { error: null };
}
