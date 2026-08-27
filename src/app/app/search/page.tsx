import Link from "next/link";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

// §7 top bar: "global search". Simple ILIKE across the entities staff actually navigate
// to — leads, projects (by client name), quotations (by lead's company name).
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const actor = await guard({ allowClient: false });
  if (actor.type !== "staff") return null;

  const query = (q ?? "").trim();
  const admin = createAdminClient();

  const [leads, projects, quotations] = query
    ? await Promise.all([
        admin.from("leads").select("id, company_name, contact_name").ilike("company_name", `%${query}%`).limit(10),
        admin
          .from("projects")
          .select("id, type, clients(company_name)")
          .limit(50)
          .then((r) => ({
            data: (r.data ?? []).filter((p) => p.clients?.company_name.toLowerCase().includes(query.toLowerCase())).slice(0, 10),
          })),
        admin
          .from("quotations")
          .select("id, leads(company_name)")
          .limit(50)
          .then((r) => ({
            data: (r.data ?? []).filter((q2) => q2.leads?.company_name.toLowerCase().includes(query.toLowerCase())).slice(0, 10),
          })),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  return (
    <div className="max-w-2xl">
      <h1 className="text-[26px] font-bold tracking-tight">Search</h1>
      <form action="/app/search" className="mt-4">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search leads, projects, quotations…"
          className="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
        />
      </form>

      {query && (
        <div className="mt-5 space-y-5">
          <ResultSection title="Leads">
            {(leads.data ?? []).map((l) => (
              <ResultRow key={l.id} label={`${l.company_name} — ${l.contact_name}`} href={`/app/leads/${l.id}`} />
            ))}
          </ResultSection>
          <ResultSection title="Projects">
            {(projects.data ?? []).map((p) => (
              <ResultRow key={p.id} label={p.clients?.company_name ?? p.type} href={`/app/projects/${p.id}`} />
            ))}
          </ResultSection>
          <ResultSection title="Quotations">
            {(quotations.data ?? []).map((qt) => (
              <ResultRow key={qt.id} label={qt.leads?.company_name ?? "Quotation"} href={`/app/quotations/${qt.id}`} />
            ))}
          </ResultSection>
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  const items = children as React.ReactNode[];
  const hasItems = Array.isArray(items) ? items.length > 0 : !!items;
  if (!hasItems) return null;
  return (
    <div className="rounded-[var(--radius-default)] border border-border-default bg-bg-card">
      <p className="p-4 pb-0 text-sm font-bold">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ResultRow({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="block border-t border-border-default px-4 py-2.5 text-sm first:border-t-0 hover:bg-bg-elevated"
    >
      {label}
    </Link>
  );
}
