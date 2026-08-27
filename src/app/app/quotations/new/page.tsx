import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { QuotationBuilder } from "./QuotationBuilder";

export default async function NewQuotationPage() {
  const actor = await guard({ permission: "QUOTATION_CREATE", allowClient: false });
  if (actor.type !== "staff") return null;

  const admin = createAdminClient();
  let query = admin
    .from("leads")
    .select("id, company_name, contact_name")
    .order("company_name");

  if (!actor.roles.includes("founder")) {
    query = query.or(`created_by.eq.${actor.id},assigned_to.eq.${actor.id}`);
  }

  const { data: leads } = await query;

  return <QuotationBuilder leads={leads ?? []} />;
}
