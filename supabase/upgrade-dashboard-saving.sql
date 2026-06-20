create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type public.task_priority as enum ('low', 'medium', 'high');
  end if;
end $$;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  title text not null,
  details text,
  owner_id uuid references auth.users(id) on delete set null,
  owner_name text,
  due_at timestamptz,
  priority public.task_priority not null default 'medium',
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  completed_by_name text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.tasks
  add column if not exists completed_by uuid references auth.users(id) on delete set null,
  add column if not exists completed_by_name text;

create table if not exists public.care_notes (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  body text not null,
  note_type text not null default 'general',
  visible_to_family boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  name text not null,
  dosage text,
  schedule text not null,
  instructions text,
  prescribed_by text,
  refill_due_at date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  title text not null,
  starts_at timestamptz,
  location text,
  provider_name text,
  preparation_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  name text not null,
  role text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  title text not null,
  category text not null,
  storage_path text,
  external_url text,
  notes text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  title text not null,
  remind_at timestamptz not null,
  channel text not null default 'app',
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.caregiver_videos (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid references public.care_recipients(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  title text not null,
  category text not null,
  description text,
  storage_path text,
  embed_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint caregiver_videos_scope check (care_recipient_id is not null or organization_id is not null)
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  care_recipient_id uuid references public.care_recipients(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text,
  action text not null,
  entity text not null,
  entity_id uuid,
  summary text,
  created_at timestamptz not null default now()
);

alter table public.audit_events
  add column if not exists actor_name text,
  add column if not exists summary text;

create table if not exists public.care_extractions (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  source_text text not null,
  summary text not null,
  suggested_tasks text[] not null default '{}',
  red_flags text[] not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('care-files', 'care-files', false)
on conflict (id) do nothing;

alter table public.tasks enable row level security;
alter table public.care_notes enable row level security;
alter table public.medications enable row level security;
alter table public.visits enable row level security;
alter table public.contacts enable row level security;
alter table public.documents enable row level security;
alter table public.reminders enable row level security;
alter table public.caregiver_videos enable row level security;
alter table public.audit_events enable row level security;
alter table public.care_extractions enable row level security;
alter table public.notification_subscriptions enable row level security;

create index if not exists tasks_recipient_created_idx on public.tasks(care_recipient_id, created_at desc);
create index if not exists tasks_completed_by_idx on public.tasks(completed_by);
create index if not exists care_notes_recipient_created_idx on public.care_notes(care_recipient_id, created_at desc);
create index if not exists medications_recipient_active_idx on public.medications(care_recipient_id, active);
create index if not exists visits_recipient_starts_idx on public.visits(care_recipient_id, starts_at);
create index if not exists contacts_recipient_role_idx on public.contacts(care_recipient_id, role);
create index if not exists documents_recipient_created_idx on public.documents(care_recipient_id, created_at desc);
create index if not exists reminders_recipient_remind_idx on public.reminders(care_recipient_id, remind_at);
create index if not exists caregiver_videos_recipient_idx on public.caregiver_videos(care_recipient_id);
create index if not exists audit_events_recipient_created_idx on public.audit_events(care_recipient_id, created_at desc);
create index if not exists care_extractions_recipient_created_idx on public.care_extractions(care_recipient_id, created_at desc);
