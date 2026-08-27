"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export type VaultFormState = { error: string | null; fileUrl?: string };

// No VAULT_EDIT permission code exists in §3's registry — uploading is project
// administration, gated the same way module creation is (PROJECT_EDIT, POC-overridable).
export async function addResource(_prev: VaultFormState, formData: FormData): Promise<VaultFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId, permission: "PROJECT_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const fileUrl = String(formData.get("file_url") ?? "").trim();
  const downloadable = formData.get("downloadable") === "on";
  if (!fileUrl) return { error: "A file URL is required." };

  const admin = createAdminClient();
  const { data: resource, error } = await admin
    .from("resources")
    .insert({ project_id: projectId, file_url: fileUrl, downloadable })
    .select()
    .single();
  if (error || !resource) return { error: "Could not add resource." };

  await logAudit({ userId: actor.id, entityType: "resource", entityId: resource.id, action: "create", newState: resource });

  revalidatePath(`/app/projects/${projectId}/vault`);
  return { error: null };
}

// CLAUDE.md non-negotiable: "Vault download is payment-gated... preview always allowed."
// This is only called when the client-side gate already passed, but it re-checks
// server-side so the rule can't be bypassed by calling the action directly.
export async function logDownload(_prev: VaultFormState, formData: FormData): Promise<VaultFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId });

  const resourceId = String(formData.get("resource_id") ?? "");
  const admin = createAdminClient();
  const { data: resource } = await admin.from("resources").select("*").eq("id", resourceId).maybeSingle();
  if (!resource || resource.project_id !== projectId) redirect("/403");

  const { data: project } = await admin.from("projects").select("status").eq("id", projectId).maybeSingle();
  const fullyPaid = project?.status === "completed";
  if (!resource.downloadable || !fullyPaid) {
    return { error: "This resource isn't available for download yet." };
  }

  await logAudit({
    userId: actor.type === "staff" ? actor.id : null,
    entityType: "resource",
    entityId: resourceId,
    action: "download",
    newState: resource,
  });

  return { error: null, fileUrl: resource.file_url };
}
