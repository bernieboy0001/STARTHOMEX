-- CRITICAL FIX: Care Circle Session Isolation
-- This ensures users can only see/edit data for the SELECTED care circle
-- The problem: RLS policies didn't restrict by selected care recipient

-- Add session variable to track selected care recipient
create or replace function public.get_selected_care_recipient() 
returns uuid as $$
  select nullif(current_setting('app.selected_care_recipient', true), '')::uuid;
$$ language sql stable;

-- Update all RLS policies to check BOTH membership AND selected care recipient
drop policy if exists "members read tasks" on public.tasks;
create policy "members read tasks" on public.tasks 
  for select using (
    public.is_care_member(care_recipient_id) 
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "members create tasks" on public.tasks;
create policy "members create tasks" on public.tasks 
  for insert with check (
    public.is_care_member(care_recipient_id)
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "members update tasks" on public.tasks;
create policy "members update tasks" on public.tasks 
  for update using (
    public.is_care_member(care_recipient_id)
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "members read medications" on public.medications;
create policy "members read medications" on public.medications 
  for select using (
    public.is_care_member(care_recipient_id)
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "authorized manage medications" on public.medications;
create policy "authorized manage medications" on public.medications
  for all using (
    public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator','clinician']::app_role[])
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "members read visits" on public.visits;
create policy "members read visits" on public.visits 
  for select using (
    public.is_care_member(care_recipient_id)
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "members manage visits" on public.visits;
create policy "members manage visits" on public.visits 
  for all using (
    public.is_care_member(care_recipient_id)
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "members read shifts" on public.care_shifts;
create policy "members read shifts" on public.care_shifts 
  for select using (
    public.is_care_member(care_recipient_id)
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "authorized manage shifts" on public.care_shifts;
create policy "authorized manage shifts" on public.care_shifts
  for all using (
    public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator','home_aide']::app_role[])
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "members read notes" on public.care_notes;
create policy "members read notes" on public.care_notes
  for select using (
    public.is_care_member(care_recipient_id) 
    and (visible_to_family or author_id = auth.uid())
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "members create notes" on public.care_notes;
create policy "members create notes" on public.care_notes 
  for insert with check (
    public.is_care_member(care_recipient_id)
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "members read contacts" on public.contacts;
create policy "members read contacts" on public.contacts 
  for select using (
    public.is_care_member(care_recipient_id)
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "leads manage contacts" on public.contacts;
create policy "leads manage contacts" on public.contacts
  for all using (
    public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator']::app_role[])
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "members read documents" on public.documents;
create policy "members read documents" on public.documents 
  for select using (
    public.is_care_member(care_recipient_id)
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "members upload documents" on public.documents;
create policy "members upload documents" on public.documents 
  for insert with check (
    public.is_care_member(care_recipient_id)
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "members read discharge plans" on public.discharge_plans;
create policy "members read discharge plans" on public.discharge_plans
  for select using (
    public.is_care_member(care_recipient_id)
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "authorized manage discharge plans" on public.discharge_plans;
create policy "authorized manage discharge plans" on public.discharge_plans
  for all using (
    public.has_care_role(care_recipient_id, array['family_lead','agency_coordinator','clinician']::app_role[])
    and care_recipient_id = public.get_selected_care_recipient()
  );

drop policy if exists "members read audit events" on public.audit_events;
create policy "members read audit events" on public.audit_events
  for select using (
    public.is_care_member(care_recipient_id)
    and care_recipient_id = public.get_selected_care_recipient()
  );
