-- Every new review automatically gets the next position: 1, 2, 3 ...
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Requires 0005 and 0007.

-- Hands out max(position) + 1. Runs with full access so disabled reviews' positions are counted too.
create or replace function public.reviews_assign_position() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(7001);   -- two reviews arriving together still get different numbers
  select coalesce(max(r.sort_order), 0) + 1 into new.sort_order
  from public.reviews r
  where r.sort_order < 999;
  return new;
end;
$$;

drop trigger if exists reviews_assign_position on public.reviews;
create trigger reviews_assign_position before insert on public.reviews
  for each row execute function public.reviews_assign_position();

-- The position is now always chosen by the trigger, so the sign-up rule no longer needs to check it.
drop policy if exists "Anyone can submit a review" on public.reviews;
create policy "Anyone can submit a review" on public.reviews
  for insert to anon, authenticated
  with check (status = 'approved' and (user_id is null or user_id = auth.uid()));

-- Number the reviews that were saved before this (they were all "last"), oldest first.
with ranked as (
  select id,
         row_number() over (order by created_at, id)
           + coalesce((select max(sort_order) from public.reviews where sort_order < 999), 0) as pos
  from public.reviews
  where sort_order = 999
)
update public.reviews r set sort_order = ranked.pos from ranked where r.id = ranked.id;
