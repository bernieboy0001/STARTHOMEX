alter table public.tasks
add column if not exists completed_by uuid references auth.users(id),
add column if not exists completed_by_name text;

create index if not exists tasks_completed_by_idx on public.tasks(completed_by);
