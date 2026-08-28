-- CLAUDE.md non-negotiable: "Audit log is append-only... No deletes, no edits to existing
-- rows." Previously true only by convention (no application code path calls .update()/
-- .delete() on audit_logs) — enforced here at the database level instead, so a future bug
-- or a direct psql/service-role query can't silently violate it either.
create function reject_audit_log_mutation() returns trigger as $$
begin
  raise exception 'audit_logs is append-only: % is not permitted', tg_op;
end;
$$ language plpgsql;

create trigger audit_logs_no_update
  before update on audit_logs
  for each row execute function reject_audit_log_mutation();

create trigger audit_logs_no_delete
  before delete on audit_logs
  for each row execute function reject_audit_log_mutation();
