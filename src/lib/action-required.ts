import { createAdminClient } from "@/lib/supabase/admin";
import type { StaffActor } from "@/lib/auth/session";
import { defaultFor, type SystemSettingKey } from "@/lib/system-settings";

export type ActionRequiredItem = { label: string; href: string; severity: "high" | "medium" };

async function getThreshold(admin: ReturnType<typeof createAdminClient>, key: SystemSettingKey) {
  const { data } = await admin.from("system_settings").select("value").eq("key", key).maybeSingle();
  const value = Number(data?.value);
  return Number.isFinite(value) ? value : defaultFor(key);
}

// §5: "Alerts (system-only nudges: approval pending, client inactive) never create a
// record" — distinct from Escalations (src/lib/escalations/detect.ts), which persist.
// Computed live on every request, never written anywhere. §7 top bar: "🔴 action-required
// indicator." client_users has no last-activity column (§1), so "client inactive" is
// derived from the most recent client-attributed audit_logs entry on the project, same
// proxy used for the Power-view activity feed.
export async function getActionRequiredItems(actor: StaffActor): Promise<ActionRequiredItem[]> {
  const admin = createAdminClient();
  const isFounder = actor.roles.includes("founder") || actor.roles.includes("management");

  let projectIds: string[] | null = null;
  if (!isFounder) {
    const { data: pocClients } = await admin.from("clients").select("id").eq("poc_user_id", actor.id);
    const clientIds = (pocClients ?? []).map((c) => c.id);
    const { data: pocProjects } = clientIds.length
      ? await admin.from("projects").select("id").in("client_id", clientIds)
      : { data: [] };
    projectIds = (pocProjects ?? []).map((p) => p.id);
    if (projectIds.length === 0) return [];
  }

  const approvalDays = await getThreshold(admin, "approval_pending_days");
  const clientInactiveDays = await getThreshold(admin, "client_inactive_days");
  const pocInactiveDays = await getThreshold(admin, "poc_inactive_days");
  const pocSoftInactiveHours = await getThreshold(admin, "poc_soft_inactive_hours");
  const approvalCutoff = new Date(Date.now() - approvalDays * 86400000).toISOString();
  const clientCutoff = new Date(Date.now() - clientInactiveDays * 86400000).toISOString();
  const pocHardCutoff = new Date(Date.now() - pocInactiveDays * 86400000).toISOString();
  const pocSoftCutoff = new Date(Date.now() - pocSoftInactiveHours * 3600000).toISOString();

  const items: ActionRequiredItem[] = [];

  // Approval pending > N days
  const { data: pendingApprovals } = await admin
    .from("approvals")
    .select("id, module_version_id, created_at, module_versions(module_id, project_modules(project_id, module_type))")
    .eq("status", "pending")
    .lt("created_at", approvalCutoff);
  for (const a of pendingApprovals ?? []) {
    const projectId = a.module_versions?.project_modules?.project_id;
    if (!projectId || (projectIds && !projectIds.includes(projectId))) continue;
    items.push({
      label: `Approval pending on ${a.module_versions?.project_modules?.module_type ?? "a module"}`,
      href: `/app/projects/${projectId}/modules/${a.module_versions?.module_id}`,
      severity: "medium",
    });
  }

  // Payment pending (any)
  const { data: pendingPayments } = await admin
    .from("payments")
    .select("id, project_id, payment_type, projects(clients(company_name))")
    .eq("status", "pending");
  for (const p of pendingPayments ?? []) {
    if (projectIds && !projectIds.includes(p.project_id)) continue;
    items.push({
      label: `${p.payment_type} payment pending — ${p.projects?.clients?.company_name ?? "project"}`,
      href: `/app/projects/${p.project_id}/payments`,
      severity: "medium",
    });
  }

  // Client inactive > N days (proxy: no client-attributed project audit entry since cutoff)
  const scopedProjectIds =
    projectIds ?? (await admin.from("projects").select("id")).data?.map((p) => p.id) ?? [];
  for (const projectId of scopedProjectIds) {
    const { data: recentClientActivity } = await admin
      .from("audit_logs")
      .select("id")
      .eq("entity_type", "project")
      .eq("entity_id", projectId)
      .is("user_id", null)
      .gte("created_at", clientCutoff)
      .limit(1)
      .maybeSingle();
    if (recentClientActivity) continue;

    const { data: project } = await admin.from("projects").select("status, clients(company_name)").eq("id", projectId).maybeSingle();
    if (!project || project.status === "completed") continue;
    items.push({
      label: `Client inactive — ${project.clients?.company_name ?? "project"}`,
      href: `/app/projects/${projectId}/overview`,
      severity: "high",
    });
  }

  // §8 open item: "soft POC-inactivity alert at 12h, before the 1-day HIGH escalation."
  // A nudge here, not an escalations row — only shown in the window between the soft and
  // hard thresholds, since past the hard threshold detectPocInactivity (escalations/detect.ts)
  // has already raised the real HIGH escalation and this would just be noise on top of it.
  for (const projectId of scopedProjectIds) {
    const { data: project } = await admin
      .from("projects")
      .select("status, clients(company_name, poc_user_id)")
      .eq("id", projectId)
      .maybeSingle();
    if (!project || project.status === "completed" || !project.clients?.poc_user_id) continue;

    const { data: poc } = await admin
      .from("users")
      .select("last_login_at")
      .eq("id", project.clients.poc_user_id)
      .maybeSingle();
    if (!poc?.last_login_at) continue;
    if (poc.last_login_at >= pocSoftCutoff || poc.last_login_at < pocHardCutoff) continue;

    items.push({
      label: `POC inactive ${pocSoftInactiveHours}h+ — ${project.clients.company_name}`,
      href: `/app/projects/${projectId}/overview`,
      severity: "medium",
    });
  }

  return items;
}
