// Minimal in-memory stand-in for the Supabase query builder, covering exactly the chain
// shapes guard.ts / lifecycle.ts / escalations use (.select/.eq/.in/.order/.limit/
// .maybeSingle/.single/.update/.insert, plus the count-only "head" queries). Not a general
// Postgrest mock — extend it if a test needs a shape it doesn't cover yet.
//
// Every read returns a fresh shallow copy, never a live reference into the fake DB — a real
// Postgres round-trip never hands back the same object twice, and a first version of this
// fake that did caused a real test failure (fetching "previous state" then updating silently
// mutated the already-fetched object, because both pointed at the same in-memory row).
type Row = Record<string, unknown>;
type DB = Record<string, Row[]>;

function getNested(row: Row, col: string): unknown {
  if (!col.includes(".")) return row[col];
  const [a, b] = col.split(".");
  const nested = row[a];
  return nested && typeof nested === "object" ? (nested as Row)[b] : undefined;
}

let idCounter = 0;

export function createFakeAdminClient(db: DB) {
  function from(table: string) {
    db[table] ??= [];
    let originals: Row[] = [...db[table]]; // live references into db, filtered by eq/in/etc.
    let wantCount = false;
    let pendingUpdate: Row | null = null;

    function resolve(): Row[] {
      if (pendingUpdate) originals.forEach((r) => Object.assign(r, pendingUpdate));
      return originals.map((r) => ({ ...r })); // copies — callers never get a live reference
    }

    const builder = {
      select(_cols?: string, opts?: { count?: string; head?: boolean }) {
        if (opts?.count) wantCount = true;
        return builder;
      },
      eq(col: string, val: unknown) {
        originals = originals.filter((r) => getNested(r, col) === val);
        return builder;
      },
      neq(col: string, val: unknown) {
        originals = originals.filter((r) => getNested(r, col) !== val);
        return builder;
      },
      in(col: string, vals: unknown[]) {
        originals = originals.filter((r) => vals.includes(getNested(r, col)));
        return builder;
      },
      gte(col: string, val: string) {
        originals = originals.filter((r) => String(getNested(r, col)) >= val);
        return builder;
      },
      lt(col: string, val: string) {
        originals = originals.filter((r) => String(getNested(r, col)) < val);
        return builder;
      },
      is(col: string, val: unknown) {
        originals = originals.filter((r) => getNested(r, col) === val);
        return builder;
      },
      order() {
        return builder;
      },
      limit(n: number) {
        originals = originals.slice(0, n);
        return builder;
      },
      update(patch: Row) {
        pendingUpdate = patch;
        return builder;
      },
      insert(newRows: Row | Row[]) {
        const arr = (Array.isArray(newRows) ? newRows : [newRows]).map((r) => ({
          id: `fake-${idCounter++}`,
          ...r,
        }));
        db[table].push(...arr);
        originals = arr;
        return builder;
      },
      delete() {
        const toRemove = new Set(originals);
        db[table] = db[table].filter((r) => !toRemove.has(r));
        return builder;
      },
      async maybeSingle() {
        const result = resolve();
        return { data: (result[0] as Row) ?? null, error: null };
      },
      async single() {
        const result = resolve();
        return { data: (result[0] as Row) ?? null, error: result[0] ? null : { message: "not found" } };
      },
      then(onResolve: (v: { data: Row[]; count?: number; error: null }) => void) {
        const result = resolve();
        onResolve({ data: result, count: wantCount ? result.length : undefined, error: null });
      },
    };
    return builder;
  }

  return { from } as unknown as ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>;
}
