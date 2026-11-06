-- Customer checkout: the site creates the order (and its ID) when a customer taps "order on WhatsApp".
-- Run in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Requires 0001, 0002 and 0003 to have been run first.

-- ---------------------------------------------------------------------------
-- 1. Orders need to hold gift boxes, know where they came from, and start as "placed".
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists hampers   jsonb   not null default '[]';
alter table public.orders add column if not exists gift_wrap boolean not null default false;
alter table public.orders add column if not exists source    text    not null default 'admin';

-- Replace the old checks (items must be non-empty; fixed status list) with versions that allow
-- gift-box-only orders and the new "placed" status. Found by definition so the auto-generated names don't matter.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.orders'::regclass and contype = 'c'
      and (pg_get_constraintdef(oid) like '%jsonb_array_length(items)%'
           or pg_get_constraintdef(oid) like '%status%'
           or pg_get_constraintdef(oid) like '%source%')
  loop
    execute format('alter table public.orders drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.orders add constraint orders_has_content
  check (jsonb_typeof(items) = 'array' and jsonb_typeof(hampers) = 'array'
         and jsonb_array_length(items) + jsonb_array_length(hampers) > 0);
alter table public.orders add constraint orders_status_check
  check (status in ('placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'));
alter table public.orders add constraint orders_source_check
  check (source in ('admin', 'customer'));

-- ---------------------------------------------------------------------------
-- 2. place_order: called by the website at checkout (guests and signed-in customers).
--    Prices and delivery are recalculated here from the products table, so a customer
--    can't change what they pay by editing the request.
--    Keep the numbers below in step with src/utils/pricing.js.
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_items     jsonb,     -- [{ "id": 1, "qty": 2 }]
  p_hampers   jsonb,     -- [{ "items": [{ "id": 1, "qty": 2 }], "note": "..." }]
  p_gift_wrap boolean,
  p_gift_note text,
  p_name      text,
  p_phone     text,
  p_street    text,
  p_city      text,
  p_state     text,
  p_pin       text
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  c_gift_wrap   constant numeric := 30;    -- GIFT_WRAP_PRICE
  c_gift_box    constant numeric := 100;   -- GIFT_BOX_PRICE
  c_free_over   constant numeric := 999;   -- FREE_DELIVERY_MIN
  v_items       jsonb := '[]';
  v_hampers     jsonb := '[]';
  v_hitems      jsonb;
  v_hamper      jsonb;
  v_line        record;
  v_prod        record;
  v_candles     numeric := 0;
  v_wrap        numeric := 0;
  v_packaging   numeric := 0;
  v_zone_charge numeric;
  v_fee         numeric;
  v_pin_n       int;
  v_notes       text;
  v_username    text;
  v_row         public.orders;
begin
  p_items   := coalesce(p_items, '[]');
  p_hampers := coalesce(p_hampers, '[]');

  if jsonb_typeof(p_items) <> 'array' or jsonb_typeof(p_hampers) <> 'array' then
    raise exception 'Invalid order';
  end if;
  if jsonb_array_length(p_items) + jsonb_array_length(p_hampers) = 0 then
    raise exception 'Your bag is empty';
  end if;
  if jsonb_array_length(p_items) > 50 or jsonb_array_length(p_hampers) > 10 then
    raise exception 'That order is too large to place online';
  end if;
  if p_pin is null or p_pin !~ '^[1-9][0-9]{5}$' then
    raise exception 'Enter a valid 6-digit PIN code';
  end if;

  -- Individual candles.
  for v_line in
    select (e ->> 'id')::bigint as id, (e ->> 'qty')::int as qty from jsonb_array_elements(p_items) e
  loop
    if v_line.qty is null or v_line.qty < 1 or v_line.qty > 20 then raise exception 'Invalid quantity'; end if;
    select p.id, p.name, p.price into v_prod from public.products p where p.id = v_line.id and not p.disabled;
    if not found then raise exception 'A candle in your bag is no longer available'; end if;
    v_items := v_items || jsonb_build_object('id', v_prod.id, 'name', v_prod.name, 'price', v_prod.price, 'qty', v_line.qty);
    v_candles := v_candles + v_prod.price * v_line.qty;
  end loop;

  -- Custom gift boxes.
  for v_hamper in select e from jsonb_array_elements(p_hampers) e loop
    v_hitems := '[]';
    for v_line in
      select (h ->> 'id')::bigint as id, (h ->> 'qty')::int as qty
      from jsonb_array_elements(coalesce(v_hamper -> 'items', '[]')) h
    loop
      if v_line.qty is null or v_line.qty < 1 or v_line.qty > 20 then raise exception 'Invalid quantity'; end if;
      select p.id, p.name, p.price into v_prod from public.products p where p.id = v_line.id and not p.disabled;
      if not found then raise exception 'A candle in your gift box is no longer available'; end if;
      v_hitems := v_hitems || jsonb_build_object('id', v_prod.id, 'name', v_prod.name, 'price', v_prod.price, 'qty', v_line.qty);
      v_candles := v_candles + v_prod.price * v_line.qty;
    end loop;
    if jsonb_array_length(v_hitems) = 0 then raise exception 'A gift box is empty'; end if;
    v_hampers := v_hampers || jsonb_build_object(
      'items', v_hitems, 'note', left(coalesce(v_hamper ->> 'note', ''), 200), 'packaging', c_gift_box);
    v_packaging := v_packaging + c_gift_box;
  end loop;

  if coalesce(p_gift_wrap, false) and jsonb_array_length(v_items) > 0 then v_wrap := c_gift_wrap; end if;

  -- Delivery: zone by PIN (Kochi 682xxx, Kerala 670-695, rest of India; Lakshadweep is "India"), free over the limit.
  v_pin_n := p_pin::int;
  v_zone_charge := case
    when v_pin_n between 682551 and 682559 then 120
    when v_pin_n / 1000 = 682 then 40
    when v_pin_n / 1000 between 670 and 695 then 70
    else 120
  end;
  v_fee := case when v_candles >= c_free_over then 0 else v_zone_charge end;

  v_notes := case when coalesce(trim(p_gift_note), '') = '' then '' else 'Gift message: ' || left(trim(p_gift_note), 200) end;
  select pr.username into v_username from public.profiles pr where pr.id = auth.uid();

  insert into public.orders (
    user_id, username, customer_name, phone, street, city, state, pin,
    items, hampers, gift_wrap, subtotal, delivery_fee, total, notes, status, source
  ) values (
    auth.uid(), coalesce(v_username, 'GUEST'),
    left(trim(coalesce(p_name, '')), 100), trim(coalesce(p_phone, '')),
    left(trim(coalesce(p_street, '')), 200), left(trim(coalesce(p_city, '')), 60),
    left(trim(coalesce(p_state, '')), 60), p_pin,
    v_items, v_hampers, v_wrap > 0,
    v_candles + v_wrap + v_packaging, v_fee, v_candles + v_wrap + v_packaging + v_fee,
    v_notes, 'placed', 'customer'
  ) returning * into v_row;

  return jsonb_build_object('code', v_row.code, 'total', v_row.total, 'delivery_fee', v_row.delivery_fee);
end;
$$;

grant execute on function public.place_order(jsonb, jsonb, boolean, text, text, text, text, text, text, text)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Tracking now also lists gift boxes (still no address or phone).
-- ---------------------------------------------------------------------------
create or replace function public.track_order(p_code text) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'code', o.code,
    'status', o.status,
    'status_log', o.status_log,
    'created_at', o.created_at,
    'total', o.total,
    'items',
      (select coalesce(jsonb_agg(jsonb_build_object('name', i ->> 'name', 'qty', i -> 'qty')), '[]'::jsonb)
       from jsonb_array_elements(o.items) i)
      ||
      (select coalesce(jsonb_agg(jsonb_build_object('name', 'Custom gift box', 'qty', 1)), '[]'::jsonb)
       from jsonb_array_elements(o.hampers) h)
  )
  from public.orders o
  where o.code = upper(trim(p_code));
$$;

grant execute on function public.track_order(text) to anon, authenticated;
