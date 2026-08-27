-- Domain: Finance (kerna-master-reference.md §1)
-- payments.status: only 'pending' / 'received' are named in the spec ("work blocked
-- until marked Received") — no constraint added so refunds/failures aren't guessed at.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  amount numeric(12,2) not null,
  payment_type text not null,
  status text not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  invoice_number text not null unique,
  financial_year text not null,
  sequence_number integer not null,
  subtotal numeric(12,2) not null,
  gst_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  status text not null default 'issued',
  issued_at timestamptz not null default now()
);

create table public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  credit_note_number text not null unique,
  financial_year text not null,
  sequence_number integer not null,
  amount numeric(12,2) not null,
  reason text,
  issued_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  billing_cycle text not null,
  next_due_date date,
  grace_period_days integer default 0,
  created_at timestamptz not null default now()
);

create index idx_payments_project_id on public.payments(project_id);
create index idx_invoices_project_id on public.invoices(project_id);
create index idx_credit_notes_invoice_id on public.credit_notes(invoice_id);
create index idx_subscriptions_project_id on public.subscriptions(project_id);

alter table public.payments enable row level security;
alter table public.invoices enable row level security;
alter table public.credit_notes enable row level security;
alter table public.subscriptions enable row level security;
