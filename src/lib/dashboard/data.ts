import { createAdminClient } from "@/lib/supabase/admin";

export type RiskItem = {
  id: string;
  severity: string;
  title: string;
  subtitle: string;
};

export type ActivityItem = {
  id: string;
  text: string;
  createdAt: string;
};

export type FounderDashboardData = {
  activeProjects: number;
  pipelineValue: number;
  paymentsOverdue: number;
  paymentsOverdueCount: number;
  openEscalations: number;
  highSeverityCount: number;
  risks: RiskItem[];
  activity: ActivityItem[];
};

// §7 Founder Command Center (Overview/Risk/Revenue/Activity tabs, one route per §4). Every
// number here is computed from existing tables — no new schema for a rollup/summary table.
export async function getFounderDashboardData(): Promise<FounderDashboardData> {
  const admin = createAdminClient();

  const { count: activeProjects } = await admin
    .from("projects")
    .select("id", { count: "exact", head: true })
    .neq("status", "completed");

  const { data: pipelineQuotations } = await admin.from("quotations").select("id").in("status", ["draft", "sent"]);
  const pipelineIds = (pipelineQuotations ?? []).map((q) => q.id);
  let pipelineValue = 0;
  if (pipelineIds.length > 0) {
    const { data: versions } = await admin
      .from("quotation_versions")
      .select("quotation_id, version_number, total")
      .in("quotation_id", pipelineIds)
      .order("version_number", { ascending: false });
    const seen = new Set<string>();
    for (const v of versions ?? []) {
      if (seen.has(v.quotation_id)) continue;
      seen.add(v.quotation_id);
      pipelineValue += v.total;
    }
  }

  const overdueCutoff = new Date(Date.now() - 10 * 86400000).toISOString(); // matches the payment_overdue_days default
  const { data: overduePayments } = await admin
    .from("payments")
    .select("amount")
    .eq("status", "pending")
    .lt("created_at", overdueCutoff);
  const paymentsOverdue = (overduePayments ?? []).reduce((sum, p) => sum + p.amount, 0);

  const { data: openEscalations } = await admin
    .from("escalations")
    .select("id, severity, escalation_type, reason, created_at, projects(clients(company_name))")
    .in("status", ["open", "under_review", "action_in_progress"])
    .order("severity", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(8);

  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sortedRisks = [...(openEscalations ?? [])].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const { data: recentAudit } = await admin
    .from("audit_logs")
    .select("id, entity_type, action, created_at, users(name)")
    .order("created_at", { ascending: false })
    .limit(15);

  return {
    activeProjects: activeProjects ?? 0,
    pipelineValue,
    paymentsOverdue,
    paymentsOverdueCount: overduePayments?.length ?? 0,
    openEscalations: openEscalations?.length ?? 0,
    highSeverityCount: (openEscalations ?? []).filter((e) => e.severity === "high").length,
    risks: sortedRisks.map((e) => ({
      id: e.id,
      severity: e.severity,
      title: `${e.projects?.clients?.company_name ?? "Unknown"} — ${e.escalation_type.replace(/_/g, " ")}`,
      subtitle: e.reason ?? "",
    })),
    activity: (recentAudit ?? []).map((a) => ({
      id: a.id,
      text: `${a.users?.name ?? "System"} · ${a.action.replace(/_/g, " ")} on ${a.entity_type.replace(/_/g, " ")}`,
      createdAt: a.created_at,
    })),
  };
}
