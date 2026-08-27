// Mirrors the projects.status CHECK constraint (supabase/migrations/00000000000002_clients_projects.sql)
// — the locked lifecycle chain from §2.
export const PROJECT_STATUSES = [
  "lead_generated",
  "quotation_sent",
  "quotation_approved",
  "advance_paid",
  "team_assigned",
  "scope_approved",
  "in_development",
  "deliverable_sent",
  "final_approved",
  "final_payment_pending",
  "completed",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  lead_generated: "Lead Generated",
  quotation_sent: "Quotation Sent",
  quotation_approved: "Quotation Approved",
  advance_paid: "Advance Paid",
  team_assigned: "Team Assigned",
  scope_approved: "Scope Approved",
  in_development: "In Development",
  deliverable_sent: "Deliverable Sent",
  final_approved: "Final Approved",
  final_payment_pending: "Final Payment Pending",
  completed: "Completed",
};
