alter table public.audit_events
add column if not exists actor_name text,
add column if not exists summary text;

drop policy if exists "members read audit events" on public.audit_events;
create policy "members read audit events" on public.audit_events
for select using (public.is_care_member(care_recipient_id));

create index if not exists audit_events_recipient_created_idx on public.audit_events(care_recipient_id, created_at desc);
create index if not exists medications_recipient_active_idx on public.medications(care_recipient_id, active);
create index if not exists visits_recipient_starts_idx on public.visits(care_recipient_id, starts_at);
create index if not exists documents_recipient_created_idx on public.documents(care_recipient_id, created_at desc);
create index if not exists contacts_recipient_role_idx on public.contacts(care_recipient_id, role);
