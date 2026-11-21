-- =====================================================================
-- Rivendita degli oggetti: si riceve metà del prezzo (arrotondato per difetto)
-- =====================================================================

alter table public.coin_transactions drop constraint coin_transactions_reason_check;
alter table public.coin_transactions
  add constraint coin_transactions_reason_check
  check (reason in ('win', 'participation', 'purchase', 'refund', 'sale'));

create function public.sell_item(p_item_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_price int;
  v_refund int;
begin
  if v_uid is null then
    raise exception 'Devi essere loggato';
  end if;

  select si.price into v_price
  from public.user_items ui
  join public.shop_items si on si.id = ui.item_id
  where ui.user_id = v_uid and ui.item_id = p_item_id
  for update of ui;

  if not found then
    raise exception 'Non possiedi questo oggetto';
  end if;
  if v_price = 0 then
    raise exception 'Gli oggetti gratuiti non si possono vendere';
  end if;

  v_refund := v_price / 2;

  delete from public.user_items where user_id = v_uid and item_id = p_item_id;
  update public.profiles set coins = coins + v_refund where id = v_uid;
  insert into public.coin_transactions (user_id, amount, reason, item_id)
  values (v_uid, v_refund, 'sale', p_item_id);

  return v_refund;
end;
$$;

revoke execute on function public.sell_item(uuid) from public, anon;
grant execute on function public.sell_item(uuid) to authenticated;
