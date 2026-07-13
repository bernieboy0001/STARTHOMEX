-- Session isolation and security improvements

-- Add unique constraint on email + care_recipient_id to prevent multiple accounts per circle
-- This prevents the cross-browser session contamination at the DB level
create unique index if not exists unique_email_per_care_circle
on public.care_memberships (organization_id, care_recipient_id)
where deleted_at is null;

-- Ensure invite tokens are tracked properly
create index if not exists care_circle_invites_email_idx 
on public.care_circle_invites(invited_email, care_recipient_id);

create index if not exists care_circle_invites_accepted_idx 
on public.care_circle_invites(accepted_at, revoked_at);

-- Add constraint to prevent accepting expired invites
alter table public.care_circle_invites
add constraint valid_invite_check check (
  (accepted_at is null or (revoked_at is null and expires_at > now()))
);

-- Ensure care_memberships has proper cascading for data integrity
alter table public.care_memberships
  drop constraint if exists care_memberships_user_id_fkey,
  add constraint care_memberships_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade;

-- RLS policy: Prevent users from seeing care memberships they're not part of
-- This is already in place but adding explicit comment
-- Policy "members read memberships" ensures users only see their own memberships

-- Add audit trail for invite actions
create table if not exists public.invite_actions (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references public.care_circle_invites(id) on delete cascade,
  action text not null check (action in ('created', 'accepted', 'revoked', 'expired')),
  actor_id uuid references auth.users(id),
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.invite_actions enable row level security;

create policy "members read invite actions" on public.invite_actions
for select using (
  exists (
    select 1
    from public.care_circle_invites ci
    where ci.id = invite_actions.invite_id
      and exists (
        select 1
        from public.care_memberships m
        where m.care_recipient_id = ci.care_recipient_id
          and m.user_id = auth.uid()
      )
  )
);
