-- =====================================================================
-- Eliminare una partita storna SEMPRE tutte le monete che aveva dato,
-- anche se nel frattempo sono state spese: il saldo può andare in negativo
-- e si ripaga con le partite successive (in negativo non si compra nulla,
-- buy_item controlla già che le monete bastino).
--
-- Prima lo storno si fermava a 0 e chi aveva già speso le monete
-- ci guadagnava: il saldo non corrispondeva più allo storico.
-- =====================================================================

alter table public.profiles drop constraint profiles_coins_check;

create or replace function public.delete_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_tx record;
begin
  if v_uid is null then
    raise exception 'Devi essere loggato';
  end if;

  if not exists (select 1 from public.profiles where id = v_uid and is_admin) then
    raise exception 'Solo un admin può eliminare le partite';
  end if;

  if not exists (select 1 from public.matches where id = p_match_id) then
    raise exception 'Partita non trovata';
  end if;

  -- storna tutte le monete guadagnate con la partita
  for v_tx in
    select user_id, sum(amount)::int as amount
    from public.coin_transactions
    where match_id = p_match_id and reason in ('win', 'participation')
    group by user_id
  loop
    update public.profiles set coins = coins - v_tx.amount where id = v_tx.user_id;
    insert into public.coin_transactions (user_id, amount, reason)
    values (v_tx.user_id, -v_tx.amount, 'refund');
  end loop;

  delete from public.matches where id = p_match_id;
end;
$$;

-- Riallinea i saldi allo storico: gli storni fermati a 0 avevano lasciato
-- monete in più (masolupo: 10 invece di 5). La differenza diventa un
-- movimento 'refund', così saldo e storico tornano a coincidere.
with diff as (
  select p.id, p.coins - coalesce(sum(t.amount), 0)::int as extra
  from public.profiles p
  left join public.coin_transactions t on t.user_id = p.id
  group by p.id
  having p.coins <> coalesce(sum(t.amount), 0)
),
fix as (
  update public.profiles p set coins = p.coins - d.extra
  from diff d where p.id = d.id
  returning p.id
)
insert into public.coin_transactions (user_id, amount, reason)
select d.id, -d.extra, 'refund' from diff d;
