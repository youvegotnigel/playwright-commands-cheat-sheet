-- Per-command open counter (one row per command, created on first open)
create table if not exists public.command_views (
  command_id text primary key,
  view_count bigint not null default 0
);

-- Atomic upsert-increment: first open inserts the row, later opens add 1
create or replace function public.increment_command_view(cmd_id text)
returns void
language sql
as $$
  insert into public.command_views (command_id, view_count)
  values (cmd_id, 1)
  on conflict (command_id)
  do update set view_count = public.command_views.view_count + 1;
$$;

-- RLS: allow the public anon key to READ only (writes go through the
-- Edge Function's service-role key, never the client)
alter table public.command_views enable row level security;
drop policy if exists "Allow public read" on public.command_views;
create policy "Allow public read"
  on public.command_views for select
  using (true);
