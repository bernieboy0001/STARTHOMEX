create extension if not exists "pgcrypto";

create table if not exists public.care_circle_invites (
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

alter table public.care_circle_invites enable row level security;

drop policy if exists "leads read care circle invites" on public.care_circle_invites;
create policy "leads read care circle invites" on public.care_circle_invites
for select using (public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator']::app_role[]));

drop policy if exists "leads create care circle invites" on public.care_circle_invites;
create policy "leads create care circle invites" on public.care_circle_invites
for insert with check (public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator']::app_role[]));

drop policy if exists "leads update care circle invites" on public.care_circle_invites;
create policy "leads update care circle invites" on public.care_circle_invites
for update using (public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator']::app_role[]));

drop policy if exists "profiles are self-insertable" on public.profiles;
create policy "profiles are self-insertable" on public.profiles
for insert with check (id = auth.uid());

drop policy if exists "members read organizations" on public.organizations;
create policy "members read organizations" on public.organizations
for select using (
  exists (
    select 1
    from public.care_memberships m
    where m.organization_id = organizations.id
      and m.user_id = auth.uid()
  )
);

create index if not exists care_circle_invites_token_idx on public.care_circle_invites(token);
create index if not exists care_circle_invites_recipient_idx on public.care_circle_invites(care_recipient_id);
