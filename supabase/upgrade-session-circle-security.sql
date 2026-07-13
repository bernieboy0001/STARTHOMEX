alter table public.care_memberships
  add column if not exists care_recipient_id uuid references public.care_recipients(id) on delete cascade;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'care_memberships_organization_id_care_recipient_id_user_id_key'
  ) then
    alter table public.care_memberships
      add constraint care_memberships_organization_id_care_recipient_id_user_id_key
      unique (organization_id, care_recipient_id, user_id);
  end if;
end $$;

create table if not exists public.care_circle_invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  care_recipient_id uuid not null references public.care_recipients(id) on delete cascade,
  invited_email text,
  role app_role not null default 'family_member',
  created_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

alter table public.care_circle_invites
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists accepted_by uuid references auth.users(id) on delete set null,
  add column if not exists accepted_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists expires_at timestamptz not null default (now() + interval '14 days');

create index if not exists care_memberships_user_idx on public.care_memberships(user_id);
create index if not exists care_memberships_recipient_idx on public.care_memberships(care_recipient_id);
create index if not exists care_circle_invites_token_idx on public.care_circle_invites(token);
create index if not exists care_circle_invites_recipient_idx on public.care_circle_invites(care_recipient_id);
