// §5: "Lifecycle (enum): OPEN → UNDER_REVIEW → ACTION_IN_PROGRESS → RESOLVED, any state →
// DISMISSED." Mirrors the escalations.status/severity CHECK constraints (migration 00000000000007).
export const ESCALATION_STATUSES = ["open", "under_review", "action_in_progress", "resolved", "dismissed"] as const;
export type EscalationStatus = (typeof ESCALATION_STATUSES)[number];

export const ESCALATION_SEVERITIES = ["low", "medium", "high"] as const;
export type EscalationSeverity = (typeof ESCALATION_SEVERITIES)[number];

export const SEVERITY_BADGE: Record<EscalationSeverity, string> = {
  low: "bg-bg-elevated text-text-secondary border border-border-default",
  medium: "bg-warning/10 text-warning",
  high: "bg-error/10 text-error",
};

export const STATUS_BADGE: Record<EscalationStatus, string> = {
  open: "bg-error/10 text-error",
  under_review: "bg-warning/10 text-warning",
  action_in_progress: "bg-accent-soft text-accent-primary",
  resolved: "bg-success/10 text-success",
  dismissed: "bg-bg-elevated text-text-secondary border border-border-default",
};
