-- Client onboarding + lead→client linkage (confirmed with user — two real gaps in §1's
-- data model that block implementing §2 step 3 and the quotation→client flow otherwise):
--
-- 1. §7 Client Onboarding wants an address field and a way to gate "cannot proceed without
--    confirming the agreement" — CLIENTS had neither.
-- 2. QUOTATIONS only links to LEADS, and LEADS never linked to CLIENTS — there was no path
--    from a quotation to the client record a client_user logs in as. leads.client_id closes
--    that gap: set once a CLIENTS row is created for a lead (at quotation-send time).

alter table public.clients add column address text;
alter table public.clients add column onboarding_confirmed_at timestamptz;

alter table public.leads add column client_id uuid references public.clients(id);
create index idx_leads_client_id on public.leads(client_id);
