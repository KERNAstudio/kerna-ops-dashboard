import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { defaultFor, type SystemSettingKey } from "@/lib/system-settings";
import type { EscalationSeverity } from "./constants";

async function getThreshold(admin: ReturnType<typeof createAdminClient>, key: SystemSettingKey) {
  const { data } = await admin.from("system_settings").select("value").eq("key", key).maybeSingle();
  const value = Number(data?.value);
  return Number.isFinite(value) ? value : defaultFor(key);
}

// One escalation per (project, type) open at a time — re-running the check is idempotent.
async function createEscalationIfNotExists(params: {
  projectId: string;
  escalationType: string;
  severity: EscalationSeverity;
  ownerId: string | null;
  reason: string;
}) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("escalations")
    .select("id")
    .eq("project_id", params.projectId)
    .eq("escalation_type", params.escalationType)
    .in("status", ["open", "under_review", "action_in_progress"])
    .maybeSingle();
  if (existing) return;

  const { data: escalation } = await admin
    .from("escalations")
    .insert({
      project_id: params.projectId,
      escalation_type: params.escalationType,
      severity: params.severity,
      status: "open",
      owner_id: params.ownerId,
      triggered_by: "system",
      reason: params.reason,
    })
    .select()
    .single();
  if (!escalation) return;

  await logAudit({
    userId: null,
    entityType: "escalation",
    entityId: escalation.id,
    action: "system_create",
    newState: escalation,
  });

  // §5 "Notifications: real-time for HIGH severity... notify Founder + POC" — no email/push
  // channel is wired, so this writes to NOTIFICATIONS (the in-app inbox) rather than
  // actually delivering anything; a real-time/digest split would consume this table later.
  const { data: founders } = await admin
    .from("user_roles")
    .select("user_id, roles!inner(name)")
    .eq("roles.name", "founder");
  const recipientIds = new Set((founders ?? []).map((f) => f.user_id));
  if (params.ownerId) recipientIds.add(params.ownerId);

  if (recipientIds.size > 0) {
    await admin.from("notifications").insert(
      [...recipientIds].map((userId) => ({
        user_id: userId,
        type: "escalation",
        entity_id: escalation.id,
        severity: params.severity,
        message: params.reason,
      }))
    );
  }
}

// §5 rule: "Payment Overdue | due_date + 10d < today, unpaid | High". PAYMENTS has no
// due_date column (§1) — a pending payment's created_at is the proxy for "when it became
// due", since nothing else in the schema represents a due date at the payment level.
export async function detectPaymentOverdue() {
  const admin = createAdminClient();
  const days = await getThreshold(admin, "payment_overdue_days");
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();

  const { data: overdue } = await admin
    .from("payments")
    .select("project_id, created_at")
    .eq("status", "pending")
    .lt("created_at", cutoff);

  for (const payment of overdue ?? []) {
    const { data: project } = await admin.from("projects").select("client_id").eq("id", payment.project_id).maybeSingle();
    const { data: client } = project
      ? await admin.from("clients").select("poc_user_id").eq("id", project.client_id).maybeSingle()
      : { data: null };

    await createEscalationIfNotExists({
      projectId: payment.project_id,
      escalationType: "payment_overdue",
      severity: "high",
      ownerId: client?.poc_user_id ?? null,
      reason: `Payment pending for over ${days} days.`,
    });
  }
}

// Subscriptions have no equivalent §5 rule (the table had zero spec anywhere) — modeled the
// same shape as Payment Overdue above since it's the same underlying risk: money that was
// due and hasn't arrived. grace_period_days is per-subscription, not a system_settings key,
// since it's meant to vary per client arrangement rather than being one global default.
export async function detectSubscriptionOverdue() {
  const admin = createAdminClient();
  const { data: subscriptions } = await admin.from("subscriptions").select("project_id, next_due_date, grace_period_days").eq("status", "active");

  for (const sub of subscriptions ?? []) {
    if (!sub.next_due_date) continue;
    const cutoff = new Date(sub.next_due_date);
    cutoff.setDate(cutoff.getDate() + (sub.grace_period_days ?? 0));
    if (cutoff >= new Date()) continue;

    const { data: project } = await admin.from("projects").select("client_id").eq("id", sub.project_id).maybeSingle();
    const { data: client } = project
      ? await admin.from("clients").select("poc_user_id").eq("id", project.client_id).maybeSingle()
      : { data: null };

    await createEscalationIfNotExists({
      projectId: sub.project_id,
      escalationType: "subscription_overdue",
      severity: "high",
      ownerId: client?.poc_user_id ?? null,
      reason: `Recurring payment overdue since ${sub.next_due_date} (grace period ${sub.grace_period_days ?? 0}d).`,
    });
  }
}

// §5 rule: "POC Inactivity | last_activity > 1 day | High | Founder". last_activity is
// derived from users.last_login_at (set on every staff sign-in — see src/app/login/actions.ts).
// Only checked for projects still actively moving (not completed).
export async function detectPocInactivity() {
  const admin = createAdminClient();
  const days = await getThreshold(admin, "poc_inactive_days");
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();

  const { data: projects } = await admin.from("projects").select("id, client_id").neq("status", "completed");

  for (const project of projects ?? []) {
    const { data: client } = await admin.from("clients").select("poc_user_id").eq("id", project.client_id).maybeSingle();
    if (!client?.poc_user_id) continue;

    const { data: poc } = await admin.from("users").select("last_login_at").eq("id", client.poc_user_id).maybeSingle();
    if (!poc?.last_login_at || poc.last_login_at >= cutoff) continue;

    await createEscalationIfNotExists({
      projectId: project.id,
      escalationType: "poc_inactivity",
      severity: "high",
      ownerId: null, // owner is "Founder" generically, not any one founder — see §5 table
      reason: `POC hasn't been active in over ${days} day(s).`,
    });
  }
}

// §5 rule: "Client Rejection Loop | client_rejection_count >= 3 | Medium". No counter
// column exists — derived by counting 'changes_requested' approvals across the project's
// modules, which is the only record of a client rejecting a deliverable.
export async function detectClientRejectionLoop() {
  const admin = createAdminClient();
  const threshold = await getThreshold(admin, "client_rejection_threshold");

  const { data: projects } = await admin.from("projects").select("id, client_id");

  for (const project of projects ?? []) {
    const { data: modules } = await admin.from("project_modules").select("id").eq("project_id", project.id);
    const moduleIds = (modules ?? []).map((m) => m.id);
    if (moduleIds.length === 0) continue;

    const { data: versions } = await admin.from("module_versions").select("id").in("module_id", moduleIds);
    const versionIds = (versions ?? []).map((v) => v.id);
    if (versionIds.length === 0) continue;

    const { count } = await admin
      .from("approvals")
      .select("id", { count: "exact", head: true })
      .in("module_version_id", versionIds)
      .eq("status", "changes_requested");
    if (!count || count < threshold) continue;

    const { data: client } = await admin.from("clients").select("poc_user_id").eq("id", project.client_id).maybeSingle();

    await createEscalationIfNotExists({
      projectId: project.id,
      escalationType: "client_rejection_loop",
      severity: "medium",
      ownerId: client?.poc_user_id ?? null,
      reason: `Client has requested changes ${count} times.`,
    });
  }
}

// Manual trigger for now (see the Escalation Center's "Run Checks" button) — a real
// deployment would wire this to a cron (Vercel Cron / pg_cron) instead of a button.
export async function runEscalationChecks() {
  await detectPaymentOverdue();
  await detectPocInactivity();
  await detectClientRejectionLoop();
  await detectSubscriptionOverdue();
}
