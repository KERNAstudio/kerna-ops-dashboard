# KERNA Ops Dashboard

Internal client-delivery platform for KERNA (agency). Pipeline: lead → quotation → project →
modules (client-approved version by version) → payment-gated delivery.

**Read `docs/kerna-master-reference.md` before touching schema, routes, permissions, or any
screen — it's the merged source of truth from all the spec docs in `docs/source/`.** Don't
re-derive these decisions from scratch; they're already locked.

## Non-negotiable rules (from spec, don't relitigate)

- **RBAC is never route-hardcoded.** Every request goes: auth → role → project-scope →
  module-scope → action-level permission. See reference §3.
- **Audit log is append-only.** Every mutation on a tracked entity writes to `audit_logs`
  (userId, role, entity, action, prev/new state). No deletes, no edits to existing rows.
- **Vault download is payment-gated.** `payment_status !== FULLY_PAID` → downloads disabled,
  preview still allowed. Don't let this regress.
- **Client role never sees internal fields.** `internal_deadline`, `health_score_internal`,
  credential raw values, anything dev/design/payment-internal — filtered server-side, not just
  hidden in the UI.
- **Client view mode (Simple/Balanced/Power) changes components, never routes.**
- **Design tokens are locked** — reference §6. Use them as CSS variables / theme tokens, don't
  invent new colors or spacing.
- **Thresholds are config, not constants** — advance %, inactivity days, escalation thresholds
  live in `system_settings`, admin-editable.

## Stack (confirmed)

Next.js (App Router) + TypeScript + Supabase (Postgres, Auth, Storage, RLS) + Tailwind. Supabase
project: `kerna-ops-dashboard` (ref `epkeblvwebgnstxdxdkr`, org `KERNA`, region `ap-south-1`).
RLS maps naturally onto the project/module-scoped access model in the RBAC doc.

## Working style

- This is a from-scratch build — there's no existing code to preserve, so match the spec, not any
  prior assumption about "how it was".
- Ship the lifecycle phases (reference §2) in order — payments and vault gating only make sense
  once the phase before them exists. Don't build the escalation engine before leads→quotation→project
  works end to end.
- Two references beyond the docs: `kerna-dashboard-mockup.html` (clickable UI reference — component
  layout and interaction, not literal code) and `docs/erd.jpg` (schema diagram).
