import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentsView } from "./PaymentsView";

export default async function ProjectPaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await guard({ projectId: id, permission: "PAYMENT_VIEW" });
  if (actor.type !== "staff") return null;

  const admin = createAdminClient();
  const { data: payments } = await admin
    .from("payments")
    .select("*, invoices(invoice_number)")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  // PAYMENT_EDIT alone misses the POC override (guard() applies it internally, but that
  // logic isn't exposed here) — re-derive it: POC has edit rights on their own project
  // regardless of base role, per §3.
  let isPoc = false;
  if (!actor.permissions.has("PAYMENT_EDIT")) {
    const { data: project } = await admin.from("projects").select("client_id").eq("id", id).maybeSingle();
    const { data: client } = project
      ? await admin.from("clients").select("poc_user_id").eq("id", project.client_id).maybeSingle()
      : { data: null };
    isPoc = client?.poc_user_id === actor.id;
  }
  const canEdit = actor.roles.includes("founder") || actor.permissions.has("PAYMENT_EDIT") || isPoc;

  return <PaymentsView projectId={id} payments={payments ?? []} canEdit={canEdit} />;
}
