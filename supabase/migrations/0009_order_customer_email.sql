-- Lets an admin look up the email address of the customer who placed an order, so the
-- "your order is confirmed" email can be sent when the order moves from Placed to Confirmed.
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Requires 0002 and 0003 to have been run first.
--
-- Orders only store a phone number; the email lives in auth.users and is linked through orders.user_id.
-- Guest orders have no user_id, so this returns null for them (no email can be sent).
-- Admin-only: anyone else gets an error, so it can't be used to look up customers' emails.

create or replace function public.order_customer_email(p_code text) returns text
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  return (
    select u.email::text
    from public.orders o
    join auth.users u on u.id = o.user_id
    where o.code = upper(trim(p_code))
  );
end;
$$;

revoke execute on function public.order_customer_email(text) from public, anon;
grant execute on function public.order_customer_email(text) to authenticated;
