# First prompt to paste into Claude Code

Run this from inside the project folder (after `claude` is started):

```
Read CLAUDE.md and docs/kerna-master-reference.md fully before doing anything.

This is a from-scratch build of the KERNA internal ops dashboard — no existing code, only specs.
I want to start with the foundation, not the full app:

1. Propose the stack (I have a recommendation in CLAUDE.md — tell me if you'd choose differently
   and why) and scaffold the project.
2. Turn the data model in docs/kerna-master-reference.md §1 into actual migrations/schema
   (Postgres if Supabase, otherwise whatever the stack needs) — one migration per domain group
   (identity, clients/projects, sales pipeline, delivery, finance, vault/credentials, governance).
3. Set up auth + the RBAC layer from §3 (roles, permissions, route guard order) before building
   any real screen — this is the thing every other feature depends on.
4. Stop there and show me what you've got before building lead management or anything past auth.

Ask me before making any call that isn't already decided in the docs.
```

## Notes for whoever's running this

- `docs/kerna-master-reference.md` is the only doc you need for day-to-day building — it merges
  everything in `docs/source/` (the original 7 spec PDFs + the inspiration doc).
- `docs/erd.jpg` is the schema diagram the data model section was transcribed from.
- `kerna-dashboard-mockup.html` — open it in a browser for the clickable UI reference (layout,
  interactions, role-switching behavior). It's a static mockup, not code to copy in.
- If you change your mind on the stack (e.g. not Supabase), just tell Claude Code directly —
  CLAUDE.md's recommendation isn't binding.
