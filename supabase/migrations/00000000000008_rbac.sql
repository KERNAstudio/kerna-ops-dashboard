-- Auth + RBAC (kerna-master-reference.md §3)
-- Decision (confirmed with user): staff (USERS) authenticate via Supabase Auth — public.users.id
-- IS auth.users.id, one row per auth account, created by a trigger on signup. password_hash on
-- USERS is dropped as unused. CLIENT_USERS keeps its own password_hash and a hand-rolled login
-- (client accounts are POC-generated, not self-signup, and don't belong in the same auth pool).

alter table public.users
  add constraint users_id_fkey foreign key (id) references auth.users(id) on delete cascade;

alter table public.users drop column password_hash;

-- Auto-create the public.users row when a staff auth account is created (Supabase Admin API,
-- used by Founder/Management to provision staff — see app/lib/auth/admin.ts).
create function public.handle_new_staff_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_staff_user();

-- Permission registry (§3)
insert into public.permissions (code, description) values
  ('LEADS_VIEW', 'View leads'),
  ('LEADS_EDIT', 'Create/edit leads'),
  ('QUOTATION_CREATE', 'Create quotations'),
  ('QUOTATION_EDIT', 'Edit quotations (pre-approval)'),
  ('PROJECT_VIEW', 'View projects'),
  ('PROJECT_EDIT', 'Edit projects'),
  ('MODULE_VIEW', 'View project modules'),
  ('MODULE_EDIT', 'Edit assigned modules'),
  ('PAYMENT_VIEW', 'View payments'),
  ('PAYMENT_EDIT', 'Enter/edit payments'),
  ('VAULT_VIEW', 'View vault resources'),
  ('VAULT_DOWNLOAD', 'Download vault resources (payment-gated)'),
  ('CREDENTIAL_VIEW', 'View credential vault'),
  ('ANALYTICS_VIEW', 'View analytics'),
  ('SYSTEM_EDIT', 'Edit system settings');

-- Staff roles (§3 table). "POC" and "Client" are scope-based, not fixed roles: POC-ness is
-- derived from clients.poc_user_id / project assignment, and clients authenticate through
-- CLIENT_USERS, not USERS+ROLES — see app/lib/auth/permissions.ts.
insert into public.roles (name, description) values
  ('founder', 'Everything; cannot override client approval state or edit audit logs'),
  ('management', 'Analytics, projects, payments (view only); no credential visibility'),
  ('sales', 'Own leads/quotations, POC''d projects; payment view limited to own POC projects'),
  ('dev', 'Assigned projects (overview only), assigned modules only'),
  ('design', 'Assigned projects (overview only), assigned modules only'),
  ('research', 'Assigned projects (overview only), assigned modules only');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'founder'; -- Founder: everything

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'management'
  and p.code in ('PROJECT_VIEW', 'PAYMENT_VIEW', 'ANALYTICS_VIEW');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'sales'
  and p.code in ('LEADS_VIEW', 'LEADS_EDIT', 'QUOTATION_CREATE', 'QUOTATION_EDIT',
                 'PROJECT_VIEW', 'PAYMENT_VIEW');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name in ('dev', 'design', 'research')
  and p.code in ('PROJECT_VIEW', 'MODULE_VIEW', 'MODULE_EDIT');
