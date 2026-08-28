"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { uploadProjectFile } from "@/lib/storage";

export type ContractFormState = { error: string | null };

// CONTRACTS/CONTRACT_VERSIONS (kerna-master-reference.md §1) existed with zero application
// code. No source spec doc describes a client e-signature flow for it, and contract_versions
// .signed_by references USERS (staff), not CLIENT_USERS — so this isn't a client-facing
// signing ceremony. The client's binding acceptance is already the quotation-approval
// checkbox (KERNA_TC_1.pdf §25: "by proceeding with any quotation... the Client
// acknowledges... accepted these Terms"). This module is Kerna's own document ledger: POC
// uploads the formal agreement PDF, Founder countersigns it for the record.
export async function uploadContract(_prev: ContractFormState, formData: FormData): Promise<ContractFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  if (!projectId) return { error: "Missing project." };

  const actor = await guard({ projectId, permission: "PROJECT_EDIT", allowClient: false });
  if (actor.type !== "staff") redirect("/403");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file." };

  const admin = createAdminClient();
  let { data: contract } = await admin.from("contracts").select("id").eq("project_id", projectId).maybeSingle();
  if (!contract) {
    const { data: newContract, error } = await admin.from("contracts").insert({ project_id: projectId, status: "issued" }).select().single();
    if (error || !newContract) return { error: "Could not create contract record." };
    contract = newContract;
  } else {
    await admin.from("contracts").update({ status: "issued" }).eq("id", contract.id);
  }

  const { data: lastVersion } = await admin
    .from("contract_versions")
    .select("version_number")
    .eq("contract_id", contract.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const versionNumber = (lastVersion?.version_number ?? 0) + 1;

  const storagePath = `${projectId}/contracts/${Date.now()}-${file.name}`;
  try {
    await uploadProjectFile(storagePath, file);
  } catch {
    return { error: "Upload failed." };
  }

  // Only one active version at a time — a re-upload (e.g. after a quotation revision)
  // supersedes the prior one rather than leaving two "active" agreements on file.
  await admin.from("contract_versions").update({ is_active: false }).eq("contract_id", contract.id);

  const { data: version, error: vErr } = await admin
    .from("contract_versions")
    .insert({
      contract_id: contract.id,
      version_number: versionNumber,
      document_url: storagePath,
      is_active: true,
      issued_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (vErr || !version) return { error: "Could not save the contract version." };

  await logAudit({ userId: actor.id, entityType: "contract_version", entityId: version.id, action: "upload", newState: version });

  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}

// Founder-only countersignature — matches §3's "POC reassignment is Founder-only" pattern
// of reserving formal/legal actions for the Founder rather than the POC.
export async function countersignContract(_prev: ContractFormState, formData: FormData): Promise<ContractFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ allowStaffRoles: ["founder"], allowClient: false });
  if (actor.type !== "staff") redirect("/403");

  const versionId = String(formData.get("version_id") ?? "");
  const admin = createAdminClient();
  const { data: previous } = await admin
    .from("contract_versions")
    .select("*, contracts!inner(project_id)")
    .eq("id", versionId)
    .maybeSingle();
  if (!previous || previous.contracts?.project_id !== projectId) redirect("/403");
  if (previous.signed_at) return { error: "This version is already signed." };

  const { data: updated } = await admin
    .from("contract_versions")
    .update({ signed_by: actor.id, signed_at: new Date().toISOString(), signature_type: "countersignature" })
    .eq("id", versionId)
    .select()
    .single();

  const { data: contract } = await admin.from("contracts").select("id").eq("project_id", projectId).maybeSingle();
  if (contract) await admin.from("contracts").update({ status: "signed" }).eq("id", contract.id);

  await logAudit({
    userId: actor.id,
    entityType: "contract_version",
    entityId: versionId,
    action: "countersign",
    previousState: previous,
    newState: updated,
  });

  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}
