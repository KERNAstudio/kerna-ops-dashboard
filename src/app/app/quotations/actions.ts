"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { hashClientPassword } from "@/lib/auth/client-password";
import { getQuotationDetail, assertStaffOwnsQuotation } from "@/lib/quotations/access";

export type QuotationFormState = { error: string | null };
export type SendResult = { error: string | null; credentials?: { email: string; password: string } };

type LineItemInput = { title: string; description: string; unitPrice: number; quantity: number };

function parseLineItems(formData: FormData): LineItemInput[] {
  const titles = formData.getAll("item_title") as string[];
  const descriptions = formData.getAll("item_description") as string[];
  const prices = formData.getAll("item_unit_price") as string[];
  const quantities = formData.getAll("item_quantity") as string[];

  return titles
    .map((title, i) => ({
      title: title.trim(),
      description: (descriptions[i] ?? "").trim(),
      unitPrice: Number(prices[i] ?? 0),
      quantity: Number(quantities[i] ?? 1),
    }))
    .filter((item) => item.title && item.unitPrice >= 0 && item.quantity > 0);
}

export async function createQuotation(_prev: QuotationFormState, formData: FormData): Promise<QuotationFormState> {
  const actor = await guard({ permission: "QUOTATION_CREATE" });
  if (actor.type !== "staff") redirect("/403");

  const leadId = String(formData.get("lead_id") ?? "");
  const templateType = String(formData.get("template_type") ?? "").trim() || null;
  const discount = Number(formData.get("discount") ?? 0);
  const items = parseLineItems(formData);

  if (!leadId) return { error: "Choose a lead." };
  if (items.length === 0) return { error: "Add at least one line item." };

  const admin = createAdminClient();

  const { data: quotation, error: qErr } = await admin
    .from("quotations")
    .insert({ lead_id: leadId, poc_id: actor.id, status: "draft", template_type: templateType })
    .select()
    .single();
  if (qErr || !quotation) return { error: "Could not create quotation." };

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const { data: version, error: vErr } = await admin
    .from("quotation_versions")
    .insert({ quotation_id: quotation.id, version_number: 1, subtotal, discount, total, is_final: false })
    .select()
    .single();
  if (vErr || !version) return { error: "Could not create quotation version." };

  const { error: liErr } = await admin.from("quotation_line_items").insert(
    items.map((i) => ({
      quotation_version_id: version.id,
      title: i.title,
      description: i.description || null,
      unit_price: i.unitPrice,
      quantity: i.quantity,
      total: i.unitPrice * i.quantity,
    }))
  );
  if (liErr) return { error: "Could not save line items." };

  await logAudit({
    userId: actor.id,
    entityType: "quotation",
    entityId: quotation.id,
    action: "create",
    newState: { quotation, version },
  });

  revalidatePath("/app/quotations");
  redirect(`/app/quotations/${quotation.id}`);
}

// §2 step 2: sending a quotation is also the moment a CLIENTS row + client login are
// generated for the lead ("Sales Rep... creates + sends quotation; generates client login").
export async function sendQuotation(_prev: SendResult, formData: FormData): Promise<SendResult> {
  const actor = await guard({ permission: "QUOTATION_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const quotationId = String(formData.get("quotation_id") ?? "");
  const { quotation, lead, latestVersion } = await getQuotationDetail(quotationId);
  assertStaffOwnsQuotation(actor, quotation);
  if (!latestVersion) return { error: "This quotation has no version to send." };

  const admin = createAdminClient();
  let clientId = lead.client_id;
  let credentials: SendResult["credentials"];

  if (!clientId) {
    if (!lead.email) return { error: "Lead has no email — can't create a client login." };

    const { data: client, error: cErr } = await admin
      .from("clients")
      .insert({
        company_name: lead.company_name,
        primary_contact_name: lead.contact_name,
        primary_email: lead.email,
        primary_phone: lead.phone,
        poc_user_id: quotation.poc_id,
      })
      .select()
      .single();
    if (cErr || !client) return { error: "Could not create client record." };
    clientId = client.id;

    await admin.from("leads").update({ client_id: clientId }).eq("id", lead.id);

    const tempPassword = randomBytes(9).toString("base64url");
    const passwordHash = await hashClientPassword(tempPassword);
    const { error: cuErr } = await admin
      .from("client_users")
      .insert({ client_id: clientId, email: lead.email, password_hash: passwordHash });
    if (cuErr) return { error: "Could not create client login." };

    credentials = { email: lead.email, password: tempPassword };

    await logAudit({
      userId: actor.id,
      entityType: "client",
      entityId: clientId,
      action: "create_from_lead",
      newState: client,
    });
  }

  await admin.from("quotation_versions").update({ is_final: true }).eq("id", latestVersion.id);
  const { data: updated } = await admin
    .from("quotations")
    .update({ status: "sent" })
    .eq("id", quotationId)
    .select()
    .single();

  await logAudit({
    userId: actor.id,
    entityType: "quotation",
    entityId: quotationId,
    action: "send",
    previousState: quotation,
    newState: updated,
  });

  revalidatePath("/app/quotations");
  revalidatePath(`/app/quotations/${quotationId}`);
  return { error: null, credentials };
}

// Revision (§4: "/app/quotations/:id/revise — revision is state not a new entity") — a new
// QUOTATION_VERSIONS row with actually-edited line items (submitted from the dedicated
// /revise route's editable builder), reopening the quotation for re-sending.
export async function reviseQuotation(_prev: QuotationFormState, formData: FormData): Promise<QuotationFormState> {
  const actor = await guard({ permission: "QUOTATION_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const quotationId = String(formData.get("quotation_id") ?? "");
  const { quotation, latestVersion } = await getQuotationDetail(quotationId);
  assertStaffOwnsQuotation(actor, quotation);
  if (!latestVersion) return { error: "Nothing to revise yet." };

  const discount = Number(formData.get("discount") ?? 0);
  const items = parseLineItems(formData);
  if (items.length === 0) return { error: "Add at least one line item." };

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const admin = createAdminClient();
  const { data: newVersion, error: vErr } = await admin
    .from("quotation_versions")
    .insert({
      quotation_id: quotationId,
      version_number: latestVersion.version_number + 1,
      subtotal,
      discount,
      total,
      is_final: false,
    })
    .select()
    .single();
  if (vErr || !newVersion) return { error: "Could not create a new version." };

  const { error: liErr } = await admin.from("quotation_line_items").insert(
    items.map((i) => ({
      quotation_version_id: newVersion.id,
      title: i.title,
      description: i.description || null,
      unit_price: i.unitPrice,
      quantity: i.quantity,
      total: i.unitPrice * i.quantity,
    }))
  );
  if (liErr) return { error: "Could not save line items." };

  const { data: updated } = await admin
    .from("quotations")
    .update({ status: "draft" })
    .eq("id", quotationId)
    .select()
    .single();

  await logAudit({
    userId: actor.id,
    entityType: "quotation",
    entityId: quotationId,
    action: "revise",
    previousState: quotation,
    newState: { quotation: updated, version: newVersion },
  });

  revalidatePath("/app/quotations");
  revalidatePath(`/app/quotations/${quotationId}`);
  redirect(`/app/quotations/${quotationId}`);
}

export async function archiveQuotation(_prev: QuotationFormState, formData: FormData): Promise<QuotationFormState> {
  const actor = await guard({ permission: "QUOTATION_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const quotationId = String(formData.get("quotation_id") ?? "");
  const { quotation } = await getQuotationDetail(quotationId);
  assertStaffOwnsQuotation(actor, quotation);

  const admin = createAdminClient();
  const { data: updated } = await admin
    .from("quotations")
    .update({ status: "archived" })
    .eq("id", quotationId)
    .select()
    .single();

  await logAudit({
    userId: actor.id,
    entityType: "quotation",
    entityId: quotationId,
    action: "archive",
    previousState: quotation,
    newState: updated,
  });

  revalidatePath("/app/quotations");
  revalidatePath(`/app/quotations/${quotationId}`);
  return { error: null };
}
