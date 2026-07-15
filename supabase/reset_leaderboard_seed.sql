-- Reset sprint leaderboard and seed demo entries.
-- Run in Supabase SQL Editor (Dashboard → SQL → New query).

-- Allow public deletes (needed for reset via API in dev)
drop policy if exists "public delete sprint leaderboard" on public.sprint_leaderboard;
create policy "public delete sprint leaderboard"
  on public.sprint_leaderboard for delete using (true);

truncate table public.sprint_leaderboard restart identity;

insert into public.sprint_leaderboard (alias, score, correct_count, time_taken_seconds, mode, created_at) values
  ('Alex Chen',   142, 18, 60, 'MULTIPLICATION', now() - interval '12 minutes'),
  ('Maya Patel',  128, 16, 60, 'MULTIPLICATION', now() - interval '28 minutes'),
  ('Ryan Kim',    115, 15, 60, 'MULTIPLICATION', now() - interval '1 hour'),
  ('Sophie Lee',   98, 13, 60, 'MULTIPLICATION', now() - interval '2 hours'),
  ('James Wong',   87, 11, 60, 'MULTIPLICATION', now() - interval '5 hours'),
  ('Emma Tan',     76, 10, 60, 'MULTIPLICATION', now() - interval '8 hours'),
  ('Noah Singh',   64,  9, 60, 'MULTIPLICATION', now() - interval '1 day'),
  ('Lily Nguyen',  52,  7, 60, 'MULTIPLICATION', now() - interval '2 days'),
  ('Ethan Park',   41,  6, 60, 'MULTIPLICATION', now() - interval '3 days'),
  ('Chloe Ho',     28,  4, 60, 'MULTIPLICATION', now() - interval '5 days');
