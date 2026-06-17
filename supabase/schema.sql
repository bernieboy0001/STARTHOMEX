create extension if not exists "pgcrypto";

create type app_role as enum ('family_lead', 'family_member', 'home_aide', 'agency_coordinator', 'clinician');
create type task_priority as enum ('low', 'medium', 'high');
create type shift_status as enum ('scheduled', 'needs_confirm', 'completed', 'missed');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'family',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.care_recipients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  date_of_birth date,
  address text,
  recovery_status text,
  fall_risk text default 'unknown',
  primary_condition text,
  emergency_summary text,
  created_at timestamptz not null default now()
);

create table public.care_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  care_recipient_id uuid references public.care_recipients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (organization_id, care_recipient_id, user_id)
);

create table public.discharge_plans (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  diagnosis text not null,
  hospital_name text,
  discharged_at date,
  restrictions text[] not null default '{}',
  red_flags text[] not null default '{}',
  recovery_goals text[] not null default '{}',
  raw_document_path text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  title text not null,
  details text,
  owner_id uuid references auth.users(id),
  owner_name text,
  due_at timestamptz,
  priority task_priority not null default 'medium',
  completed_at timestamptz,
  completed_by uuid references auth.users(id),
  completed_by_name text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.medications (
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

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  title text not null,
  starts_at timestamptz,
  location text,
  provider_name text,
  preparation_notes text,
  created_at timestamptz not null default now()
);

create table public.care_shifts (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  caregiver_id uuid references auth.users(id),
  caregiver_name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status shift_status not null default 'scheduled',
  focus text,
  created_at timestamptz not null default now()
);

create table public.care_notes (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  author_id uuid references auth.users(id),
  author_name text not null,
  body text not null,
  note_type text not null default 'general',
  visible_to_family boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  name text not null,
  role text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  title text not null,
  category text not null,
  storage_path text,
  external_url text,
  notes text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.caregiver_videos (
  id uuid primary key default gen_random_uuid(),
  care_recipient_id uuid references public.care_recipients(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  title text not null,
  category text not null,
  description text,
  storage_path text,
  embed_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint video_scope check (care_recipient_id is not null or organization_id is not null)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  care_recipient_id uuid references public.care_recipients(id) on delete cascade,
  actor_id uuid references auth.users(id),
  actor_name text,
  action text not null,
  entity text not null,
  entity_id uuid,
  summary text,
  created_at timestamptz not null default now()
);

create table public.care_circle_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  invited_email text,
  role app_role not null default 'family_member',
  created_by uuid references auth.users(id),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create or replace function public.is_care_member(target_recipient uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.care_memberships m
    where m.care_recipient_id = target_recipient
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_care_role(target_recipient uuid, allowed_roles app_role[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.care_memberships m
    where m.care_recipient_id = target_recipient
      and m.user_id = auth.uid()
      and m.role = any(allowed_roles)
  );
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.care_recipients enable row level security;
alter table public.care_memberships enable row level security;
alter table public.discharge_plans enable row level security;
alter table public.tasks enable row level security;
alter table public.medications enable row level security;
alter table public.visits enable row level security;
alter table public.care_shifts enable row level security;
alter table public.care_notes enable row level security;
alter table public.contacts enable row level security;
alter table public.documents enable row level security;
alter table public.caregiver_videos enable row level security;
alter table public.audit_events enable row level security;
alter table public.care_circle_invites enable row level security;

create policy "members read organizations" on public.organizations
for select using (
  exists (
    select 1
    from public.care_memberships m
    where m.organization_id = organizations.id
      and m.user_id = auth.uid()
  )
);

create policy "profiles are self-readable" on public.profiles for select using (id = auth.uid());
create policy "profiles are self-insertable" on public.profiles for insert with check (id = auth.uid());
create policy "profiles are self-editable" on public.profiles for update using (id = auth.uid());

create policy "members read care recipients" on public.care_recipients
for select using (public.is_care_member(id));

create policy "leads manage care recipients" on public.care_recipients
for update using (public.has_care_role(id, array['family_lead','agency_coordinator']::app_role[]));

create policy "members read memberships" on public.care_memberships
for select using (public.is_care_member(care_recipient_id));

create policy "leads manage memberships" on public.care_memberships
for all using (public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator']::app_role[]));

create policy "members read discharge plans" on public.discharge_plans
for select using (public.is_care_member(care_recipient_id));

create policy "authorized manage discharge plans" on public.discharge_plans
for all using (public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator','clinician']::app_role[]));

create policy "members read tasks" on public.tasks for select using (public.is_care_member(care_recipient_id));
create policy "members create tasks" on public.tasks for insert with check (public.is_care_member(care_recipient_id));
create policy "members update tasks" on public.tasks for update using (public.is_care_member(care_recipient_id));

create policy "members read medications" on public.medications for select using (public.is_care_member(care_recipient_id));
create policy "authorized manage medications" on public.medications
for all using (public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator','clinician']::app_role[]));

create policy "members read visits" on public.visits for select using (public.is_care_member(care_recipient_id));
create policy "members manage visits" on public.visits for all using (public.is_care_member(care_recipient_id));

create policy "members read shifts" on public.care_shifts for select using (public.is_care_member(care_recipient_id));
create policy "authorized manage shifts" on public.care_shifts
for all using (public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator','home_aide']::app_role[]));

create policy "members read notes" on public.care_notes
for select using (public.is_care_member(care_recipient_id) and (visible_to_family or author_id = auth.uid()));
create policy "members create notes" on public.care_notes for insert with check (public.is_care_member(care_recipient_id));

create policy "members read contacts" on public.contacts for select using (public.is_care_member(care_recipient_id));
create policy "leads manage contacts" on public.contacts
for all using (public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator']::app_role[]));

create policy "members read documents" on public.documents for select using (public.is_care_member(care_recipient_id));
create policy "members upload documents" on public.documents for insert with check (public.is_care_member(care_recipient_id));

create policy "members read videos" on public.caregiver_videos
for select using (
  (care_recipient_id is not null and public.is_care_member(care_recipient_id))
  or
  (organization_id is not null and exists (
    select 1 from public.care_memberships m
    where m.organization_id = caregiver_videos.organization_id
      and m.user_id = auth.uid()
  ))
);

create policy "coordinators manage videos" on public.caregiver_videos
for all using (
  (care_recipient_id is not null and public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator']::app_role[]))
  or
  (organization_id is not null and exists (
    select 1 from public.care_memberships m
    where m.organization_id = caregiver_videos.organization_id
      and m.user_id = auth.uid()
      and m.role in ('family_lead','agency_coordinator')
  ))
);

create policy "leads read care circle invites" on public.care_circle_invites
for select using (public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator']::app_role[]));
create policy "leads create care circle invites" on public.care_circle_invites
for insert with check (public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator']::app_role[]));
create policy "leads update care circle invites" on public.care_circle_invites
for update using (public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator']::app_role[]));

create policy "members read audit events" on public.audit_events
for select using (public.is_care_member(care_recipient_id));

create index on public.care_memberships(user_id);
create index on public.care_memberships(care_recipient_id);
create index on public.tasks(care_recipient_id, completed_at, due_at);
create index on public.care_notes(care_recipient_id, created_at desc);
create index on public.care_shifts(care_recipient_id, starts_at);
create index on public.caregiver_videos(care_recipient_id);
create index on public.care_circle_invites(token);
create index on public.care_circle_invites(care_recipient_id);
create index on public.audit_events(care_recipient_id, created_at desc);
create index on public.medications(care_recipient_id, active);
create index on public.visits(care_recipient_id, starts_at);
create index on public.documents(care_recipient_id, created_at desc);
create index on public.contacts(care_recipient_id, role);
