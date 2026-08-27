"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { LEAD_STATUSES } from "@/lib/leads/constants";
import { assertLeadEditable } from "@/lib/leads/access";

export type LeadFormState = { error: string | null };

export async function createLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const actor = await guard({ permission: "LEADS_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const companyName = String(formData.get("company_name") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  if (!companyName || !contactName) {
    return { error: "Company and contact name are required." };
  }

  const admin = createAdminClient();
  const { data: lead, error } = await admin
    .from("leads")
    .insert({
      company_name: companyName,
      contact_name: contactName,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      status: "New",
      created_by: actor.id,
      assigned_to: actor.id,
    })
    .select()
    .single();

  if (error || !lead) return { error: "Could not create lead. Try again." };

  await logAudit({
    userId: actor.id,
    entityType: "lead",
    entityId: lead.id,
    action: "create",
    newState: lead,
  });

  revalidatePath("/app/leads");
  return { error: null };
}

export async function updateLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  const actor = await guard({ permission: "LEADS_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const leadId = String(formData.get("lead_id") ?? "");
  const previous = await assertLeadEditable(actor, leadId);

  const status = String(formData.get("status") ?? previous.status);
  if (!LEAD_STATUSES.includes(status as (typeof LEAD_STATUSES)[number])) {
    return { error: "Invalid status." };
  }

  const admin = createAdminClient();
  const patch = {
    company_name: String(formData.get("company_name") ?? previous.company_name).trim(),
    contact_name: String(formData.get("contact_name") ?? previous.contact_name).trim(),
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    status,
    assigned_to: String(formData.get("assigned_to") ?? "").trim() || previous.assigned_to,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await admin
    .from("leads")
    .update(patch)
    .eq("id", leadId)
    .select()
    .single();

  if (error || !updated) return { error: "Could not save changes. Try again." };

  await logAudit({
    userId: actor.id,
    entityType: "lead",
    entityId: leadId,
    action: "update",
    previousState: previous,
    newState: updated,
  });

  revalidatePath("/app/leads");
  revalidatePath(`/app/leads/${leadId}`);
  return { error: null };
}
