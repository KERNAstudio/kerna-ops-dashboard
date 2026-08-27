-- INVOICES existed in the schema (migration 00000000000005) with zero application code and
-- no payment linkage, making it impossible to know which invoice covers which payment. Add
-- the missing link now that we're actually wiring it up: one invoice per received payment.
alter table invoices add column payment_id uuid references payments(id);
create unique index invoices_payment_id_idx on invoices(payment_id) where payment_id is not null;
