import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { EscalationsView } from "./EscalationsView";

// §5 Founder Escalation Center. Visible to Founder/Management, but status changes are
// Founder-only — §3 RBAC: Management is "NO edit permissions" and the escalation widget
// spec says "Management (read-only)" explicitly. (A project-scoped POC entry point for
// creating escalations on their own project — §5's "Manual escalation: POC ✓" — isn't
// built yet; createManualEscalation's guard already supports it via the POC override, this
// page just doesn't expose that surface to non-founder/management staff.)
export default async function EscalationsPage() {
  const actor = await guard({ allowStaffRoles: ["founder", "management"], allowClient: false });
  if (actor.type !== "staff") return null;

  const admin = createAdminClient();
  const { data: escalations } = await admin
    .from("escalations")
    .select("*, projects(type, clients(company_name)), owner:users!escalations_owner_id_fkey(name)")
    .order("created_at", { ascending: false });

  const { data: projects } = await admin.from("projects").select("id, type, clients(company_name)").order("created_at", { ascending: false });

  return (
    <EscalationsView
      escalations={escalations ?? []}
      projects={(projects ?? []).map((p) => ({ id: p.id, label: p.clients?.company_name ?? p.type }))}
      canUpdateStatus={actor.roles.includes("founder")}
      canCreate={actor.roles.includes("founder")}
    />
  );
}
