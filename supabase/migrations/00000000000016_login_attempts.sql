-- CLAUDE.md §22-equivalent security ask: rate limiting on login. A DB-backed table (not an
-- in-memory counter) since this runs on serverless — an in-process counter would reset on
-- every cold start and not be shared across concurrent instances, so it wouldn't actually
-- limit anything under real traffic.
create table login_attempts (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  success boolean not null,
  created_at timestamptz not null default now()
);
create index login_attempts_identifier_created_idx on login_attempts(identifier, created_at);
