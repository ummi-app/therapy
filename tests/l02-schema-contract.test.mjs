import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const plan = await readFile("ops/L-02-SUPABASE-PLAN.md", "utf8");
const migration = await readFile(
  "supabase/migrations/20260801210700_ledger_foundation.sql",
  "utf8",
);
const providerTest = await readFile(
  "supabase/tests/20260801210700_rls_matrix.sql",
  "utf8",
);

const tables = [
  "children",
  "authorizations",
  "authorization_lines",
  "therapy_sessions",
  "claims",
  "imported_documents",
  "reminders",
  "issue_resolutions",
];

test("L-02 migration covers the complete owner-scoped table inventory", () => {
  for (const table of tables) {
    assert.match(migration, new RegExp(`create table public\\.${table}\\b`));
    assert.match(migration, new RegExp(`alter table public\\.%I enable row level security`));
    assert.match(plan, new RegExp("\\| `" + table + "`"));
  }
  assert.match(migration, /owner_id uuid not null references auth\.users \(id\)/);
  assert.match(migration, /create extension if not exists ["']pgcrypto["'] with schema extensions/);
  assert.match(migration, /extensions\.gen_random_uuid\(\)/);
  assert.match(migration, /on delete restrict/);
  assert.match(migration, /revoke all on table public\.%I from anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.%I to authenticated/);
  const policyList = migration.match(/foreach table_name in array array\[([\s\S]*?)\]/)?.[1];
  assert.ok(policyList, "migration has an explicit policy table list");
  assert.deepEqual(
    [...policyList.matchAll(/'([^']+)'/g)].map((match) => match[1]),
    tables,
    "RLS policy loop covers exactly the inventoried tables",
  );
  for (const command of ["for select to authenticated", "for insert to authenticated", "for update to authenticated", "for delete to authenticated"]) {
    assert.match(migration, new RegExp(command));
  }
  assert.match(migration, /with check \(owner_id = \(select auth\.uid\(\)\)\)/);
});

test("L-02 contract names all tenant-isolation and forged-reference cases", () => {
  for (const scenario of [
    "anon-deny-all",
    "owner-a-crud",
    "non-owner-b-denied",
    "forged-owner-denied",
    "forged-child-fk-denied",
    "forged-line-fk-denied",
    "forged-session-claim-fk-denied",
    "owner-delete-isolation",
    "no-extra-object-surface",
  ]) {
    assert.match(providerTest, new RegExp(`-- ${scenario}:`));
    assert.match(plan, new RegExp(scenario.replaceAll("-", "[ -]"), "i"));
  }
  assert.match(migration, /foreign key \(owner_id, child_id\)/);
  assert.match(migration, /foreign key \(owner_id, line_id, authorization_id\)/);
  assert.match(migration, /foreign key \(owner_id, session_id, authorization_id\)/);
  assert.doesNotMatch(migration, /create (view|function|trigger)\b/i);
});
