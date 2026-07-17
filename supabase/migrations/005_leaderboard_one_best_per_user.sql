-- One leaderboard row per user: keep personal best (correct_count, then score).

-- Remove duplicate authenticated rows, keeping the best per user_id.
delete from public.sprint_leaderboard a
using public.sprint_leaderboard b
where a.user_id is not null
  and a.user_id = b.user_id
  and (
    a.correct_count < b.correct_count
    or (a.correct_count = b.correct_count and a.score < b.score)
    or (
      a.correct_count = b.correct_count
      and a.score = b.score
      and a.created_at < b.created_at
    )
    or (
      a.correct_count = b.correct_count
      and a.score = b.score
      and a.created_at = b.created_at
      and a.id < b.id
    )
  );

-- Remove duplicate legacy rows (no user_id), keeping the best per alias.
delete from public.sprint_leaderboard a
using public.sprint_leaderboard b
where a.user_id is null
  and b.user_id is null
  and lower(trim(a.alias)) = lower(trim(b.alias))
  and (
    a.correct_count < b.correct_count
    or (a.correct_count = b.correct_count and a.score < b.score)
    or (
      a.correct_count = b.correct_count
      and a.score = b.score
      and a.created_at < b.created_at
    )
    or (
      a.correct_count = b.correct_count
      and a.score = b.score
      and a.created_at = b.created_at
      and a.id < b.id
    )
  );

create unique index if not exists sprint_leaderboard_user_unique
  on public.sprint_leaderboard (user_id)
  where user_id is not null;

create or replace function public.upsert_sprint_leaderboard_best(
  p_alias text,
  p_score int,
  p_correct_count int,
  p_time_taken_seconds int,
  p_mode text default 'MULTIPLICATION'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing public.sprint_leaderboard;
  result public.sprint_leaderboard;
  alias_clean text := trim(p_alias);
  was_improved boolean := false;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if alias_clean is null or char_length(alias_clean) < 1 then
    raise exception 'Alias is required';
  end if;

  if char_length(alias_clean) > 20 then
    raise exception 'Alias must be 20 characters or fewer';
  end if;

  select *
  into existing
  from public.sprint_leaderboard
  where user_id = uid
  limit 1;

  if existing.id is null then
    insert into public.sprint_leaderboard (
      alias,
      score,
      correct_count,
      time_taken_seconds,
      mode,
      user_id
    )
    values (
      alias_clean,
      greatest(0, coalesce(p_score, 0)),
      greatest(0, coalesce(p_correct_count, 0)),
      greatest(0, coalesce(p_time_taken_seconds, 0)),
      coalesce(nullif(trim(p_mode), ''), 'MULTIPLICATION'),
      uid
    )
    returning * into result;
    was_improved := true;
  elsif (
    greatest(0, coalesce(p_correct_count, 0)),
    greatest(0, coalesce(p_score, 0))
  ) > (existing.correct_count, existing.score) then
    update public.sprint_leaderboard
    set
      alias = alias_clean,
      score = greatest(0, coalesce(p_score, 0)),
      correct_count = greatest(0, coalesce(p_correct_count, 0)),
      time_taken_seconds = greatest(0, coalesce(p_time_taken_seconds, 0)),
      mode = coalesce(nullif(trim(p_mode), ''), existing.mode),
      created_at = now()
    where user_id = uid
    returning * into result;
    was_improved := true;
  else
    result := existing;
  end if;

  return jsonb_build_object(
    'improved', was_improved,
    'row', to_jsonb(result)
  );
end;
$$;

revoke all on function public.upsert_sprint_leaderboard_best(text, int, int, int, text) from public;
grant execute on function public.upsert_sprint_leaderboard_best(text, int, int, int, text) to authenticated;
