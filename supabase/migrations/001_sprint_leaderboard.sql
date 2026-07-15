-- AMO Sprint leaderboard table
-- Run in Supabase SQL Editor after creating your project.

create table if not exists public.sprint_leaderboard (
  id uuid primary key default gen_random_uuid(),
  alias text not null check (char_length(trim(alias)) between 1 and 20),
  score int not null check (score >= 0),
  correct_count int not null default 0 check (correct_count >= 0),
  time_taken_seconds int not null check (time_taken_seconds >= 0),
  mode text not null default 'MULTIPLICATION',
  created_at timestamptz not null default now()
);

create index if not exists sprint_leaderboard_rank_idx
  on public.sprint_leaderboard (correct_count desc, score desc, created_at desc);

alter table public.sprint_leaderboard enable row level security;

create policy "public read sprint leaderboard"
  on public.sprint_leaderboard for select using (true);

create policy "public insert sprint leaderboard"
  on public.sprint_leaderboard for insert with check (true);
