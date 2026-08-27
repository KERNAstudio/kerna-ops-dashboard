"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export type ReviewFormState = { error: string | null };

async function assertClientOwnsProject(actor: Awaited<ReturnType<typeof guard>>, projectId: string) {
  if (actor.type !== "client") redirect("/403");
  const admin = createAdminClient();
  const { data: project } = await admin.from("projects").select("client_id").eq("id", projectId).maybeSingle();
  if (!project || project.client_id !== actor.clientId) redirect("/403");
}

export async function approveVersion(_prev: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId });
  await assertClientOwnsProject(actor, projectId);

  const approvalId = String(formData.get("approval_id") ?? "");
  const admin = createAdminClient();
  const { data: previous } = await admin.from("approvals").select("*").eq("id", approvalId).maybeSingle();
  if (!previous || previous.status !== "pending") return { error: "This version isn't awaiting approval." };

  const { data: updated } = await admin
    .from("approvals")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", approvalId)
    .select()
    .single();

  await logAudit({
    userId: null, // client actor — see src/lib/auth/session.ts
    entityType: "approval",
    entityId: approvalId,
    action: "client_approve",
    previousState: previous,
    newState: updated,
  });

  revalidatePath(`/app/projects/${projectId}`);
  return { error: null };
}

// APPROVALS has no feedback column (§1) — the reason text is captured in the audit log's
// new_state instead of on the row itself, rather than inventing a schema column for it.
export async function requestChanges(_prev: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId });
  await assertClientOwnsProject(actor, projectId);

  const approvalId = String(formData.get("approval_id") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();
  if (!feedback) return { error: "Add feedback so the team knows what to change." };

  const admin = createAdminClient();
  const { data: previous } = await admin.from("approvals").select("*").eq("id", approvalId).maybeSingle();
  if (!previous || previous.status !== "pending") return { error: "This version isn't awaiting approval." };

  const { data: updated } = await admin
    .from("approvals")
    .update({ status: "changes_requested" })
    .eq("id", approvalId)
    .select()
    .single();

  await logAudit({
    userId: null,
    entityType: "approval",
    entityId: approvalId,
    action: "client_request_changes",
    previousState: previous,
    newState: { ...updated, feedback },
  });

  revalidatePath(`/app/projects/${projectId}`);
  return { error: null };
}
