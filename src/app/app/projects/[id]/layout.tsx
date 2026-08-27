import Link from "next/link";
import { guard } from "@/lib/auth/guard";
import { getProject } from "@/lib/projects/access";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await guard({ projectId: id });
  const project = await getProject(id);

  const admin = createAdminClient();
  const { data: client } = await admin.from("clients").select("company_name").eq("id", project.client_id).maybeSingle();

  const tabs: { href: string; label: string }[] = [{ href: "overview", label: "Overview" }];
  if (actor.type === "staff") {
    tabs.push({ href: "modules", label: "Modules" }, { href: "payments", label: "Payments" });
  }
  tabs.push({ href: "vault", label: "Vault" }, { href: "credentials", label: "Credentials" });

  return (
    <div className="max-w-[1180px]">
      <Link href="/app/projects" className="text-xs text-text-secondary hover:text-text-primary">
        ← Back to projects
      </Link>
      <h1 className="mt-2 text-[26px] font-bold tracking-tight">{client?.company_name ?? "Project"}</h1>

      <div className="mt-4 flex gap-1 border-b border-border-default">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={`/app/projects/${id}/${tab.href}`}
            className="rounded-t-lg px-3 py-2 text-[13px] font-medium text-text-secondary hover:text-text-primary"
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mt-5">{children}</div>
    </div>
  );
}
