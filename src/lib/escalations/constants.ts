// §5: "Lifecycle (enum): OPEN → UNDER_REVIEW → ACTION_IN_PROGRESS → RESOLVED, any state →
// DISMISSED." Mirrors the escalations.status/severity CHECK constraints (migration 00000000000007).
export const ESCALATION_STATUSES = ["open", "under_review", "action_in_progress", "resolved", "dismissed"] as const;
export type EscalationStatus = (typeof ESCALATION_STATUSES)[number];

export const ESCALATION_SEVERITIES = ["low", "medium", "high"] as const;
export type EscalationSeverity = (typeof ESCALATION_SEVERITIES)[number];

export const SEVERITY_BADGE: Record<EscalationSeverity, string> = {
  low: "bg-bg-elevated text-text-secondary border border-border-default",
  medium: "bg-pastel-yellow-bg text-pastel-yellow-fg",
  high: "bg-pastel-red-bg text-pastel-red-fg",
};

export const STATUS_BADGE: Record<EscalationStatus, string> = {
  open: "bg-pastel-red-bg text-pastel-red-fg",
  under_review: "bg-pastel-yellow-bg text-pastel-yellow-fg",
  action_in_progress: "bg-pastel-blue-bg text-pastel-blue-fg",
  resolved: "bg-pastel-green-bg text-pastel-green-fg",
  dismissed: "bg-bg-elevated text-text-secondary border border-border-default",
};

// §5 state rules, enforced (not just documented): OPEN -> UNDER_REVIEW -> ACTION_IN_PROGRESS
// -> RESOLVED is the only forward path; ANY status can go to DISMISSED; nothing leaves
// DISMISSED or RESOLVED. Was previously accepted as any-status-to-any-status in the action.
export const ESCALATION_TRANSITIONS: Record<EscalationStatus, EscalationStatus[]> = {
  open: ["under_review", "dismissed"],
  under_review: ["action_in_progress", "dismissed"],
  action_in_progress: ["resolved", "dismissed"],
  resolved: [],
  dismissed: [],
};
