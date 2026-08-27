// Quotation status set — §7 Quotation Builder actions (save draft, send, revise, archive)
// map onto these states. §2 only names "sent" and "approved" explicitly.
export const QUOTATION_STATUSES = ["draft", "sent", "approved", "archived"] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const QUOTATION_STATUS_BADGE: Record<QuotationStatus, string> = {
  draft: "bg-bg-elevated text-text-secondary border border-border-default",
  sent: "bg-accent-soft text-accent-primary",
  approved: "bg-success/10 text-success",
  archived: "bg-error/10 text-error",
};
