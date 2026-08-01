-- Ummi L-02 foundation. Apply only to the pinned Supabase project through the
-- reviewed L-09 migration/deploy gates; this file performs no live write here.

create schema if not exists extensions;
create extension if not exists "pgcrypto" with schema extensions;

create table public.children (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 200),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, id)
);

create table public.authorizations (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  child_id uuid not null,
  service_name text not null default '',
  provider_name text not null default '',
  authorization_number text not null default '',
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, id),
  foreign key (owner_id, child_id)
    references public.children (owner_id, id)
    on delete restrict,
  check (ends_on >= starts_on)
);

create table public.authorization_lines (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  authorization_id uuid not null,
  billing_code text not null default '',
  label text not null default '',
  unit_label text not null default 'unit',
  approved_units integer not null default 0 check (approved_units >= 0),
  provider_reported_used_units integer not null default 0 check (provider_reported_used_units >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, id),
  unique (owner_id, id, authorization_id),
  foreign key (owner_id, authorization_id)
    references public.authorizations (owner_id, id)
    on delete restrict
);

create table public.therapy_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  authorization_id uuid not null,
  line_id uuid not null,
  service_date date not null,
  status text not null check (status in ('Scheduled', 'Attended', 'Child cancelled', 'Provider cancelled')),
  scheduled_units integer not null default 0 check (scheduled_units >= 0),
  attended_units integer not null default 0 check (attended_units >= 0),
  provider_billed_units integer not null default 0 check (provider_billed_units >= 0),
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, id),
  unique (owner_id, id, authorization_id),
  foreign key (owner_id, authorization_id)
    references public.authorizations (owner_id, id)
    on delete restrict,
  foreign key (owner_id, line_id, authorization_id)
    references public.authorization_lines (owner_id, id, authorization_id)
    on delete restrict
);

create table public.claims (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  authorization_id uuid not null,
  session_id uuid not null,
  claim_number text not null default '',
  submitted_at date,
  processed_at date,
  status text not null default 'Not submitted' check (status in ('Not submitted', 'Pending', 'Processed', 'Denied')),
  billed_units integer not null default 0 check (billed_units >= 0),
  processed_units integer not null default 0 check (processed_units >= 0),
  provider_billed numeric(12, 2) not null default 0 check (provider_billed >= 0),
  insurer_allowed numeric(12, 2) not null default 0 check (insurer_allowed >= 0),
  insurer_paid numeric(12, 2) not null default 0 check (insurer_paid >= 0),
  parent_responsibility numeric(12, 2) not null default 0 check (parent_responsibility >= 0),
  parent_paid numeric(12, 2) not null default 0 check (parent_paid >= 0),
  denial_reason text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, id),
  foreign key (owner_id, authorization_id)
    references public.authorizations (owner_id, id)
    on delete restrict,
  foreign key (owner_id, session_id, authorization_id)
    references public.therapy_sessions (owner_id, id, authorization_id)
    on delete restrict
);

create table public.imported_documents (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  filename text not null default '',
  kind text not null check (kind in ('Authorization', 'EOB', 'Provider statement', 'Other')),
  imported_on date not null,
  source_text text not null default '',
  extracted_fields jsonb not null default '{}'::jsonb check (jsonb_typeof(extracted_fields) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, id)
);

create table public.reminders (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  due_on date not null,
  is_done boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, id)
);

create table public.issue_resolutions (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  issue_id text not null check (char_length(trim(issue_id)) between 1 and 300),
  title text not null default '',
  resolved_at timestamptz not null default timezone('utc', now()),
  fingerprint text not null default '',
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id, id),
  unique (owner_id, issue_id)
);

create index authorizations_owner_child_idx on public.authorizations (owner_id, child_id);
create index authorization_lines_owner_authorization_idx on public.authorization_lines (owner_id, authorization_id);
create index therapy_sessions_owner_service_date_idx on public.therapy_sessions (owner_id, service_date);
create index therapy_sessions_owner_authorization_idx on public.therapy_sessions (owner_id, authorization_id);
create index claims_owner_session_idx on public.claims (owner_id, session_id);
create index imported_documents_owner_imported_on_idx on public.imported_documents (owner_id, imported_on);
create index reminders_owner_due_idx on public.reminders (owner_id, due_on);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'children', 'authorizations', 'authorization_lines', 'therapy_sessions',
    'claims', 'imported_documents', 'reminders', 'issue_resolutions'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (owner_id = (select auth.uid()))',
      table_name || '_owner_select', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (owner_id = (select auth.uid()))',
      table_name || '_owner_insert', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))',
      table_name || '_owner_update', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (owner_id = (select auth.uid()))',
      table_name || '_owner_delete', table_name
    );
  end loop;
end
$$;
