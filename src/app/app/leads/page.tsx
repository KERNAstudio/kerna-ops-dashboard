import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { LeadsView } from "./LeadsView";

// §7 Lead Board + §4 route /app/leads. Sales sees only their own leads (§3: "Own
// leads/quotations"); Founder (the only other role with LEADS_VIEW) sees everything.
export default async function LeadsPage() {
  const actor = await guard({ permission: "LEADS_VIEW" });
  if (actor.type !== "staff") return null; // guard() already redirects clients away

  const admin = createAdminClient();
  let query = admin
    .from("leads")
    .select("*, assigned_user:users!leads_assigned_to_fkey(name), creator:users!leads_created_by_fkey(name)")
    .order("created_at", { ascending: false });

  if (!actor.roles.includes("founder")) {
    query = query.or(`created_by.eq.${actor.id},assigned_to.eq.${actor.id}`);
  }

  const { data: leads } = await query;

  const { data: staff } = await admin
    .from("users")
    .select("id, name")
    .eq("active", true)
    .order("name");

  return <LeadsView leads={leads ?? []} staff={staff ?? []} />;
}
