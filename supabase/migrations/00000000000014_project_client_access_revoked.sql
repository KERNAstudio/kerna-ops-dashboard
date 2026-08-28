-- §2 step 12 "Data Control" / termination_requests approval: revoke the client's access to
-- THIS project without touching client_users (a client login is account-wide, not
-- per-project — deactivating it would lock them out of every other project they have, which
-- is wrong). KERNA_TC_1.pdf §21.2 reserves indefinite internal data retention, so this is an
-- access flag, not a delete: staff still see everything, nothing is destroyed.
alter table projects add column client_access_revoked_at timestamptz;
