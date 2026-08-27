-- Domain: Sales Pipeline (kerna-master-reference.md §1)

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  phone text,
  email text,
  status text not null default 'new',
  created_by uuid references public.users(id),
  assigned_to uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  poc_id uuid references public.users(id),
  status text not null default 'draft',
  template_type text,
  created_at timestamptz not null default now()
);

create table public.quotation_versions (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  version_number integer not null,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  is_final boolean not null default false,
  created_at timestamptz not null default now(),
  unique (quotation_id, version_number)
);

create table public.quotation_line_items (
  id uuid primary key default gen_random_uuid(),
  quotation_version_id uuid not null references public.quotation_versions(id) on delete cascade,
  title text not null,
  description text,
  unit_price numeric(12,2) not null,
  quantity numeric(10,2) not null default 1,
  total numeric(12,2) not null
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.contract_versions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  version_number integer not null,
  document_url text,
  signature_type text,
  signature_data text,
  signed_by uuid references public.users(id),
  issued_at timestamptz,
  signed_at timestamptz,
  is_active boolean not null default true,
  unique (contract_id, version_number)
);

create index idx_leads_created_by on public.leads(created_by);
create index idx_leads_assigned_to on public.leads(assigned_to);
create index idx_leads_status on public.leads(status);
create index idx_quotations_lead_id on public.quotations(lead_id);
create index idx_quotations_poc_id on public.quotations(poc_id);
create index idx_quotation_versions_quotation_id on public.quotation_versions(quotation_id);
create index idx_quotation_line_items_quotation_version_id on public.quotation_line_items(quotation_version_id);
create index idx_contracts_project_id on public.contracts(project_id);
create index idx_contract_versions_contract_id on public.contract_versions(contract_id);
create index idx_contract_versions_signed_by on public.contract_versions(signed_by);

alter table public.leads enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_versions enable row level security;
alter table public.quotation_line_items enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_versions enable row level security;
