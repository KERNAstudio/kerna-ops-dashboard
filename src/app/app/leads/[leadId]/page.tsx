import { guard } from "@/lib/auth/guard";
import { assertLeadEditable } from "@/lib/leads/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { LeadDetailForm } from "./LeadDetailForm";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const actor = await guard({ permission: "LEADS_VIEW" });
  if (actor.type !== "staff") return null;

  const lead = await assertLeadEditable(actor, leadId);

  const admin = createAdminClient();
  const { data: staff } = await admin.from("users").select("id, name").eq("active", true).order("name");

  return <LeadDetailForm lead={lead} staff={staff ?? []} />;
}
