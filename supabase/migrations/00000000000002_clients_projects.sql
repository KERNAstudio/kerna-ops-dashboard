-- Domain: Clients & Projects — the spine (kerna-master-reference.md §1)
-- project.status enum is the locked lifecycle chain from §2. health_score_internal /
-- health_status_client and client_deadline / internal_deadline stay separate columns:
-- this dual-visibility split is load-bearing for RBAC (§3, Dual Deadline Visibility).

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  primary_contact_name text not null,
  primary_email text not null,
  primary_phone text,
  poc_user_id uuid references public.users(id),
  client_view_mode text not null default 'balanced'
    check (client_view_mode in ('simple', 'balanced', 'power')),
  created_at timestamptz not null default now()
);

alter table public.client_users
  add constraint client_users_client_id_fkey
  foreign key (client_id) references public.clients(id) on delete cascade;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  type text not null,
  status text not null default 'lead_generated' check (status in (
    'lead_generated', 'quotation_sent', 'quotation_approved', 'advance_paid',
    'team_assigned', 'scope_approved', 'in_development', 'deliverable_sent',
    'final_approved', 'final_payment_pending', 'completed'
  )),
  internal_deadline timestamptz,
  client_deadline timestamptz,
  health_score_internal integer,
  health_status_client text,
  maintenance_days integer,
  maintenance_expires_at timestamptz,
  change_request_window_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);

create index idx_clients_poc_user_id on public.clients(poc_user_id);
create index idx_projects_client_id on public.projects(client_id);
create index idx_projects_status on public.projects(status);
create index idx_system_settings_updated_by on public.system_settings(updated_by);

alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.system_settings enable row level security;

-- Seed the escalation/inactivity thresholds called out in §5 and §8 as
-- "config, not constants" so the app never hardcodes them.
insert into public.system_settings (key, value) values
  ('client_rejection_threshold', '3'),
  ('payment_overdue_days', '10'),
  ('poc_inactive_days', '1'),
  ('poc_inactive_soft_alert_hours', '12'),
  ('client_inactive_days', '2'),
  ('approval_pending_days', '2'),
  ('default_advance_percent', '60'),
  ('default_final_percent', '40');
