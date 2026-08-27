import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReviewView } from "./ReviewView";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string; versionId: string }>;
}) {
  const { id, moduleId, versionId } = await params;
  const actor = await guard({ projectId: id });

  const admin = createAdminClient();
  const { data: module } = await admin.from("project_modules").select("module_type").eq("id", moduleId).maybeSingle();
  const { data: version } = await admin.from("module_versions").select("*").eq("id", versionId).maybeSingle();
  if (!version) redirect(`/app/projects/${id}/modules/${moduleId}`);

  const { data: approval } = await admin
    .from("approvals")
    .select("*")
    .eq("module_version_id", versionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: history } = await admin
    .from("module_versions")
    .select("id, version_number, created_at")
    .eq("module_id", moduleId)
    .order("version_number", { ascending: false });

  return (
    <ReviewView
      projectId={id}
      moduleId={moduleId}
      moduleName={module?.module_type ?? "Module"}
      version={version}
      approval={approval ?? null}
      history={history ?? []}
      isClient={actor.type === "client"}
    />
  );
}
