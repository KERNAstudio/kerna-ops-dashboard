-- Domain: Delivery (kerna-master-reference.md §1)
-- approvals.status covers the client approval screen actions (§7): pending until the
-- client acts, approved locks the version (§3 Client approval lock), changes_requested
-- kicks back to dev, withdrawn is the POC reopening an approved version with a reason.

create table public.project_modules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  module_type text not null,
  status text not null default 'not_started',
  internal_deadline timestamptz,
  created_at timestamptz not null default now()
);

create table public.module_assignments (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.project_modules(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  unique (module_id, user_id)
);

create table public.module_versions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.project_modules(id) on delete cascade,
  version_number integer not null,
  file_url text,
  notes text,
  uploaded_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  unique (module_id, version_number)
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  module_version_id uuid not null references public.module_versions(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'changes_requested', 'withdrawn')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  lock_expires_at timestamptz,
  withdrawn_at timestamptz,
  withdrawn_by uuid references public.users(id)
);

create index idx_project_modules_project_id on public.project_modules(project_id);
create index idx_module_assignments_module_id on public.module_assignments(module_id);
create index idx_module_assignments_user_id on public.module_assignments(user_id);
create index idx_module_versions_module_id on public.module_versions(module_id);
create index idx_module_versions_uploaded_by on public.module_versions(uploaded_by);
create index idx_approvals_module_version_id on public.approvals(module_version_id);
create index idx_approvals_withdrawn_by on public.approvals(withdrawn_by);

alter table public.project_modules enable row level security;
alter table public.module_assignments enable row level security;
alter table public.module_versions enable row level security;
alter table public.approvals enable row level security;
