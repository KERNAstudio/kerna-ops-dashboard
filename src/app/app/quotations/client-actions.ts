"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { getQuotationDetail, assertClientOwnsQuotation } from "@/lib/quotations/access";

export type ApproveFormState = { error: string | null };

// §2 step 3 (Client Login & Approval) + §7 Client Onboarding, combined into one submit:
// client fills their profile and ticks the agreement checkbox, which both confirms
// onboarding and approves the quotation. "Cannot proceed without it" — enforced below,
// not just hidden in the UI, since the checkbox is a real required field server-side.
export async function approveQuotation(_prev: ApproveFormState, formData: FormData): Promise<ApproveFormState> {
  const actor = await guard(); // client actors need no permission code — ownership check below
  if (actor.type !== "client") redirect("/403");

  const quotationId = String(formData.get("quotation_id") ?? "");
  const { quotation, lead } = await getQuotationDetail(quotationId);
  assertClientOwnsQuotation(actor, lead);

  if (quotation.status !== "sent") return { error: "This quotation isn't awaiting approval." };
  if (formData.get("agree") !== "on") {
    return { error: "You must confirm the agreement to proceed." };
  }

  const contactName = String(formData.get("primary_contact_name") ?? "").trim();
  const phone = String(formData.get("primary_phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!contactName) return { error: "Contact name is required." };

  const admin = createAdminClient();
  const { data: previousClient } = await admin.from("clients").select("*").eq("id", actor.clientId).single();

  const { data: updatedClient } = await admin
    .from("clients")
    .update({
      primary_contact_name: contactName,
      primary_phone: phone || null,
      address: address || null,
      onboarding_confirmed_at: new Date().toISOString(),
    })
    .eq("id", actor.clientId)
    .select()
    .single();

  const { data: updatedQuotation } = await admin
    .from("quotations")
    .update({ status: "approved" })
    .eq("id", quotationId)
    .select()
    .single();

  // Lead → quotation → project: approval is the commit point where the engagement
  // becomes a real project (§2's pipeline). Created once, here, if it doesn't exist yet.
  const { data: existingProject } = await admin
    .from("projects")
    .select("id")
    .eq("client_id", actor.clientId)
    .maybeSingle();

  let project = existingProject;
  if (!project) {
    const { data: newProject } = await admin
      .from("projects")
      .insert({
        client_id: actor.clientId,
        type: quotation.template_type ?? "general",
        status: "quotation_approved",
      })
      .select("id")
      .single();
    project = newProject ?? null;
  }

  await logAudit({
    userId: null, // client actors aren't in the USERS table — see src/lib/auth/session.ts
    entityType: "client",
    entityId: actor.clientId,
    action: "onboarding_confirm",
    previousState: previousClient,
    newState: updatedClient,
  });
  await logAudit({
    userId: null,
    entityType: "quotation",
    entityId: quotationId,
    action: "client_approve",
    previousState: quotation,
    newState: updatedQuotation,
  });

  revalidatePath(`/app/quotations/${quotationId}`);
  return { error: null };
}
