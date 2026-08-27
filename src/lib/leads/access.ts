import { redirect } from "next/navigation";
import type { StaffActor } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

// §3: Sales sees/edits "own leads" — created or assigned to them. Founder has no restriction.
export async function assertLeadEditable(
  actor: StaffActor,
  leadId: string
): Promise<Tables<"leads">> {
  const admin = createAdminClient();
  const { data: lead } = await admin.from("leads").select("*").eq("id", leadId).maybeSingle();
  if (!lead) redirect("/app/leads");

  if (!actor.roles.includes("founder") && lead.created_by !== actor.id && lead.assigned_to !== actor.id) {
    redirect("/403");
  }
  return lead;
}
