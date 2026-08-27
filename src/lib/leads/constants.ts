// Lead status set — §7 Screen Inventory kanban columns, matching the mockup's LEADS/STATUS_COLOR
// data exactly (kerna-dashboard-mockup.html:738). §2's narrative also mentions "Rejected", but
// the literal UI spec (both §7 and the mockup) uses this 6-value set, so that's what's built.
export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Interested",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_BADGE: Record<LeadStatus, string> = {
  New: "bg-bg-elevated text-text-secondary border border-border-default",
  Contacted: "bg-accent-soft text-accent-primary",
  Interested: "bg-accent-soft text-accent-primary",
  Negotiation: "bg-warning/10 text-warning",
  "Closed Won": "bg-success/10 text-success",
  "Closed Lost": "bg-error/10 text-error",
};
