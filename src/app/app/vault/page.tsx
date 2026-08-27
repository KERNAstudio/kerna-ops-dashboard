import { redirect } from "next/navigation";
import Link from "next/link";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

// §4: "/app/vault, /app/credentials — global entry points (founder/POC), alongside
// project-scoped versions." Aggregates resources across every project the actor can reach.
export default async function GlobalVaultPage() {
  const actor = await guard({ allowClient: false });
  if (actor.type !== "staff") return null;

  const admin = createAdminClient();
  const isFounder = actor.roles.includes("founder");

  let projectIds: string[] | null = null;
  if (!isFounder) {
    const { data: pocClients } = await admin.from("clients").select("id").eq("poc_user_id", actor.id);
    if (!pocClients || pocClients.length === 0) redirect("/403");
    const { data: pocProjects } = await admin
      .from("projects")
      .select("id")
      .in("client_id", pocClients.map((c) => c.id));
    projectIds = (pocProjects ?? []).map((p) => p.id);
  }

  let query = admin
    .from("resources")
    .select("id, file_url, downloadable, created_at, project_id, projects(clients(company_name))")
    .order("created_at", { ascending: false });
  if (projectIds !== null) {
    query = query.in("project_id", projectIds.length ? projectIds : ["00000000-0000-0000-0000-000000000000"]);
  }

  const { data: resources } = await query;

  return (
    <div className="max-w-[1180px]">
      <h1 className="text-[26px] font-bold tracking-tight">Vault</h1>
      <p className="text-[13px] text-text-secondary">Files across every project you can reach.</p>

      <div className="mt-5 overflow-hidden rounded-[var(--radius-default)] border border-border-default bg-bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["Project", "File", "Downloadable", "Date", ""].map((h) => (
                  <th
                    key={h}
                    className="border-b border-border-default px-4 py-2.5 text-left font-data text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(resources ?? []).map((r) => (
                <tr key={r.id} className="border-b border-border-default last:border-0 hover:bg-bg-elevated">
                  <td className="px-4 py-3 font-semibold">{r.projects?.clients?.company_name ?? "—"}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.file_url.split("/").pop()}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.downloadable ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/app/projects/${r.project_id}/vault`} className="text-xs text-text-secondary hover:text-text-primary">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {(resources ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    No files yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
