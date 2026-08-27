import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProject } from "@/lib/projects/access";
import { checkProjectFullyPaid } from "@/lib/projects/payment-gate";
import { maskSecret, decryptSecret } from "@/lib/crypto";
import { CredentialsView } from "./CredentialsView";

export default async function ProjectCredentialsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await guard({ projectId: id, permission: "CREDENTIAL_VIEW" });
  const project = await getProject(id);

  const admin = createAdminClient();
  const { data: credentials } = await admin
    .from("access_methods")
    .select("id, platform_name, login_identifier, encrypted_password, created_at")
    .eq("project_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const masked = (credentials ?? []).map((c) => ({
    id: c.id,
    platform_name: c.platform_name,
    login_identifier: c.login_identifier,
    created_at: c.created_at,
    maskedPassword: c.encrypted_password ? maskSecret(decryptSecret(c.encrypted_password)) : null,
  }));

  const canManage =
    actor.type === "staff" &&
    (actor.roles.includes("founder") || actor.permissions.has("PROJECT_EDIT") || (await isPocOf(id, actor.id)));

  return (
    <CredentialsView
      projectId={id}
      credentials={masked}
      canManage={!!canManage}
      isClient={actor.type === "client"}
      fullyPaid={await checkProjectFullyPaid(admin, id, project.status)}
    />
  );
}

async function isPocOf(projectId: string, userId: string) {
  const admin = createAdminClient();
  const { data: project } = await admin.from("projects").select("client_id").eq("id", projectId).maybeSingle();
  const { data: client } = project
    ? await admin.from("clients").select("poc_user_id").eq("id", project.client_id).maybeSingle()
    : { data: null };
  return client?.poc_user_id === userId;
}
