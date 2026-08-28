"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export type SubscriptionFormState = { error: string | null };

export const BILLING_CYCLES = ["monthly", "quarterly", "yearly"] as const;

// SUBSCRIPTIONS (kerna-master-reference.md §1) existed with zero application code and no
// UI/behavior spec anywhere in the source docs. Covers two cases the same way: a project
// billed recurring from the start instead of advance/final, or a completed project opting
// into a post-delivery maintenance retainer — either way it's one subscriptions row.
// One per project (unique project_id, migration 00000000000013); create and edit share this
// action since there's nothing sensitive about overwriting the cycle/due-date/grace fields.
export async function saveSubscription(_prev: SubscriptionFormState, formData: FormData): Promise<SubscriptionFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  if (!projectId) return { error: "Missing project." };

  const actor = await guard({ projectId, permission: "PROJECT_EDIT", allowClient: false });
  if (actor.type !== "staff") redirect("/403");

  const billingCycle = String(formData.get("billing_cycle") ?? "");
  const nextDueDate = String(formData.get("next_due_date") ?? "");
  const gracePeriodDays = Number(formData.get("grace_period_days") ?? 7);
  if (!BILLING_CYCLES.includes(billingCycle as (typeof BILLING_CYCLES)[number])) return { error: "Choose a billing cycle." };
  if (!nextDueDate) return { error: "Next due date is required." };
  if (!Number.isFinite(gracePeriodDays) || gracePeriodDays < 0) return { error: "Grace period must be a non-negative number." };

  const admin = createAdminClient();
  const { data: previous } = await admin.from("subscriptions").select("*").eq("project_id", projectId).maybeSingle();

  const { data: updated, error } = await admin
    .from("subscriptions")
    .upsert(
      { project_id: projectId, billing_cycle: billingCycle, next_due_date: nextDueDate, grace_period_days: gracePeriodDays, status: previous?.status ?? "active" },
      { onConflict: "project_id" }
    )
    .select()
    .single();
  if (error || !updated) return { error: "Could not save the subscription." };

  await logAudit({
    userId: actor.id,
    entityType: "subscription",
    entityId: updated.id,
    action: previous ? "update" : "create",
    previousState: previous,
    newState: updated,
  });

  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}

export async function setSubscriptionStatus(_prev: SubscriptionFormState, formData: FormData): Promise<SubscriptionFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId, permission: "PROJECT_EDIT", allowClient: false });
  if (actor.type !== "staff") redirect("/403");

  const status = String(formData.get("status") ?? "");
  if (!["active", "paused", "cancelled"].includes(status)) return { error: "Invalid status." };

  const admin = createAdminClient();
  const { data: previous } = await admin.from("subscriptions").select("*").eq("project_id", projectId).maybeSingle();
  if (!previous) return { error: "No subscription on this project." };

  const { data: updated } = await admin.from("subscriptions").update({ status }).eq("project_id", projectId).select().single();

  await logAudit({
    userId: actor.id,
    entityType: "subscription",
    entityId: previous.id,
    action: "status_change",
    previousState: previous,
    newState: updated,
  });

  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}
