import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

export async function getProject(projectId: string): Promise<Tables<"projects">> {
  const admin = createAdminClient();
  const { data: project } = await admin.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (!project) redirect("/app/projects");
  return project;
}

// §3 "Client role never sees internal fields" — internal_deadline and health_score_internal
// are stripped here, server-side, before the object ever reaches a client-facing component.
// Not a UI hide: the fields are gone from the object.
export type ClientSafeProject = Omit<Tables<"projects">, "internal_deadline" | "health_score_internal">;

export function toClientSafeProject(project: Tables<"projects">): ClientSafeProject {
  const { internal_deadline: _internal_deadline, health_score_internal: _health_score_internal, ...safe } = project;
  return safe;
}
