-- Single-row counter table
create table if not exists public.visits (
  id integer primary key default 1,
  total_count bigint not null default 0
);
insert into public.visits (id, total_count)
  values (1, 0)
  on conflict (id) do nothing;

-- Atomic increment (avoids race conditions under concurrent hits)
create or replace function public.increment_visits()
returns void
language sql
as $$
  update public.visits set total_count = total_count + 1 where id = 1;
$$;

-- RLS: allow the public anon key to READ only
alter table public.visits enable row level security;

drop policy if exists "Allow public read" on public.visits;
create policy "Allow public read"
  on public.visits for select
  using (true);
