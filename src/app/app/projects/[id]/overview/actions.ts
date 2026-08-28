"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { advanceProjectStatus } from "@/lib/projects/lifecycle";

export type OverviewFormState = { error: string | null };

// §3 Dual Deadline Visibility pattern also applies to health: health_score_internal (staff
// only) and health_status_client (client-safe) are two independent columns, never derived
// from each other, so the POC/Founder sets both explicitly here.
export async function updateHealth(_prev: OverviewFormState, formData: FormData): Promise<OverviewFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId, permission: "PROJECT_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const scoreRaw = String(formData.get("health_score_internal") ?? "").trim();
  const score = scoreRaw === "" ? null : Number(scoreRaw);
  if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) {
    return { error: "Internal health score must be between 0 and 100." };
  }
  const clientStatus = String(formData.get("health_status_client") ?? "").trim() || null;

  const admin = createAdminClient();
  const { data: previous } = await admin.from("projects").select("*").eq("id", projectId).maybeSingle();

  const { data: updated } = await admin
    .from("projects")
    .update({ health_score_internal: score, health_status_client: clientStatus })
    .eq("id", projectId)
    .select()
    .single();

  await logAudit({
    userId: actor.id,
    entityType: "project",
    entityId: projectId,
    action: "update_health",
    previousState: previous,
    newState: updated,
  });

  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}

// §2 step 6 (Kickoff Meeting): "POC uploads scope, timeline, milestones" — timeline maps to
// these two deadline columns already on PROJECTS; scope/milestones map to the modules
// already defined on the Modules tab. No dedicated scope-document table exists in §1.
export async function updateTimeline(_prev: OverviewFormState, formData: FormData): Promise<OverviewFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId, permission: "PROJECT_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const internalDeadline = String(formData.get("internal_deadline") ?? "").trim();
  const clientDeadline = String(formData.get("client_deadline") ?? "").trim();

  const admin = createAdminClient();
  const { data: previous } = await admin.from("projects").select("*").eq("id", projectId).single();

  const { data: updated } = await admin
    .from("projects")
    .update({
      internal_deadline: internalDeadline || null,
      client_deadline: clientDeadline || null,
    })
    .eq("id", projectId)
    .select()
    .single();

  await logAudit({
    userId: actor.id,
    entityType: "project",
    entityId: projectId,
    action: "update_timeline",
    previousState: previous,
    newState: updated,
  });

  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}

// §2: "...Team Assigned → Scope Approved..." — the client's second approval (after the
// quotation) that unblocks the Development phase.
export async function approveScope(_prev: OverviewFormState, formData: FormData): Promise<OverviewFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId });
  if (actor.type !== "client") redirect("/403");

  await advanceProjectStatus(projectId, "team_assigned", "scope_approved", null, "client_approve_scope");
  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}

// §2 step 8: "Dev marks ready" — modeled at the project level (POC/Founder call, since
// there's no per-module "ready" flag distinct from an uploaded+approved version). Allowed
// any time development is underway; forward-only guard is inside advanceProjectStatus.
export async function sendForFinalApproval(_prev: OverviewFormState, formData: FormData): Promise<OverviewFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId, permission: "PROJECT_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  await advanceProjectStatus(projectId, "in_development", "deliverable_sent", actor.id, "send_final_approval");
  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}

// §2 step 8: client's final approval moves to "Final Approved" — delivery is done, payment
// isn't yet requested. Previously this jumped straight to "Final Payment Pending" in one
// step, on the reasoning that the two states were "not independently actionable" — that
// broke down once subscriptions existed: a project can now sit fully delivered with no
// one-time final payment in flight at all. logPayment (payments/actions.ts) is what moves
// it on to final_payment_pending, the moment a "final" payment is actually logged.
export async function approveFinalDelivery(_prev: OverviewFormState, formData: FormData): Promise<OverviewFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId });
  if (actor.type !== "client") redirect("/403");

  await advanceProjectStatus(projectId, "deliverable_sent", "final_approved", null, "client_approve_final_delivery");
  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}

// §2 step 8: "Reject → notify + POC schedules meeting." No notification system is wired
// yet (§8 Open Items doesn't even fully spec it) — this records the rejection in the audit
// trail and sends the project back to in_development so the team can act on it.
export async function rejectFinalDelivery(_prev: OverviewFormState, formData: FormData): Promise<OverviewFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId });
  if (actor.type !== "client") redirect("/403");

  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "Add a reason so the team knows what to fix." };

  const admin = createAdminClient();
  const { data: previous } = await admin.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (!previous || previous.status !== "deliverable_sent") {
    return { error: "This project isn't awaiting final approval." };
  }

  const { data: updated } = await admin
    .from("projects")
    .update({ status: "in_development" })
    .eq("id", projectId)
    .select()
    .single();

  await logAudit({
    userId: null,
    entityType: "project",
    entityId: projectId,
    action: "client_reject_final_delivery",
    previousState: { ...previous, reason },
    newState: updated,
  });

  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}
