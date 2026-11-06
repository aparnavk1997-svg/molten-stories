-- Customer profiles + a real admin list.
--
-- !! RUN THIS BEFORE you enable "Allow new users to sign up" in Supabase.
-- !! Step 1: replace YOUR_ADMIN_EMAIL_HERE below with the email of your existing admin user.
--
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It runs as one transaction: if the admin email is not found, nothing is changed.

-- ---------------------------------------------------------------------------
-- 1. Admins. Product writes used to be allowed for ANY signed-in user; once customers
--    can sign up that would let them edit the catalogue, so it is now restricted to this list.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;  -- no policies: only is_admin() below reads it

do $$
declare
  admin_email text := 'YOUR_ADMIN_EMAIL_HERE';   -- <-- EDIT THIS
begin
  insert into public.admins (user_id)
  select id from auth.users where lower(email) = lower(admin_email)
  on conflict do nothing;

  if not exists (select 1 from public.admins) then
    raise exception 'No admin user found for "%". Edit admin_email at the top of this script and run it again.', admin_email;
  end if;
end $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins where user_id = auth.uid()); $$;

grant execute on function public.is_admin() to anon, authenticated;

-- Replace the "any signed-in user" policies from 0001 with admin-only ones.
drop policy if exists "Admins read all products" on public.products;
drop policy if exists "Admins write products" on public.products;
create policy "Admins read all products" on public.products
  for select to authenticated using (public.is_admin());
create policy "Admins write products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage product images" on storage.objects;
create policy "Admins manage product images" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Customer profiles (one row per auth user).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text not null,
  full_name  text not null default '',
  phone      text not null default '',
  street     text not null default '',
  city       text not null default '',
  state      text not null default '',
  pin        text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,20}$'),
  constraint phone_format check (phone = '' or phone ~ '^[0-9]{10}$'),
  constraint pin_format check (pin = '' or pin ~ '^[0-9]{6}$')
);
create unique index if not exists profiles_username_key on public.profiles (lower(username));

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "Users create own profile" on public.profiles;
create policy "Users create own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Create the profile automatically when someone signs up (username etc. come from sign-up metadata).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, full_name, phone)
  values (
    new.id,
    lower(coalesce(new.raw_user_meta_data ->> 'username', '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Username helpers used by the sign-up / login forms.
-- ---------------------------------------------------------------------------
create or replace function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = ''
as $$ select not exists (select 1 from public.profiles where lower(username) = lower(p_username)); $$;

-- Lets someone log in with a username: returns the email behind it.
-- Trade-off: anyone who knows a username can look up that account's email address.
create or replace function public.email_for_username(p_username text) returns text
language sql stable security definer set search_path = ''
as $$
  select u.email::text
  from public.profiles p join auth.users u on u.id = p.id
  where lower(p.username) = lower(p_username);
$$;

grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.email_for_username(text) to anon, authenticated;
