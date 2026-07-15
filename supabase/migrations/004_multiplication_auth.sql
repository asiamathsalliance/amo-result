-- Google sign-in profiles for the multiplication sprint game.

create table if not exists public.multiplication_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  username text not null,
  country text not null default '',
  grade text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint multiplication_profiles_username_len
    check (char_length(trim(username)) between 1 and 20)
);

create unique index if not exists multiplication_profiles_username_unique_idx
  on public.multiplication_profiles (lower(trim(username)));

alter table public.multiplication_profiles enable row level security;

drop policy if exists "profiles public read" on public.multiplication_profiles;
create policy "profiles public read"
  on public.multiplication_profiles for select using (true);

drop policy if exists "profiles insert own" on public.multiplication_profiles;
create policy "profiles insert own"
  on public.multiplication_profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.multiplication_profiles;
create policy "profiles update own"
  on public.multiplication_profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles delete own" on public.multiplication_profiles;
create policy "profiles delete own"
  on public.multiplication_profiles for delete
  using (auth.uid() = id);

-- Auto-create profile row when a user signs up with Google.
create or replace function public.handle_new_multiplication_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := left(
    regexp_replace(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        split_part(coalesce(new.email, ''), '@', 1)
      ),
      '[^a-zA-Z0-9 _-]',
      '',
      'g'
    ),
    20
  );

  if base_username = '' then
    base_username := 'player';
  end if;

  final_username := base_username;

  while exists (
    select 1 from public.multiplication_profiles
    where lower(trim(username)) = lower(trim(final_username))
  ) loop
    suffix := suffix + 1;
    final_username := left(base_username, 17) || suffix::text;
  end loop;

  insert into public.multiplication_profiles (id, email, username, avatar_url)
  values (
    new.id,
    new.email,
    final_username,
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do update set
    email = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, public.multiplication_profiles.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_multiplication on auth.users;
create trigger on_auth_user_created_multiplication
  after insert on auth.users
  for each row execute function public.handle_new_multiplication_user();

-- Link leaderboard rows to authenticated users.
alter table public.sprint_leaderboard
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists sprint_leaderboard_user_idx
  on public.sprint_leaderboard (user_id, created_at desc);

drop policy if exists "public insert sprint leaderboard" on public.sprint_leaderboard;
drop policy if exists "authenticated insert sprint leaderboard" on public.sprint_leaderboard;

create policy "authenticated insert sprint leaderboard"
  on public.sprint_leaderboard for insert to authenticated
  with check (auth.uid() = user_id);

-- Let signed-in users remove their own account (profile + auth user).
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
