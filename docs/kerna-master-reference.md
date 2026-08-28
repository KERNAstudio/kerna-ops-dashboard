# KERNA Ops Dashboard — Master Reference

Consolidated from: Master Workflow, RBAC Model, Route Architecture, Escalation Engine,
Cosmetic & UI Reference, UI Component Spec, T&C, and the current ERD (`docs/erd.jpg`).
This is the source of truth — read it before building any screen, table, or route.

KERNA runs client work through one pipeline: lead → quotation → project → modules
(client-approved version by version) → payment-gated delivery.

## 1. Data Model

32 entities, six domains. FK columns noted with `→`.

### Identity & Access
- **USERS**: id, name, email, password_hash, active, last_login_at, created_at, updated_at
- **ROLES**: id, name, description
- **PERMISSIONS**: id, code, description
- **USER_ROLES**: id, user_id→USERS, role_id→ROLES
- **ROLE_PERMISSIONS**: id, role_id→ROLES, permission_id→PERMISSIONS
- **CLIENT_USERS**: id, client_id→CLIENTS, email, password_hash, active, created_at

### Clients & Projects (the spine)
- **CLIENTS**: id, company_name, primary_contact_name, primary_email, primary_phone, poc_user_id→USERS, client_view_mode, created_at
- **PROJECTS**: id, client_id→CLIENTS, type, status, internal_deadline, client_deadline, health_score_internal, health_status_client, maintenance_days, maintenance_expires_at, change_request_window_expires_at, created_at
- **SYSTEM_SETTINGS**: id, key, value, updated_by, updated_at

> `PROJECTS` splits every sensitive field in two: `health_status_client` vs `health_score_internal`,
> `client_deadline` vs `internal_deadline`. This dual-visibility pattern is load-bearing —
> see RBAC §3, Dual Deadline Visibility.

### Sales Pipeline
- **LEADS**: id, company_name, contact_name, phone, email, status, created_by→USERS, assigned_to→USERS, created_at, updated_at
- **QUOTATIONS**: id, lead_id→LEADS, poc_id→USERS, status, template_type, created_at
- **QUOTATION_VERSIONS**: id, quotation_id→QUOTATIONS, version_number, subtotal, discount, total, is_final, created_at
- **QUOTATION_LINE_ITEMS**: id, quotation_version_id→QUOTATION_VERSIONS, title, description, unit_price, quantity, total
- **CONTRACTS**: id, project_id→PROJECTS, status, created_at
- **CONTRACT_VERSIONS**: id, contract_id→CONTRACTS, version_number, document_url, signature_type, signature_data, signed_by, issued_at, signed_at, is_active

### Delivery
- **PROJECT_MODULES**: id, project_id→PROJECTS, module_type, status, internal_deadline, created_at
- **MODULE_ASSIGNMENTS**: id, module_id→PROJECT_MODULES, user_id→USERS
- **MODULE_VERSIONS**: id, module_id→PROJECT_MODULES, version_number, file_url, notes, uploaded_by→USERS, created_at
- **APPROVALS**: id, module_version_id→MODULE_VERSIONS, status, created_at, approved_at, lock_expires_at, withdrawn_at, withdrawn_by

### Finance
- **PAYMENTS**: id, project_id→PROJECTS, amount, payment_type, status, paid_at, created_at
- **INVOICES**: id, project_id→PROJECTS, invoice_number, financial_year, sequence_number, subtotal, gst_amount, total, status, issued_at
- **CREDIT_NOTES**: id, invoice_id→INVOICES, credit_note_number, financial_year, sequence_number, amount, reason, issued_at
- **SUBSCRIPTIONS**: id, project_id→PROJECTS, billing_cycle, next_due_date, grace_period_days, created_at

### Vault & Credentials
- **RESOURCES**: id, project_id→PROJECTS, file_url, downloadable, created_at
- **ACCESS_METHODS**: id, project_id→PROJECTS, platform_name, access_mode, risk_level, external_account_identifier, delegated_email, role_assigned, login_identifier, encrypted_password, oauth_access_token, oauth_refresh_token, token_expires_at, retention_expires_at, deleted_at, created_by, created_at
- **ACCESS_SESSIONS**: id, access_method_id→ACCESS_METHODS, user_id→USERS, session_type, reason, ip_address, device_info, started_at, ended_at

> `ACCESS_METHODS` holds raw encrypted credentials **and** OAuth tokens with expiry — this
> table needs the tightest encryption-at-rest and audit coverage in the whole schema.

### Governance & Comms
- **ESCALATIONS**: id, project_id→PROJECTS, entity_type, entity_id, escalation_type, severity, status, owner_id, triggered_by, reason, resolution_notes, created_at
- **TERMINATION_REQUESTS**: id, project_id→PROJECTS, requested_by, status, settlement_amount, settlement_status, settlement_paid_at, created_at, resolved_at
- **CLIENT_MESSAGES**: id, project_id→PROJECTS, sender_id, message, created_at
- **INTERNAL_MESSAGES**: id, project_id→PROJECTS, sender_id→USERS, message, created_at
- **FEEDBACK**: id, project_id→PROJECTS, submitted_by, raw_text, structured_tags, sentiment, ai_output, ai_processed, created_at
- **AUDIT_LOGS**: id, user_id→USERS, entity_type, entity_id, action, previous_state, new_state, created_at
- **NOTIFICATIONS**: id, user_id→USERS, type, entity_id, severity, message, read, created_at
- **API_ACTION_LOGS**: id, access_method_id→ACCESS_METHODS, user_id→USERS, action_type, payload_summary, response_status, ip_address, created_at

## 2. Lifecycle Workflow

```
Lead Generated → Quotation Sent → Quotation Approved → Advance Paid → Team Assigned
→ Scope Approved → In Development → Deliverable Sent → Final Approved
→ Final Payment Pending → Completed
```

1. **Lead Distribution** — Sales Lead Manager assigns leads; status: New/Contacted/Interested/Rejected.
2. **Quotation Creation** — Sales Rep becomes POC; creates + sends quotation; generates client login. → `Quotation Sent`
3. **Client Login & Approval** — client fills profile, approves via checkbox. Cannot proceed without it. → `Quotation Approved`
4. **Payment 1 (Advance)** — POC sets advance % (default 60) / final % (default 40). Manual entry (txn id, amount, date). Work blocked until marked Received. → `Advance Paid`
5. **Project Assignment** — POC manually assigns dev team. *(Future: auto-assign by load/capacity/skill — Resource Management module, phase 2.)*
6. **Kickoff Meeting** — Client+Dev+POC define scope/timeline; POC uploads scope, timeline, milestones; client approves again. → `Scope Approved`
7. **Development Phase** — everyone can VIEW, only assigned department can EDIT. Notifications fire on approval requests/rejections/pending payments.
8. **Deliverables Ready** — Dev marks ready; client can preview, not download. Approve → `Final Approval Given`. Reject → notify + POC schedules meeting.
9. **Final Payment** — deliverables stay locked until `Final Payment Status = Paid`.
10. **Release** — client can download deliverables + access credentials.
11. **Hosting & Credentials** — if in scope: viewable, downloadable, deletable on request.
12. **Data Control** — client can request deletion of deliverables only / credentials only / full project. Otherwise retained per T&C.

**Requirement change handling**: initial requirement is a locked snapshot; minor changes append
an addendum entry; major changes (scope revision, new quotation flow) trigger a new cycle. Avoids
messy version trees.

## 3. RBAC & Permissions

Enforcement order: role-based → project-scoped → module-scoped → action-level → immutable audit.
Never hardcode permissions into routes.

| Role | View | Edit | Notes |
|---|---|---|---|
| Founder | Everything | Everything* | *Cannot override client approval state or edit audit logs |
| Management | Analytics, projects, payments | None | No credential visibility, no system edit |
| Sales | Own leads/quotations, POC'd projects | Leads, quotations (pre-approval) | Payment view limited to own POC projects |
| Dev/Design/Research | Assigned projects (overview only), assigned modules | Assigned modules only | No payment, credential, or analytics access |
| POC | Full assigned project | Everything on that project | Others on project: view only |
| Client | Own project, modules, vault | Approval actions only | Vault download gated on full payment; no internal data |

**Permission registry**: `LEADS_VIEW`, `LEADS_EDIT`, `QUOTATION_CREATE`, `QUOTATION_EDIT`,
`PROJECT_VIEW`, `PROJECT_EDIT`, `MODULE_VIEW`, `MODULE_EDIT`, `PAYMENT_VIEW`, `PAYMENT_EDIT`,
`VAULT_VIEW`, `VAULT_DOWNLOAD`, `CREDENTIAL_VIEW`, `ANALYTICS_VIEW`, `SYSTEM_EDIT`.

**Route guard order**: (1) auth check → redirect `/login` · (2) role check → 403 · (3) project
scope check → 403 · (4) module scope check → 403 · (5) action-level permission check on
POST/PUT/PATCH → 403.

**Special rules**:
- **Client approval lock** — once a version is `APPROVED`, edits blocked. Only POC can reopen, with a reason. Founder cannot silently override.
- **Immutable audit** — every mutation logs userId, role, entity, action, timestamp, previous/new state hash. Append-only, no deletes.
- **Payment-gated downloads** — vault download blocked while `payment_status !== FULLY_PAID`. Preview always allowed.
- **POC reassignment** — Founder-only.
- **Dual deadline visibility** — internal deadlines visible to Founder/Dev/Design/POC only; Client role always sees `client_deadline`.
- Client view mode (Simple/Balanced/Power) is **component-based, never route-based**.

## 4. Route Map

Role filtering happens in the sidebar, not routing. UUIDs only, max 4 levels deep, every entity deep-linkable.

```
/login
/app/dashboard                                    Founder Command Center (tabs: Overview/Risk/Revenue/Activity, one route)
/app/leads, /leads/import, /leads/:leadId
/app/quotations, /new, /:id, /:id/revise          builder kept separate from detail; revision is state not a new entity
/app/projects, /:projectId                        list + Project Dashboard (core spine)
/app/projects/:id/overview|modules|timeline|payments|vault|credentials|settings   default landing → /overview
/app/projects/:id/modules/:moduleId               module workspace
/app/projects/:id/review/:moduleId/:versionId     client approval — deep-linkable, auditable, email-safe
/app/vault, /app/credentials                       global entry points (founder/POC), alongside project-scoped versions
/app/analytics/revenue|conversion|performance      founder only, hidden from sidebar, still route-guarded
/app/escalations                                   Founder Escalation Center
/app/settings/profile|team|system                  minimal v1; team/system deferred
```

Client login routing: 1 project → redirect to `/app/projects/:id`. Multiple projects →
`/app/projects` list.

## 5. Escalation Engine

Alerts (system-only nudges: approval pending, client inactive) never create a record.
Escalations are only created on threshold breach, manual trigger, or dispute flow.

| Rule | Trigger | Severity | Owner / Notify |
|---|---|---|---|
| Client Rejection Loop | `client_rejection_count >= 3` | Medium | POC · notify Founder + POC |
| Payment Overdue | `due_date + 10d < today`, unpaid | High | POC · notify Founder + POC (real-time) |
| POC Inactivity | `last_activity > 1 day` | High | Founder · real-time |

Thresholds live in `system_settings`, admin-editable, never hardcoded:
`client_rejection_threshold`, `payment_overdue_days`, `poc_inactive_days`.

**Lifecycle (enum)**: `OPEN → UNDER_REVIEW → ACTION_IN_PROGRESS → RESOLVED`, any state → `DISMISSED`.
All transitions audit logged.

**Manual escalation**: Founder ✓, POC ✓, System ✓ (automated), Dev/Design ✕, Client ✕ (indirect only).

**Notifications**: real-time for HIGH severity, POC inactive, payment overdue. Daily digest for
LOW/MEDIUM and aging escalations, sent to founders + management.

**Founder Escalation Center** (`/app/escalations`) columns: ID, Project, Client, Type,
Severity (color-coded), Trigger Source, Owner, Age timer, Status, quick actions.
Project-level widget shows active count + highest severity badge; visible to POC/Founder/Management
(read-only), never to client.

## 6. Design System (locked)

**Revised — Premium Utilitarian Minimalism.** Superseded the original dark-teal SaaS system on
explicit direction. Warm light mode is primary now; the old dark-teal palette is preserved as an
opt-in `.dark` variant rather than deleted.

```css
--bg-main:#F7F6F3;      --bg-card:#FFFFFF;      --bg-elevated:#F9F9F8;
--border-default:#EAEAEA;
--accent-primary:#4F7D74; --accent-hover:#3E6A61; --accent-soft:#EAF0EE;
--success:#346538; --warning:#956400; --error:#9F2F2D;
--text-primary:#2F3437; --text-secondary:#787774;
--radius-default:10px;
--space-xs:4px; --space-sm:8px; --space-md:12px; --space-lg:16px; --space-xl:24px; --space-2xl:32px;

/* status pastels — pill badges only, never large surfaces */
--pastel-green-bg:#EDF3EC; --pastel-green-fg:#346538;
--pastel-yellow-bg:#FBF3DB; --pastel-yellow-fg:#956400;
--pastel-blue-bg:#E1F3FE;  --pastel-blue-fg:#1F6C9F;
--pastel-red-bg:#FDEBEC;   --pastel-red-fg:#9F2F2D;

/* dark (opt-in, .dark class — the original locked palette) */
--bg-main-dark:#0F0F0F;      --bg-card-dark:#171717;      --bg-elevated-dark:#1E1E1E;
--border-default-dark:#2A2A2A;
--accent-primary-dark:#1FAC98; --accent-hover-dark:#17907F;
--text-primary-dark:#EDEDED; --text-secondary-dark:#A3A3A3;
```

- Font: **Work Sans** (primary sans), **Newsreader** (editorial serif, page titles only, italic), **JetBrains Mono** (data/tabular/timestamps — replaces Inter in that role).
- Type scale: Page title 28–30px, serif italic · Section heading 20/600 sans · Card title 16/600 · Body 14/400 · Button 12.5/600 · Caption 11/500 mono for meta/timestamps.
- Primary button: solid `--text-primary`-on-inverse (near-black bg, white text), 6px radius, no shadow — never the accent color as a button fill.
- Cards: `#FFFFFF` bg, 1px `#EAEAEA` border, 10px radius, no heavy shadows (`box-shadow` opacity < 0.05 if any at all).
- Status badges: pill-shaped (`border-radius: 999px`), pastel bg/fg pairs above — not the old `accent/10` or `severity/10` opacity-tint pattern.
- Charts: primary series the new muted teal-green, secondary muted gray `#787774`, max 4 colors, no rainbow palettes. **Accent is for selection/active state only — never for severity** (severity uses the pastel set).
- Gradients allowed only on: login screen, empty states, hero strip, founder marketing surfaces. Never on: data tables, approval screens, vault, dense workflows.
- Client view modes — **Simple**: health, stage, next action, pending approvals, short updates, vault when unlocked. **Balanced** (default): + module progress, milestone timeline, collapsed version history, payment progress, key team roles. **Power**: everything — full activity feed, full module/version/team detail, payment log.
- Guardrails: status always above the fold · approval buttons always prominent · locked downloads clearly greyed with tooltip · never rely on color alone for meaning · tables scroll on overflow · every empty state guides the next action.

## 7. Screen Inventory (from UI Component Spec)

Persistent shell: left sidebar (logo, role badge, role-filtered nav, collapse toggle) + top bar
(global search, notifications, 🔴 action-required indicator, avatar menu).

- **Lead Board** — table/kanban toggle, import, filters, search. Table cols: company, contact,
  phone, email, status, last contacted. Kanban cols: New/Contacted/Interested/Negotiation/Closed Won/Closed Lost.
- **Quotation Builder** — split view: form (template, client selector, line items, discount,
  notes, advance %/final % auto-calc) left; live PDF preview + revision + status right. Actions:
  save draft, send, revise, archive.
- **Client Onboarding** — profile fields (name/company/phone/address) + agreement confirmation
  checkbox, blocks project access until confirmed.
- **Project Dashboard** (POC/Founder) — summary strip (client/POC/payment/health×2/deadline×2) +
  overview cards (modules/payment progress, pending approvals, next milestone, client activity) +
  two-column: modules panel (left) / activity timeline (right, event types: version uploaded,
  approval granted, changes requested, payment logged, requirement updated, deadline changed, POC reassigned).
- **Module Workspace** — header (name, assignees, internal deadline, status) + version table
  (number, uploaded by, date, approval status, preview, actions) + upload panel. V1 preview
  support: image ✓, PDF ✓, web preview ✓ — zip ✕, video ✕.
- **Client Approval Screen** — deliverable preview top, big center Approve/Request Changes panel,
  expandable feedback textarea on Request Changes, version history dropdown at bottom.
- **Payment Management** — entry form (type, amount, date, method, txn ref, notes, proof upload) +
  payment table (amount, type, date, status, entered by). Partial payments supported; final unlock
  requires total paid ≥ required; POC controls entry.
- **Resource Vault** — file table (name, type, date, download). Download disabled + tooltip
  "Available after final payment" until fully paid.
- **Credential Vault** — cards (service, username, masked password, show/copy — every interaction
  audit-logged). Client danger zone clearly separated: archive vs delete (credentials/deliverables/full project).
- **Action Required panel** (persistent) — triggers: approval pending > N days (default 2),
  client inactive > N days (default 2), POC inactive > N days (default 1), payment pending. Each
  item deep-links.

## 8. Open Items

The specs explicitly deferred these — resolve during build, don't guess silently:

- Sidebar visual style — pure dark vs. elevated surface vs. subtle glass (prototype, pick after preview)
- Final corner-radius value (12px is an interim token-backed default)
- Auto resource allocation (dev load/capacity/skill match) — phase 2, not v1
- Soft POC-inactivity alert at 12h, before the 1-day HIGH escalation
- Admin-editable system settings panel for: default advance %, inactivity thresholds, health thresholds, payment unlock rule
