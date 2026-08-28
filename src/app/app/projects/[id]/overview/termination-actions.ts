"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export type TerminationFormState = { error: string | null };

// §2 step 12 "Data Control": client can request deletion of the full project.
// TERMINATION_REQUESTS has no scope column (§1), so it's whole-project only — the
// deliverables-only / credentials-only granularity the spec also mentions isn't
// representable without adding a column, which wasn't part of this pass.
export async function requestTermination(_prev: TerminationFormState, formData: FormData): Promise<TerminationFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId });
  if (actor.type !== "client") redirect("/403");

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("termination_requests")
    .select("id")
    .eq("project_id", projectId)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return { error: "A termination request is already pending review." };

  const { data: request, error } = await admin
    .from("termination_requests")
    .insert({ project_id: projectId, status: "pending" })
    .select()
    .single();
  if (error || !request) return { error: "Could not submit the request." };

  await logAudit({
    userId: null,
    entityType: "termination_request",
    entityId: request.id,
    action: "client_request",
    newState: request,
  });

  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}

export async function resolveTermination(_prev: TerminationFormState, formData: FormData): Promise<TerminationFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId, permission: "PROJECT_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const requestId = String(formData.get("request_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "approved" && status !== "rejected") return { error: "Invalid status." };

  const admin = createAdminClient();
  const { data: previous } = await admin.from("termination_requests").select("*").eq("id", requestId).maybeSingle();
  if (!previous || previous.project_id !== projectId) redirect("/403");

  const { data: updated } = await admin
    .from("termination_requests")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("id", requestId)
    .select()
    .single();

  // Approval revokes the client's access to this project (see guard.ts) — it does not
  // delete anything. KERNA_TC_1.pdf §21.2 reserves indefinite internal data retention, so
  // "delete my project" is honored as "I can no longer see it," not literal destruction.
  if (status === "approved") {
    const { data: revokedProject } = await admin
      .from("projects")
      .update({ client_access_revoked_at: new Date().toISOString() })
      .eq("id", projectId)
      .select()
      .single();
    await logAudit({
      userId: actor.id,
      entityType: "project",
      entityId: projectId,
      action: "client_access_revoked",
      newState: revokedProject,
    });
  }

  await logAudit({
    userId: actor.id,
    entityType: "termination_request",
    entityId: requestId,
    action: `staff_${status}`,
    previousState: previous,
    newState: updated,
  });

  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}
