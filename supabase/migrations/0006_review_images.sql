-- Photo attachments on reviews (up to 3 per review).
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Requires 0005_reviews.sql.

alter table public.reviews add column if not exists images text[] not null default '{}';

-- Only allow links to files in our own review-images bucket (stops a guest pointing a review at someone else's image).
create or replace function public.valid_review_images(p_images text[]) returns boolean
language sql immutable
as $$
  select cardinality(p_images) <= 3
     and not exists (
       select 1 from unnest(p_images) i
       where i not like 'https://%/storage/v1/object/public/review-images/%'
     );
$$;

alter table public.reviews drop constraint if exists reviews_images_valid;
alter table public.reviews add constraint reviews_images_valid check (public.valid_review_images(images));

-- Visitors may read the images of approved reviews (the existing row policy already limits them to approved rows).
grant select (images) on public.reviews to anon;

-- Storage bucket: public links, small JPEG/PNG/WebP files only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-images', 'review-images', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Anyone can upload to this bucket (guests write reviews too); only admins can list or delete files.
drop policy if exists "Anyone can upload review images" on storage.objects;
create policy "Anyone can upload review images" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'review-images');

drop policy if exists "Admins manage review images" on storage.objects;
create policy "Admins manage review images" on storage.objects
  for all to authenticated
  using (bucket_id = 'review-images' and public.is_admin())
  with check (bucket_id = 'review-images' and public.is_admin());
