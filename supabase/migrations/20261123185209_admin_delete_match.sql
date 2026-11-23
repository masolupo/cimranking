-- =====================================================================
-- Admin: solo gli admin possono eliminare una partita (in qualsiasi momento).
-- Prima poteva farlo chi l'aveva registrata, entro 24 ore.
--
-- is_admin NON è nei GRANT di update sulle colonne di profiles,
-- quindi nessun utente può darselo da solo: si cambia solo da SQL.
-- =====================================================================

alter table public.profiles
  add column is_admin boolean not null default false;

-- masolupo
update public.profiles set is_admin = true
where id = 'c3f9c838-0138-4d78-a828-8de31d85465c';

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

  -- storna le monete guadagnate con la partita
  for v_tx in
    select user_id, sum(amount)::int as amount
    from public.coin_transactions
    where match_id = p_match_id and reason in ('win', 'participation')
    group by user_id
  loop
    update public.profiles set coins = greatest(coins - v_tx.amount, 0) where id = v_tx.user_id;
    insert into public.coin_transactions (user_id, amount, reason)
    values (v_tx.user_id, -v_tx.amount, 'refund');
  end loop;

  delete from public.matches where id = p_match_id;
end;
$$;
