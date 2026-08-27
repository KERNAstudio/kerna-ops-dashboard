alter table quotation_versions
  add column advance_percent numeric not null default 60
  check (advance_percent >= 0 and advance_percent <= 100);

comment on column quotation_versions.advance_percent is
  'POC-set advance/final payment split (§2 step 2 and 4). Final % is always 100 - advance_percent, never stored separately. Default 60 matches the spec default and the system_settings "default_advance_percent" key.';
