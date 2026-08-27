import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProject } from "@/lib/projects/access";
import { isProjectFullyPaid } from "@/lib/projects/payment-gate";
import { VaultView } from "./VaultView";

export default async function ProjectVaultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await guard({ projectId: id, permission: "VAULT_VIEW" });
  const project = await getProject(id);

  const admin = createAdminClient();
  const { data: resources } = await admin
    .from("resources")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const canManage =
    actor.type === "staff" &&
    (actor.roles.includes("founder") || actor.permissions.has("PROJECT_EDIT") || (await isPocOf(id, actor.id)));

  return (
    <VaultView
      projectId={id}
      resources={resources ?? []}
      canManage={!!canManage}
      isClient={actor.type === "client"}
      fullyPaid={isProjectFullyPaid(project.status)}
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
