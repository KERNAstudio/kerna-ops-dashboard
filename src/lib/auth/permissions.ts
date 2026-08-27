// Permission registry — kerna-master-reference.md §3. Keep this list in sync with the
// `permissions` rows seeded in supabase/migrations/00000000000008_rbac.sql.
export const PERMISSION_CODES = [
  "LEADS_VIEW",
  "LEADS_EDIT",
  "QUOTATION_CREATE",
  "QUOTATION_EDIT",
  "PROJECT_VIEW",
  "PROJECT_EDIT",
  "MODULE_VIEW",
  "MODULE_EDIT",
  "PAYMENT_VIEW",
  "PAYMENT_EDIT",
  "VAULT_VIEW",
  "VAULT_DOWNLOAD",
  "CREDENTIAL_VIEW",
  "ANALYTICS_VIEW",
  "SYSTEM_EDIT",
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];
