-- Ummi L-02 provider-side policy contract.
--
-- Run this file with the Supabase pgTAP test runner against a disposable
-- database after the matching migration. The test enables pgTAP itself and
-- creates synthetic auth users and JWT claims without external helper SQL.
--
-- The scenario names are intentionally explicit so a missing case is visible
-- in review even when provider credentials are unavailable locally.

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select * from no_plan();

select has_table('public', 'children', 'children table exists');
select has_table('public', 'authorizations', 'authorizations table exists');
select has_table('public', 'authorization_lines', 'authorization_lines table exists');
select has_table('public', 'therapy_sessions', 'therapy_sessions table exists');
select has_table('public', 'claims', 'claims table exists');
select has_table('public', 'imported_documents', 'imported_documents table exists');
select has_table('public', 'reminders', 'reminders table exists');
select has_table('public', 'issue_resolutions', 'issue_resolutions table exists');

-- Catalog assertions: every table must have RLS and exactly four owner policies.
select results_eq(
  $$select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in
      ('children', 'authorizations', 'authorization_lines', 'therapy_sessions',
       'claims', 'imported_documents', 'reminders', 'issue_resolutions')
      and c.relrowsecurity$$,
  $$values (8)$$,
  'RLS is enabled on every launch table'
);

select results_eq(
  $$select count(*)::int from pg_policies where schemaname = 'public'
    and tablename in
      ('children', 'authorizations', 'authorization_lines', 'therapy_sessions',
       'claims', 'imported_documents', 'reminders', 'issue_resolutions')$$,
  $$values (32)$$,
  'every launch table has select/insert/update/delete policies'
);

-- Behavioral cases execute in this disposable database with synthetic users
-- and rows only. The test creates its own auth users and sets the same JWT
-- claim that auth.uid() reads, so it does not depend on external helper SQL.
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-00000000aa01', 'authenticated', 'authenticated', 'owner_a@example.test', 'test-only', now(), now(), now()),
  ('00000000-0000-0000-0000-00000000bb01', 'authenticated', 'authenticated', 'owner_b@example.test', 'test-only', now(), now(), now())
on conflict (id) do nothing;

-- anon-deny-all: explicit grants are absent, so every DML verb is denied for
-- every launch table rather than merely returning an empty row set.
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select throws_ok(format('select count(*) from public.%I', table_name), '42501', null, 'anon select denied for ' || table_name)
from unnest(array[
  'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
  'claims', 'imported_documents', 'reminders', 'issue_resolutions'
]) as table_name;
select throws_ok(format('insert into public.%I (owner_id) values (null)', table_name), '42501', null, 'anon insert denied for ' || table_name)
from unnest(array[
  'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
  'claims', 'imported_documents', 'reminders', 'issue_resolutions'
]) as table_name;
select throws_ok(format('update public.%I set owner_id = null', table_name), '42501', null, 'anon update denied for ' || table_name)
from unnest(array[
  'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
  'claims', 'imported_documents', 'reminders', 'issue_resolutions'
]) as table_name;
select throws_ok(format('delete from public.%I', table_name), '42501', null, 'anon delete denied for ' || table_name)
from unnest(array[
  'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
  'claims', 'imported_documents', 'reminders', 'issue_resolutions'
]) as table_name;

-- owner-a-crud: build the supported graph and the three owner-rooted records.
set local role none;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000aa01', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
insert into public.children (id, owner_id, display_name)
values ('00000000-0000-0000-0000-0000000000a1', auth.uid(), 'Synthetic A');
insert into public.authorizations (id, owner_id, child_id, starts_on, ends_on)
values ('00000000-0000-0000-0000-0000000000a2', auth.uid(), '00000000-0000-0000-0000-0000000000a1', '2026-01-01', '2026-12-31');
insert into public.authorization_lines (id, owner_id, authorization_id, billing_code, approved_units)
values ('00000000-0000-0000-0000-0000000000a3', auth.uid(), '00000000-0000-0000-0000-0000000000a2', '97153', 10);
insert into public.therapy_sessions (id, owner_id, authorization_id, line_id, service_date, status, scheduled_units, attended_units)
values ('00000000-0000-0000-0000-0000000000a4', auth.uid(), '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a3', '2026-07-01', 'Attended', 2, 2);
insert into public.claims (id, owner_id, authorization_id, session_id, claim_number, status, billed_units, processed_units)
values ('00000000-0000-0000-0000-0000000000a5', auth.uid(), '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a4', 'SYN-A', 'Processed', 2, 2);
insert into public.imported_documents (id, owner_id, kind, imported_on, source_text)
values ('00000000-0000-0000-0000-0000000000a6', auth.uid(), 'EOB', '2026-07-01', 'synthetic fixture');
insert into public.reminders (id, owner_id, due_on, title)
values ('00000000-0000-0000-0000-0000000000a7', auth.uid(), '2026-08-01', 'Synthetic reminder');
insert into public.issue_resolutions (id, owner_id, issue_id)
values ('00000000-0000-0000-0000-0000000000a8', auth.uid(), 'synthetic-issue-a');
select results_eq(format('select count(*)::int from public.%I where owner_id = ''00000000-0000-0000-0000-00000000aa01''', table_name), $$values (1)$$, 'owner A can read own ' || table_name)
from unnest(array[
  'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
  'claims', 'imported_documents', 'reminders', 'issue_resolutions'
]) as table_name;
select lives_ok(format('update public.%I set updated_at = ''2030-01-01''::timestamptz where owner_id = ''00000000-0000-0000-0000-00000000aa01''', table_name), 'owner A can update own ' || table_name)
from unnest(array[
  'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
  'claims', 'imported_documents', 'reminders', 'issue_resolutions'
]) as table_name;
select results_eq(format('select count(*)::int from public.%I where owner_id = ''00000000-0000-0000-0000-00000000aa01'' and updated_at = ''2030-01-01''::timestamptz', table_name), $$values (1)$$, 'owner A update persisted for ' || table_name)
from unnest(array[
  'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
  'claims', 'imported_documents', 'reminders', 'issue_resolutions'
]) as table_name;
select is((select count(*)::int from public.children where id = '00000000-0000-0000-0000-0000000000a1'), 1, 'owner A can read own child');
update public.children set display_name = 'Synthetic A updated' where id = '00000000-0000-0000-0000-0000000000a1';
select is((select display_name from public.children where id = '00000000-0000-0000-0000-0000000000a1'), 'Synthetic A updated', 'owner A can update own child');
update public.imported_documents set source_text = 'synthetic fixture updated' where id = '00000000-0000-0000-0000-0000000000a6';
update public.reminders set is_done = true where id = '00000000-0000-0000-0000-0000000000a7';
update public.issue_resolutions set note = 'synthetic note' where id = '00000000-0000-0000-0000-0000000000a8';

-- Create B's root and graph before non-owner and cascade checks.
set local role none;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000bb01', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
insert into public.children (id, owner_id, display_name)
values ('00000000-0000-0000-0000-0000000000b1', auth.uid(), 'Synthetic B');
insert into public.authorizations (id, owner_id, child_id, starts_on, ends_on)
values ('00000000-0000-0000-0000-0000000000b2', auth.uid(), '00000000-0000-0000-0000-0000000000b1', '2026-01-01', '2026-12-31');
insert into public.authorization_lines (id, owner_id, authorization_id, billing_code, approved_units)
values ('00000000-0000-0000-0000-0000000000b3', auth.uid(), '00000000-0000-0000-0000-0000000000b2', '97530', 10);
insert into public.therapy_sessions (id, owner_id, authorization_id, line_id, service_date, status)
values ('00000000-0000-0000-0000-0000000000b4', auth.uid(), '00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b3', '2026-07-02', 'Scheduled');
insert into public.claims (id, owner_id, authorization_id, session_id, claim_number)
values ('00000000-0000-0000-0000-0000000000b5', auth.uid(), '00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b4', 'SYN-B');
insert into public.imported_documents (id, owner_id, kind, imported_on, source_text)
values ('00000000-0000-0000-0000-0000000000b6', auth.uid(), 'Other', '2026-07-02', 'synthetic B fixture');
insert into public.reminders (id, owner_id, due_on, title)
values ('00000000-0000-0000-0000-0000000000b7', auth.uid(), '2026-08-02', 'Synthetic B reminder');
insert into public.issue_resolutions (id, owner_id, issue_id)
values ('00000000-0000-0000-0000-0000000000b8', auth.uid(), 'synthetic-issue-b');

-- non-owner-b-denied: B sees no A rows and every DML verb returns zero rows
-- for all eight tables. The rows remain until A performs the later explicit
-- account-deletion order.
select results_eq(format('select count(*)::int from public.%I where owner_id = ''00000000-0000-0000-0000-00000000aa01''', table_name), $$values (0)$$, 'owner B cannot read owner A ' || table_name)
from unnest(array[
  'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
  'claims', 'imported_documents', 'reminders', 'issue_resolutions'
]) as table_name;
select lives_ok(format('update public.%I set updated_at = ''2040-01-01''::timestamptz where owner_id = ''00000000-0000-0000-0000-00000000aa01''', table_name), 'owner B update is safely ignored for ' || table_name)
from unnest(array[
  'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
  'claims', 'imported_documents', 'reminders', 'issue_resolutions'
]) as table_name;
set local role none;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000aa01', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select results_eq(format('select count(*)::int from public.%I where owner_id = ''00000000-0000-0000-0000-00000000aa01'' and updated_at = ''2030-01-01''::timestamptz', table_name), $$values (1)$$, 'owner B update did not change ' || table_name)
from unnest(array[
  'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
  'claims', 'imported_documents', 'reminders', 'issue_resolutions'
]) as table_name;
set local role none;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000bb01', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select lives_ok(format('delete from public.%I where owner_id = ''00000000-0000-0000-0000-00000000aa01''', table_name), 'owner B delete is safely ignored for ' || table_name)
from unnest(array[
  'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
  'claims', 'imported_documents', 'reminders', 'issue_resolutions'
]) as table_name;
set local role none;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000aa01', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select results_eq(format('select count(*)::int from public.%I where owner_id = ''00000000-0000-0000-0000-00000000aa01''', table_name), $$values (1)$$, 'owner B delete did not remove ' || table_name)
from unnest(array[
  'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
  'claims', 'imported_documents', 'reminders', 'issue_resolutions'
]) as table_name;

-- forged-owner-denied: A cannot write or reassign rows to B's owner ID.
set local role none;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000aa01', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select throws_ok($$insert into public.children (owner_id, display_name)
  values ('00000000-0000-0000-0000-00000000bb01', 'forged')$$, '42501', null, 'forged owner child insert denied');
select throws_ok($$insert into public.authorizations (owner_id, child_id, starts_on, ends_on)
  values ('00000000-0000-0000-0000-00000000bb01', '00000000-0000-0000-0000-0000000000b1', '2026-01-01', '2026-12-31')$$, '42501', null, 'forged owner authorization insert denied');
select throws_ok($$insert into public.authorization_lines (owner_id, authorization_id, billing_code)
  values ('00000000-0000-0000-0000-00000000bb01', '00000000-0000-0000-0000-0000000000b2', '97153')$$, '42501', null, 'forged owner line insert denied');
select throws_ok($$insert into public.therapy_sessions (owner_id, authorization_id, line_id, service_date, status)
  values ('00000000-0000-0000-0000-00000000bb01', '00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b3', '2026-07-04', 'Scheduled')$$, '42501', null, 'forged owner session insert denied');
select throws_ok($$insert into public.claims (owner_id, authorization_id, session_id, claim_number)
  values ('00000000-0000-0000-0000-00000000bb01', '00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b4', 'forged')$$, '42501', null, 'forged owner claim insert denied');
select throws_ok($$insert into public.imported_documents (owner_id, kind, imported_on)
  values ('00000000-0000-0000-0000-00000000bb01', 'Other', '2026-07-03')$$, '42501', null, 'forged owner document insert denied');
select throws_ok($$insert into public.reminders (owner_id, due_on, title)
  values ('00000000-0000-0000-0000-00000000bb01', '2026-08-03', 'forged')$$, '42501', null, 'forged owner reminder insert denied');
select throws_ok($$insert into public.issue_resolutions (owner_id, issue_id)
  values ('00000000-0000-0000-0000-00000000bb01', 'forged')$$, '42501', null, 'forged owner resolution insert denied');
select throws_ok(format('update public.%I set owner_id = ''00000000-0000-0000-0000-00000000bb01'' where owner_id = ''00000000-0000-0000-0000-00000000aa01'' returning id', table_name), '42501', null, 'forged owner update denied for ' || table_name)
from unnest(array[
  'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
  'claims', 'imported_documents', 'reminders', 'issue_resolutions'
]) as table_name;

-- forged-child-fk-denied:
select throws_ok($$insert into public.authorizations (owner_id, child_id, starts_on, ends_on)
  values (auth.uid(), '00000000-0000-0000-0000-0000000000b1', '2026-01-01', '2026-12-31')$$, '23503', null, 'foreign child FK denied');
select throws_ok($$insert into public.authorization_lines (owner_id, authorization_id, billing_code)
  values (auth.uid(), '00000000-0000-0000-0000-0000000000b2', '97153')$$, '23503', null, 'foreign authorization line FK denied');
-- forged-line-fk-denied:
select throws_ok($$insert into public.therapy_sessions (owner_id, authorization_id, line_id, service_date, status)
  values (auth.uid(), '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000b3', '2026-07-04', 'Scheduled')$$, '23503', null, 'foreign line composite FK denied');
select throws_ok($$insert into public.therapy_sessions (owner_id, authorization_id, line_id, service_date, status)
  values (auth.uid(), '00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a3', '2026-07-04', 'Scheduled')$$, '23503', null, 'foreign authorization/line FKs denied');
-- forged-session-claim-fk-denied:
select throws_ok($$insert into public.claims (owner_id, authorization_id, session_id, claim_number)
  values (auth.uid(), '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000b4', 'forged')$$, '23503', null, 'foreign session/authorization FK denied');

-- owner-delete-isolation: ordinary parent deletion is restricted, while the
-- explicit reverse-order account deletion removes all A rows and preserves B.
select throws_ok($$delete from public.children where id = '00000000-0000-0000-0000-0000000000a1'$$, '23503', null, 'ordinary child delete cannot erase descendants');
select throws_ok($$delete from public.authorizations where id = '00000000-0000-0000-0000-0000000000a2'$$, '23503', null, 'ordinary authorization delete cannot erase descendants');
select throws_ok($$delete from public.authorization_lines where id = '00000000-0000-0000-0000-0000000000a3'$$, '23503', null, 'ordinary line delete cannot erase descendants');
select throws_ok($$delete from public.therapy_sessions where id = '00000000-0000-0000-0000-0000000000a4'$$, '23503', null, 'ordinary session delete cannot erase claims');
delete from public.claims where id = '00000000-0000-0000-0000-0000000000a5';
delete from public.therapy_sessions where id = '00000000-0000-0000-0000-0000000000a4';
delete from public.authorization_lines where id = '00000000-0000-0000-0000-0000000000a3';
delete from public.authorizations where id = '00000000-0000-0000-0000-0000000000a2';
delete from public.imported_documents where id = '00000000-0000-0000-0000-0000000000a6';
delete from public.reminders where id = '00000000-0000-0000-0000-0000000000a7';
delete from public.issue_resolutions where id = '00000000-0000-0000-0000-0000000000a8';
delete from public.children where id = '00000000-0000-0000-0000-0000000000a1';
select results_eq(format('select count(*)::int from public.%I where owner_id = ''00000000-0000-0000-0000-00000000aa01''', table_name), $$values (0)$$, 'account deletion removed all owner A ' || table_name)
from unnest(array[
  'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
  'claims', 'imported_documents', 'reminders', 'issue_resolutions'
]) as table_name;
set local role none;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000bb01', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select results_eq(format('select count(*)::int from public.%I where owner_id = ''00000000-0000-0000-0000-00000000bb01''', table_name), $$values (1)$$, 'account deletion preserved owner B ' || table_name)
from unnest(array[
  'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
  'claims', 'imported_documents', 'reminders', 'issue_resolutions'
]) as table_name;
set local role none;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000aa01', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select is((select count(*)::int from public.therapy_sessions s left join public.authorization_lines l on l.owner_id = s.owner_id and l.id = s.line_id where s.owner_id = '00000000-0000-0000-0000-00000000aa01' and l.id is null), 0, 'no owner A orphaned sessions remain');
set local role none;
delete from auth.users where id = '00000000-0000-0000-0000-00000000aa01';
select is((select count(*)::int from auth.users where id = '00000000-0000-0000-0000-00000000aa01'), 0, 'owner A auth identity deleted after rows');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000aa01', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
delete from public.children where owner_id = '00000000-0000-0000-0000-00000000aa01';
delete from public.authorizations where owner_id = '00000000-0000-0000-0000-00000000aa01';
delete from public.authorization_lines where owner_id = '00000000-0000-0000-0000-00000000aa01';
delete from public.therapy_sessions where owner_id = '00000000-0000-0000-0000-00000000aa01';
delete from public.claims where owner_id = '00000000-0000-0000-0000-00000000aa01';
delete from public.imported_documents where owner_id = '00000000-0000-0000-0000-00000000aa01';
delete from public.reminders where owner_id = '00000000-0000-0000-0000-00000000aa01';
delete from public.issue_resolutions where owner_id = '00000000-0000-0000-0000-00000000aa01';
set local role none;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000bb01', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select results_eq('select count(*)::int from public.children where owner_id = ''00000000-0000-0000-0000-00000000bb01''', $$values (1)$$, 'repeat account deletion left owner B intact');
set local role none;

-- no-extra-object-surface: the migration intentionally creates no public view,
-- RPC, trigger, function, or storage bucket for the launch slice.
select results_eq($$select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f')$$, $$values (8)$$, 'exactly eight public launch relations exist');
select is((select count(*)::int from pg_views where schemaname = 'public'), 0, 'no public views in foundation slice');
select is((select count(*)::int from pg_matviews where schemaname = 'public'), 0, 'no public materialized views in foundation slice');
select is((select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')), 0, 'no application public functions or RPCs in foundation slice');
select is((select count(*)::int from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and not t.tgisinternal), 0, 'no public triggers in foundation slice');
select is((select count(*)::int from storage.buckets), 0, 'no Storage buckets in foundation slice');
select is((select count(*)::int from storage.objects), 0, 'no Storage objects in foundation slice');
select results_eq($$select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'storage' and c.relname = 'objects'$$, $$values (true)$$, 'Storage objects are RLS protected');

select * from finish();
rollback;
