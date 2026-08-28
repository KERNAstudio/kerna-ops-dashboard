import { guard } from "@/lib/auth/guard";
import { getProject } from "@/lib/projects/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROJECT_STATUS_LABEL, type ProjectStatus } from "@/lib/projects/constants";
import { TimelineForm, HealthForm, SendFinalApprovalButton } from "./TimelineForm";
import { ClientProjectOverview } from "./ClientProjectOverview";
import { TerminationPanel } from "./TerminationPanel";
import { RequirementsPanel } from "./RequirementsPanel";
import { ContractPanel } from "./ContractPanel";
import { SEVERITY_BADGE, type EscalationSeverity } from "@/lib/escalations/constants";

function fmtDate(v: string | null) {
  return v ? new Date(v).toLocaleDateString() : "—";
}

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await guard({ projectId: id });
  const project = await getProject(id);

  const admin = createAdminClient();
  const { data: client } = await admin.from("clients").select("*").eq("id", project.client_id).maybeSingle();
  const { data: poc } = client?.poc_user_id
    ? await admin.from("users").select("name").eq("id", client.poc_user_id).maybeSingle()
    : { data: null };
  const { data: payments } = await admin
    .from("payments")
    .select("payment_type, amount, status")
    .eq("project_id", id);
  const paidTotal = (payments ?? []).filter((p) => p.status === "received").reduce((s, p) => s + p.amount, 0);

  const statusLabel = PROJECT_STATUS_LABEL[project.status as ProjectStatus] ?? project.status;

  const { data: pendingTermination } = await admin
    .from("termination_requests")
    .select("id")
    .eq("project_id", id)
    .eq("status", "pending")
    .maybeSingle();

  const { data: requirementSnapshotRow } = await admin
    .from("requirement_snapshots")
    .select("content, locked_at, locked_by:users(name)")
    .eq("project_id", id)
    .maybeSingle();
  const requirementSnapshot = requirementSnapshotRow
    ? { content: requirementSnapshotRow.content, locked_at: requirementSnapshotRow.locked_at, locked_by_name: requirementSnapshotRow.locked_by?.name ?? null }
    : null;
  const { data: addendaRows } = await admin
    .from("requirement_addenda")
    .select("id, description, created_at, created_by:users(name)")
    .eq("project_id", id)
    .order("created_at", { ascending: false });
  const addenda = (addendaRows ?? []).map((a) => ({
    id: a.id,
    description: a.description,
    created_at: a.created_at,
    created_by_name: a.created_by?.name ?? null,
  }));
  const canEditRequirement = actor.type === "staff" && (actor.roles.includes("founder") || client?.poc_user_id === actor.id);

  const { data: activeContractVersionRow } = await admin
    .from("contract_versions")
    .select("id, version_number, document_url, issued_at, signed_at, signed_by:users(name), contracts!inner(project_id)")
    .eq("contracts.project_id", id)
    .eq("is_active", true)
    .maybeSingle();
  const activeContractVersion = activeContractVersionRow
    ? {
        id: activeContractVersionRow.id,
        version_number: activeContractVersionRow.version_number,
        document_url: activeContractVersionRow.document_url,
        issued_at: activeContractVersionRow.issued_at,
        signed_at: activeContractVersionRow.signed_at,
        signed_by_name: activeContractVersionRow.signed_by?.name ?? null,
      }
    : null;

  // §5: "Project-level widget shows active count + highest severity badge; visible to
  // POC/Founder/Management (read-only), never to client [and not Dev/Design/Research]."
  const canSeeEscalations =
    actor.type === "staff" &&
    (actor.roles.includes("founder") || actor.roles.includes("management") || client?.poc_user_id === actor.id);
  const activeEscalations = canSeeEscalations
    ? (
        await admin
          .from("escalations")
          .select("severity")
          .eq("project_id", id)
          .in("status", ["open", "under_review", "action_in_progress"])
      ).data ?? []
    : [];
  const severityRank: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const highestSeverity = activeEscalations.reduce<EscalationSeverity | null>((top, e) => {
    const s = e.severity as EscalationSeverity;
    return !top || severityRank[s] > severityRank[top] ? s : top;
  }, null);

  if (actor.type === "client") {
    const { data: modules } = await admin.from("project_modules").select("module_type, status").eq("project_id", id);

    let activity: { action: string; created_at: string }[] = [];
    let team: { name: string; role: string }[] = [];
    if (client?.client_view_mode === "power") {
      const { data: projectActivity } = await admin
        .from("audit_logs")
        .select("action, created_at")
        .eq("entity_type", "project")
        .eq("entity_id", id)
        .order("created_at", { ascending: false })
        .limit(15);
      activity = projectActivity ?? [];

      const moduleIds = (
        await admin.from("project_modules").select("id").eq("project_id", id)
      ).data?.map((m) => m.id) ?? [];
      const { data: assignments } =
        moduleIds.length > 0
          ? await admin
              .from("module_assignments")
              .select("users(name, user_roles(roles(name)))")
              .in("module_id", moduleIds)
          : { data: [] };
      const seen = new Set<string>();
      team = (assignments ?? [])
        .flatMap((a) =>
          a.users
            ? [
                {
                  name: a.users.name,
                  role: a.users.user_roles?.[0]?.roles?.name ?? "team",
                },
              ]
            : []
        )
        .filter((t) => (seen.has(t.name) ? false : (seen.add(t.name), true)));
      if (poc?.name && !seen.has(poc.name)) team.unshift({ name: poc.name, role: "poc" });
    }

    return (
      <ClientProjectOverview
        projectId={id}
        status={project.status}
        statusLabel={statusLabel}
        viewMode={client?.client_view_mode ?? "balanced"}
        healthStatusClient={project.health_status_client}
        clientDeadline={fmtDate(project.client_deadline)}
        paidTotal={paidTotal.toFixed(2)}
        modules={modules ?? []}
        payments={payments ?? []}
        activity={activity}
        team={team}
        hasPendingTermination={!!pendingTermination}
        requirementSnapshot={requirementSnapshot}
        addenda={addenda}
        activeContractVersion={activeContractVersion}
      />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard label="POC" value={poc?.name ?? "—"} />
        <SummaryCard label="Status" value={statusLabel} />
        <SummaryCard label="Health (internal)" value={project.health_score_internal?.toString() ?? "—"} />
        <SummaryCard label="Health (client-facing)" value={project.health_status_client ?? "—"} />
        <SummaryCard label="Internal deadline" value={fmtDate(project.internal_deadline)} />
        <SummaryCard label="Client deadline" value={fmtDate(project.client_deadline)} />
        <SummaryCard label="Paid so far" value={paidTotal.toFixed(2)} />
        <SummaryCard label="Client" value={client?.company_name ?? "—"} />
      </div>
      {activeEscalations.length > 0 && highestSeverity && (
        <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-3">
          <span className="text-xs text-text-secondary">{activeEscalations.length} active escalation(s)</span>
          <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-medium font-data ${SEVERITY_BADGE[highestSeverity]}`}>
            {highestSeverity}
          </span>
        </div>
      )}

      <TimelineForm projectId={id} internalDeadline={project.internal_deadline} clientDeadline={project.client_deadline} />
      <RequirementsPanel projectId={id} snapshot={requirementSnapshot} addenda={addenda} canEdit={canEditRequirement} />
      <ContractPanel
        projectId={id}
        activeVersion={activeContractVersion}
        canManage={canEditRequirement}
        canCountersign={actor.roles.includes("founder")}
      />
      <HealthForm projectId={id} healthScoreInternal={project.health_score_internal} healthStatusClient={project.health_status_client} />
      {project.status === "in_development" && <SendFinalApprovalButton projectId={id} />}
      {pendingTermination && (actor.roles.includes("founder") || client?.poc_user_id === actor.id) && (
        <TerminationPanel projectId={id} requestId={pendingTermination.id} />
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
      <div className="text-xs text-text-secondary">{label}</div>
      <div className="mt-1.5 text-lg font-bold font-data">{value}</div>
    </div>
  );
}
