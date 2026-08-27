"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { runEscalationChecks } from "@/lib/escalations/detect";
import { ESCALATION_STATUSES, ESCALATION_TRANSITIONS, type EscalationStatus } from "@/lib/escalations/constants";

export type EscalationFormState = { error: string | null };

export async function runChecks(_prev: EscalationFormState, _formData: FormData): Promise<EscalationFormState> {
  await guard({ allowStaffRoles: ["founder", "management"], allowClient: false });
  await runEscalationChecks();
  revalidatePath("/app/escalations");
  return { error: null };
}

// §5: "Manual escalation: Founder ✓, POC ✓, System ✓ (automated), Dev/Design ✕, Client ✕."
// Gated on PROJECT_EDIT with a projectId rather than a founder-only role check, so guard()'s
// POC override (§3) grants access to the project's own POC — Founder still passes via the
// "broad" override, so this is one check that covers both without a bespoke ESCALATION_CREATE
// permission code.
export async function createManualEscalation(_prev: EscalationFormState, formData: FormData): Promise<EscalationFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  if (!projectId) return { error: "Project and type are required." };

  const actor = await guard({ projectId, permission: "PROJECT_EDIT", allowClient: false });
  if (actor.type !== "staff") redirect("/403");

  const escalationType = String(formData.get("escalation_type") ?? "").trim();
  const severity = String(formData.get("severity") ?? "medium");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!escalationType) return { error: "Project and type are required." };

  const admin = createAdminClient();
  const { data: escalation, error } = await admin
    .from("escalations")
    .insert({
      project_id: projectId,
      escalation_type: escalationType,
      severity,
      status: "open",
      owner_id: actor.id,
      triggered_by: actor.name,
      reason: reason || null,
    })
    .select()
    .single();
  if (error || !escalation) return { error: "Could not create escalation." };

  await logAudit({
    userId: actor.id,
    entityType: "escalation",
    entityId: escalation.id,
    action: "manual_create",
    newState: escalation,
  });

  revalidatePath("/app/escalations");
  return { error: null };
}

// §3 RBAC: Management is "VIEW analytics/projects/payments... NO edit permissions" — the
// project-level widget spec even says "Management (read-only)" explicitly for escalations.
// Status changes are Founder-only; Management can still see everything on /app/escalations.
export async function updateEscalationStatus(_prev: EscalationFormState, formData: FormData): Promise<EscalationFormState> {
  const actor = await guard({ allowStaffRoles: ["founder"], allowClient: false });
  if (actor.type !== "staff") redirect("/403");

  const escalationId = String(formData.get("escalation_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!ESCALATION_STATUSES.includes(status as EscalationStatus)) {
    return { error: "Invalid status." };
  }

  const admin = createAdminClient();
  const { data: previous } = await admin.from("escalations").select("*").eq("id", escalationId).maybeSingle();
  if (!previous) return { error: "Escalation not found." };

  // §5 state rules: OPEN -> UNDER_REVIEW -> ACTION_IN_PROGRESS -> RESOLVED, or ANY -> DISMISSED.
  const allowed = ESCALATION_TRANSITIONS[previous.status as EscalationStatus] ?? [];
  if (!allowed.includes(status as EscalationStatus)) {
    return { error: `Can't move from "${previous.status}" to "${status}" — only ${allowed.join(", ") || "no further transitions"} allowed.` };
  }

  const { data: updated } = await admin
    .from("escalations")
    .update({ status })
    .eq("id", escalationId)
    .select()
    .single();

  await logAudit({
    userId: actor.id,
    entityType: "escalation",
    entityId: escalationId,
    action: "status_change",
    previousState: previous,
    newState: updated,
  });

  revalidatePath("/app/escalations");
  return { error: null };
}
