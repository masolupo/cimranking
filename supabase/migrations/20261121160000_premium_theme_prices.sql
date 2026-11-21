-- Nuova scala dei temi premium: Neon il più raro/costoso, poi Aurora.
update public.shop_items set price = 300 where slug = 'tema-neon';
update public.shop_items set price = 200 where slug = 'tema-aurora';

-- Tema "Reale" tolto dal negozio: chi l'aveva comprato riceve indietro il prezzo pieno
-- e torna al tema predefinito (l'oggetto viene rimosso dal suo inventario).
with reale as (
  select id, price from public.shop_items where slug = 'tema-reale'
),
owners as (
  select ui.user_id, r.id as item_id, r.price
  from public.user_items ui
  join reale r on r.id = ui.item_id
),
refund as (
  update public.profiles p
  set coins = p.coins + o.price
  from owners o
  where p.id = o.user_id
  returning p.id
)
insert into public.coin_transactions (user_id, amount, reason, item_id)
select o.user_id, o.price, 'refund', o.item_id from owners o;

delete from public.user_items
where item_id = (select id from public.shop_items where slug = 'tema-reale');

update public.shop_items set active = false where slug = 'tema-reale';
