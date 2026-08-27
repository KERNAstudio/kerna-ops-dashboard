"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { isProjectFullyPaid } from "@/lib/projects/payment-gate";

export type CredentialFormState = { error: string | null; revealed?: { id: string; password: string } };

// No CREDENTIAL_EDIT permission exists (§3 registry) — same PROJECT_EDIT gate as vault
// uploads and module creation.
export async function addCredential(_prev: CredentialFormState, formData: FormData): Promise<CredentialFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId, permission: "PROJECT_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const platformName = String(formData.get("platform_name") ?? "").trim();
  const loginIdentifier = String(formData.get("login_identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!platformName) return { error: "Platform name is required." };

  const admin = createAdminClient();
  const { data: credential, error } = await admin
    .from("access_methods")
    .insert({
      project_id: projectId,
      platform_name: platformName,
      login_identifier: loginIdentifier || null,
      encrypted_password: password ? encryptSecret(password) : null,
      created_by: actor.id,
    })
    .select()
    .single();
  if (error || !credential) return { error: "Could not save credential." };

  await logAudit({
    userId: actor.id,
    entityType: "access_method",
    entityId: credential.id,
    action: "create",
    newState: { ...credential, encrypted_password: credential.encrypted_password ? "[redacted]" : null },
  });

  revalidatePath(`/app/projects/${projectId}/credentials`);
  return { error: null };
}

// §7: "cards (service, username, masked password, show/copy — every interaction
// audit-logged)". Every reveal writes both an ACCESS_SESSIONS row and an audit_logs row —
// this is the tightest-audit table in the schema per §1's note on ACCESS_METHODS.
export async function revealCredential(_prev: CredentialFormState, formData: FormData): Promise<CredentialFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId });

  const credentialId = String(formData.get("credential_id") ?? "");
  const admin = createAdminClient();
  const { data: credential } = await admin.from("access_methods").select("*").eq("id", credentialId).maybeSingle();
  if (!credential || credential.project_id !== projectId) redirect("/403");
  if (!credential.encrypted_password) return { error: "No password stored for this credential." };

  if (actor.type === "client") {
    const { data: project } = await admin.from("projects").select("status").eq("id", projectId).maybeSingle();
    if (!project || !isProjectFullyPaid(project.status)) {
      return { error: "Credentials unlock once the project is fully paid and released." };
    }
  }

  const userId = actor.type === "staff" ? actor.id : null;
  // ACCESS_SESSIONS.user_id is NOT NULL (§1); a client reveal has no USERS row of its own,
  // so it's attributed to whoever created the credential — the audit_logs entry below still
  // records the actual actor (null for client) as the source of truth for who did this.
  const sessionUserId = userId ?? credential.created_by;
  if (sessionUserId) {
    await admin.from("access_sessions").insert({
      access_method_id: credentialId,
      user_id: sessionUserId,
      session_type: actor.type === "client" ? "client_reveal" : "staff_reveal",
    });
  }

  await logAudit({
    userId,
    entityType: "access_method",
    entityId: credentialId,
    action: "reveal",
  });

  revalidatePath(`/app/projects/${projectId}/credentials`);
  return { error: null, revealed: { id: credentialId, password: decryptSecret(credential.encrypted_password) } };
}

// §7 "Client danger zone clearly separated: archive vs delete." Archive is soft (deleted_at,
// recoverable by staff via a DB fix); delete below is permanent (§2 step 12 "client can
// request deletion of credentials only").
export async function archiveCredential(_prev: CredentialFormState, formData: FormData): Promise<CredentialFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId });
  if (actor.type !== "client") redirect("/403");

  const credentialId = String(formData.get("credential_id") ?? "");
  const admin = createAdminClient();
  const { data: previous } = await admin.from("access_methods").select("*").eq("id", credentialId).maybeSingle();
  if (!previous || previous.project_id !== projectId) redirect("/403");

  const { data: updated } = await admin
    .from("access_methods")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", credentialId)
    .select()
    .single();

  await logAudit({
    userId: null,
    entityType: "access_method",
    entityId: credentialId,
    action: "client_archive",
    previousState: { ...previous, encrypted_password: previous.encrypted_password ? "[redacted]" : null },
    newState: updated,
  });

  revalidatePath(`/app/projects/${projectId}/credentials`);
  return { error: null };
}

// Permanent delete — the other half of the danger zone. Row is removed entirely (audit_logs
// has no FK to access_methods, so the deletion stays in the audit trail even after this).
export async function deleteCredential(_prev: CredentialFormState, formData: FormData): Promise<CredentialFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId });
  if (actor.type !== "client") redirect("/403");

  const credentialId = String(formData.get("credential_id") ?? "");
  const admin = createAdminClient();
  const { data: previous } = await admin.from("access_methods").select("*").eq("id", credentialId).maybeSingle();
  if (!previous || previous.project_id !== projectId) redirect("/403");

  await admin.from("access_methods").delete().eq("id", credentialId);

  await logAudit({
    userId: null,
    entityType: "access_method",
    entityId: credentialId,
    action: "client_delete",
    previousState: { ...previous, encrypted_password: previous.encrypted_password ? "[redacted]" : null },
  });

  revalidatePath(`/app/projects/${projectId}/credentials`);
  return { error: null };
}
