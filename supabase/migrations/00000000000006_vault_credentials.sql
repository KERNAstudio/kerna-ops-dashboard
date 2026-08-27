-- Domain: Vault & Credentials (kerna-master-reference.md §1)
-- access_methods holds raw encrypted credentials and OAuth tokens with expiry — needs the
-- tightest encryption-at-rest and audit coverage in the schema (see reference note under §1).
-- encrypted_password / oauth tokens must only ever be written already-encrypted by the app
-- layer; this migration does not add pgcrypto column-level encryption, just the columns.

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_url text not null,
  downloadable boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.access_methods (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  platform_name text not null,
  access_mode text,
  risk_level text,
  external_account_identifier text,
  delegated_email text,
  role_assigned text,
  login_identifier text,
  encrypted_password text,
  oauth_access_token text,
  oauth_refresh_token text,
  token_expires_at timestamptz,
  retention_expires_at timestamptz,
  deleted_at timestamptz,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.access_sessions (
  id uuid primary key default gen_random_uuid(),
  access_method_id uuid not null references public.access_methods(id) on delete cascade,
  user_id uuid not null references public.users(id),
  session_type text,
  reason text,
  ip_address inet,
  device_info jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index idx_resources_project_id on public.resources(project_id);
create index idx_access_methods_project_id on public.access_methods(project_id);
create index idx_access_methods_created_by on public.access_methods(created_by);
create index idx_access_sessions_access_method_id on public.access_sessions(access_method_id);
create index idx_access_sessions_user_id on public.access_sessions(user_id);

alter table public.resources enable row level security;
alter table public.access_methods enable row level security;
alter table public.access_sessions enable row level security;
