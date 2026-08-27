import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { EscalationsView } from "./EscalationsView";

// §5 Founder Escalation Center. Visible to Founder/Management (read-only for Management —
// enforced by which actions the UI offers, since there's no ESCALATION_EDIT permission
// code in §3's locked registry to gate on).
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
      canUpdateStatus={actor.roles.includes("founder") || actor.roles.includes("management")}
      canCreate={actor.roles.includes("founder")}
    />
  );
}
