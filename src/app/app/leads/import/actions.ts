"use server";

import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export type ImportFormState = { error: string | null; imported?: number; skipped?: number };

const HEADER_ALIASES = new Set(["company_name", "company", "contact_name", "contact", "phone", "email"]);

function parseCsvLine(line: string): string[] {
  // No quoted-field/embedded-comma support — plain comma-split covers the simple
  // company,contact,phone,email export this expects. A real CSV parser is overkill for
  // a manually-exported lead list.
  return line.split(",").map((cell) => cell.trim());
}

// §4 route: /app/leads/import. Same ownership model as manual lead creation (§3: Sales
// "own" the leads they create) — every imported row gets created_by/assigned_to = the
// importer.
export async function importLeadsCsv(_prev: ImportFormState, formData: FormData): Promise<ImportFormState> {
  const actor = await guard({ permission: "LEADS_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file." };

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { error: "The file is empty." };

  const firstRow = parseCsvLine(lines[0]).map((c) => c.toLowerCase());
  const hasHeader = firstRow.some((c) => HEADER_ALIASES.has(c));
  const rows = hasHeader ? lines.slice(1) : lines;

  const admin = createAdminClient();
  let imported = 0;
  let skipped = 0;

  for (const line of rows) {
    const [companyName, contactName, phone, email] = parseCsvLine(line);
    if (!companyName || !contactName) {
      skipped++;
      continue;
    }

    const { data: lead, error } = await admin
      .from("leads")
      .insert({
        company_name: companyName,
        contact_name: contactName,
        phone: phone || null,
        email: email || null,
        status: "New",
        created_by: actor.id,
        assigned_to: actor.id,
      })
      .select()
      .single();

    if (error || !lead) {
      skipped++;
      continue;
    }
    imported++;

    await logAudit({ userId: actor.id, entityType: "lead", entityId: lead.id, action: "import", newState: lead });
  }

  return { error: null, imported, skipped };
}
