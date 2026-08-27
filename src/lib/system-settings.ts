// CLAUDE.md non-negotiable: "Thresholds are config, not constants — advance %, inactivity
// days, escalation thresholds live in system_settings, admin-editable." Single source of
// truth for the keys/defaults/labels so the admin panel (settings/system) and the readers
// (escalations/detect.ts, action-required.ts) can't drift out of sync.
export const SYSTEM_SETTINGS = [
  {
    key: "default_advance_percent",
    label: "Default advance payment split",
    unit: "% advance",
    default: 60,
    max: 100,
    hint: "§2 step 4: Quotation Builder pre-fills this as the advance %; final % is always 100 minus it. POC can override per quotation.",
  },
  {
    key: "payment_overdue_days",
    label: "Payment overdue after",
    unit: "days",
    default: 10,
    hint: "§5 Payment Overdue escalation (High severity) fires once a pending payment passes this age.",
  },
  {
    key: "poc_inactive_days",
    label: "POC inactivity escalation",
    unit: "days",
    default: 1,
    hint: "§5 POC Inactivity escalation (High severity) fires once the POC hasn't logged in for this long.",
  },
  {
    key: "client_rejection_threshold",
    label: "Client rejection loop threshold",
    unit: "rejections",
    default: 3,
    hint: "§5 Client Rejection Loop escalation (Medium severity) fires at this many 'changes requested' approvals on a project.",
  },
  {
    key: "approval_pending_days",
    label: "Approval pending alert",
    unit: "days",
    default: 2,
    hint: "Action-required nudge (top bar 🔴) — doesn't create an escalation record, just surfaces to staff.",
  },
  {
    key: "client_inactive_days",
    label: "Client inactivity alert",
    unit: "days",
    default: 2,
    hint: "Action-required nudge (top bar 🔴) — doesn't create an escalation record, just surfaces to staff.",
  },
] as const;

export type SystemSettingKey = (typeof SYSTEM_SETTINGS)[number]["key"];

export function defaultFor(key: SystemSettingKey): number {
  return SYSTEM_SETTINGS.find((s) => s.key === key)!.default;
}
