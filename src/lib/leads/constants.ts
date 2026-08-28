// Lead status set. The original UI spec (§7 + kerna-dashboard-mockup.html) only ever
// specified a 6-value board (New/Contacted/Interested/Negotiation/Closed Won/Closed Lost) —
// no source doc defines a deeper funnel. Expanded to this 12-stage set on explicit request,
// not a spec restoration: On Hold and Archived give a lead somewhere to go besides the two
// closed states without cluttering the board, and the funnel now tracks discovery/quotation
// sub-stages a Sales rep actually moves through rather than jumping straight from Contacted
// to Negotiation.
export const LEAD_STATUSES = [
  "New",
  "Contact Attempted",
  "Connected",
  "Discovery Scheduled",
  "Discovery Completed",
  "Quotation Drafted",
  "Quotation Sent",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
  "On Hold",
  "Archived",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_BADGE: Record<LeadStatus, string> = {
  New: "bg-bg-elevated text-text-secondary border border-border-default",
  "Contact Attempted": "bg-bg-elevated text-text-secondary border border-border-default",
  Connected: "bg-pastel-blue-bg text-pastel-blue-fg",
  "Discovery Scheduled": "bg-pastel-blue-bg text-pastel-blue-fg",
  "Discovery Completed": "bg-pastel-blue-bg text-pastel-blue-fg",
  "Quotation Drafted": "bg-pastel-yellow-bg text-pastel-yellow-fg",
  "Quotation Sent": "bg-pastel-yellow-bg text-pastel-yellow-fg",
  Negotiation: "bg-pastel-yellow-bg text-pastel-yellow-fg",
  "Closed Won": "bg-pastel-green-bg text-pastel-green-fg",
  "Closed Lost": "bg-pastel-red-bg text-pastel-red-fg",
  "On Hold": "bg-bg-elevated text-text-secondary border border-border-default",
  Archived: "bg-bg-elevated text-text-secondary border border-border-default",
};
