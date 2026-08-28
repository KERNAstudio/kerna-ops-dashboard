-- SUBSCRIPTIONS existed (migration 00000000000005) with zero application code and no way
-- to pause/cancel a recurring arrangement without deleting its history, and no constraint
-- stopping a project from ending up with two conflicting subscription rows. Both covers
-- the same underlying mechanism the user asked for: a completed project opting into a
-- post-delivery maintenance retainer, or a project billed recurring from the start instead
-- of advance/final — either way it's one subscriptions row per project.
alter table subscriptions add column status text not null default 'active' check (status in ('active', 'paused', 'cancelled'));
alter table subscriptions add constraint subscriptions_project_id_key unique (project_id);
