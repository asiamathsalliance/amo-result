-- Add correct answer count for leaderboard display and ranking.
alter table public.sprint_leaderboard
  add column if not exists correct_count int not null default 0 check (correct_count >= 0);

create index if not exists sprint_leaderboard_correct_idx
  on public.sprint_leaderboard (correct_count desc, score desc, created_at desc);
