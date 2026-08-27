import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { ModulesView } from "./ModulesView";

export default async function ProjectModulesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await guard({ projectId: id, permission: "MODULE_VIEW" });
  if (actor.type !== "staff") return null;

  const admin = createAdminClient();
  const { data: modules } = await admin
    .from("project_modules")
    .select("*, module_assignments(id, user_id, users(name))")
    .eq("project_id", id)
    .order("created_at");
  const { data: staff } = await admin.from("users").select("id, name").eq("active", true).order("name");

  let canEdit = actor.roles.includes("founder") || actor.permissions.has("PROJECT_EDIT");
  if (!canEdit) {
    const { data: project } = await admin.from("projects").select("client_id").eq("id", id).maybeSingle();
    const { data: client } = project
      ? await admin.from("clients").select("poc_user_id").eq("id", project.client_id).maybeSingle()
      : { data: null };
    canEdit = client?.poc_user_id === actor.id;
  }

  return <ModulesView projectId={id} modules={modules ?? []} staff={staff ?? []} canEdit={canEdit} />;
}
