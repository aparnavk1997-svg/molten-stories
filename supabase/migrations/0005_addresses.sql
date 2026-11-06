-- Extra saved delivery addresses per customer.
-- The primary shipping address stays on public.profiles (street, city, state, pin); this table holds the others.
-- Safe to run more than once, including on a project that ran an earlier version of this file.

create table if not exists public.addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  label      text not null default '',
  full_name  text not null,
  phone      text not null,
  street     text not null,
  city       text not null,
  state      text not null,
  pin        text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint addresses_phone_format check (phone ~ '^[0-9]{10}$'),
  constraint addresses_pin_format check (pin ~ '^[0-9]{6}$'),
  constraint addresses_label_len check (char_length(label) <= 30)
);

-- Clean up from an earlier version that had a default flag.
drop function if exists public.set_default_address(uuid);
drop index if exists public.addresses_one_default;
alter table public.addresses drop column if exists is_default;

create index if not exists addresses_user_idx on public.addresses (user_id);

drop trigger if exists addresses_updated_at on public.addresses;
create trigger addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

alter table public.addresses enable row level security;

drop policy if exists "Users read own addresses" on public.addresses;
create policy "Users read own addresses" on public.addresses
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "Users add own addresses" on public.addresses;
create policy "Users add own addresses" on public.addresses
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Users update own addresses" on public.addresses;
create policy "Users update own addresses" on public.addresses
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users delete own addresses" on public.addresses;
create policy "Users delete own addresses" on public.addresses
  for delete to authenticated using (user_id = auth.uid());

-- Make the API pick up the new table immediately.
notify pgrst, 'reload schema';
