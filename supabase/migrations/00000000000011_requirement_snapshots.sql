-- UI_COMPONENT_SPEC.pdf "Requirement Sheet Handling": Initial Requirement is a locked
-- snapshot; a Minor Change appends an addendum entry; a Major Change instead triggers a
-- scope revision / new quotation flow (handled by the existing quotation revise path, not
-- this table). One snapshot per project, never edited after creation — only replaced by
-- the addendum log below.
create table requirement_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id),
  content text not null,
  locked_by uuid references users(id),
  locked_at timestamptz not null default now()
);

create table requirement_addenda (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  description text not null,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index requirement_addenda_project_id_idx on requirement_addenda(project_id);
