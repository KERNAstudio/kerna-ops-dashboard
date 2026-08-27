// CLAUDE.md non-negotiable: "Vault download is payment-gated. payment_status !== FULLY_PAID
// → downloads disabled, preview still allowed." PROJECTS has no payment_status column —
// project.status === 'completed' is the single source of truth (set the moment a 'final'
// payment is marked received; see the payments actions). Never derive this any other way.
export function isProjectFullyPaid(projectStatus: string): boolean {
  return projectStatus === "completed";
}
