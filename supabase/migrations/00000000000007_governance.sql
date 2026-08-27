-- Domain: Governance & Comms (kerna-master-reference.md §1)
-- escalations.status/severity and notifications.severity use the closed vocabularies given
-- in §5. client_messages.sender_id, feedback.submitted_by, and termination_requests.requested_by
-- are left as plain uuid (no FK) because the spec doesn't arrow them to a single table — a
-- client message can come from a USERS row or a CLIENT_USERS row.

create table public.escalations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  entity_type text,
  entity_id uuid,
  escalation_type text not null,
  severity text not null check (severity in ('low', 'medium', 'high')),
  status text not null default 'open'
    check (status in ('open', 'under_review', 'action_in_progress', 'resolved', 'dismissed')),
  owner_id uuid references public.users(id),
  triggered_by text not null,
  reason text,
  resolution_notes text,
  created_at timestamptz not null default now()
);

create table public.termination_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  requested_by uuid,
  status text not null default 'pending',
  settlement_amount numeric(12,2),
  settlement_status text,
  settlement_paid_at timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.client_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sender_id uuid,
  message text not null,
  created_at timestamptz not null default now()
);

create table public.internal_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  message text not null,
  created_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  submitted_by uuid,
  raw_text text not null,
  structured_tags jsonb,
  sentiment text,
  ai_output jsonb,
  ai_processed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Append-only (§3 Immutable audit, CLAUDE.md): no update/delete grants, enforced below.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  previous_state jsonb,
  new_state jsonb,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  entity_id uuid,
  severity text check (severity in ('low', 'medium', 'high')),
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.api_action_logs (
  id uuid primary key default gen_random_uuid(),
  access_method_id uuid not null references public.access_methods(id) on delete cascade,
  user_id uuid references public.users(id),
  action_type text not null,
  payload_summary jsonb,
  response_status text,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index idx_escalations_project_id on public.escalations(project_id);
create index idx_escalations_owner_id on public.escalations(owner_id);
create index idx_escalations_status on public.escalations(status);
create index idx_termination_requests_project_id on public.termination_requests(project_id);
create index idx_client_messages_project_id on public.client_messages(project_id);
create index idx_internal_messages_project_id on public.internal_messages(project_id);
create index idx_internal_messages_sender_id on public.internal_messages(sender_id);
create index idx_feedback_project_id on public.feedback(project_id);
create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_api_action_logs_access_method_id on public.api_action_logs(access_method_id);
create index idx_api_action_logs_user_id on public.api_action_logs(user_id);

alter table public.escalations enable row level security;
alter table public.termination_requests enable row level security;
alter table public.client_messages enable row level security;
alter table public.internal_messages enable row level security;
alter table public.feedback enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.api_action_logs enable row level security;

-- Append-only: revoke UPDATE/DELETE from the API roles so no policy can ever open a hole.
revoke update, delete on public.audit_logs from authenticated, anon;
