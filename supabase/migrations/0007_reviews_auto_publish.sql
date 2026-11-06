-- New reviews are published immediately ("approved" = shown on the site). Admins can still Disable any review afterwards.
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Requires 0005_reviews.sql.

alter table public.reviews alter column status set default 'approved';

-- Guests and customers may now submit reviews as approved (still never as anything else, and never with a chosen position).
drop policy if exists "Anyone can submit a review" on public.reviews;
create policy "Anyone can submit a review" on public.reviews
  for insert to anon, authenticated
  with check (status = 'approved' and sort_order = 999 and (user_id is null or user_id = auth.uid()));

-- To go back to approving reviews first, set the default back to 'pending' and use status = 'pending' in the policy above.
