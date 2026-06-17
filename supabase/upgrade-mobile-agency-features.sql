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

create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

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

alter table public.reminders enable row level security;
alter table public.notification_subscriptions enable row level security;
alter table public.care_extractions enable row level security;

drop policy if exists "members can read reminders" on public.reminders;
create policy "members can read reminders" on public.reminders for select using (
  exists (
    select 1 from public.care_memberships m
    where m.care_recipient_id = reminders.care_recipient_id
    and m.user_id = auth.uid()
  )
);

drop policy if exists "members can insert reminders" on public.reminders;
create policy "members can insert reminders" on public.reminders for insert with check (
  exists (
    select 1 from public.care_memberships m
    where m.care_recipient_id = reminders.care_recipient_id
    and m.user_id = auth.uid()
  )
);

drop policy if exists "members can update reminders" on public.reminders;
create policy "members can update reminders" on public.reminders for update using (
  exists (
    select 1 from public.care_memberships m
    where m.care_recipient_id = reminders.care_recipient_id
    and m.user_id = auth.uid()
  )
);

drop policy if exists "users manage own subscriptions" on public.notification_subscriptions;
create policy "users manage own subscriptions" on public.notification_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "members can read extractions" on public.care_extractions;
create policy "members can read extractions" on public.care_extractions for select using (
  exists (
    select 1 from public.care_memberships m
    where m.care_recipient_id = care_extractions.care_recipient_id
    and m.user_id = auth.uid()
  )
);

drop policy if exists "members can insert extractions" on public.care_extractions;
create policy "members can insert extractions" on public.care_extractions for insert with check (
  exists (
    select 1 from public.care_memberships m
    where m.care_recipient_id = care_extractions.care_recipient_id
    and m.user_id = auth.uid()
  )
);
