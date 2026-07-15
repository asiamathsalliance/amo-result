-- Allow leaderboard reset via REST API (dev/demo).
drop policy if exists "public delete sprint leaderboard" on public.sprint_leaderboard;
create policy "public delete sprint leaderboard"
  on public.sprint_leaderboard for delete using (true);
