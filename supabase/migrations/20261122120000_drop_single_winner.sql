-- =====================================================================
-- Pulizia dopo il passaggio a più vincitori (20261122100000):
-- l'app pubblicata usa solo match_winners e le viste *_standings.
-- =====================================================================

-- vecchie classifiche (3 punti, un solo vincitore)
drop view public.overall_leaderboard;
drop view public.game_leaderboard;

-- vecchia firma con un solo vincitore
drop function public.record_match(uuid, date, uuid[], uuid, text);

-- record_match senza winner_id (va sostituita prima di togliere la colonna)
create or replace function public.record_match(
  p_game_id uuid,
  p_played_at date,
  p_player_ids uuid[],
  p_winner_ids uuid[],
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_players uuid[];
  v_winners uuid[];
  v_match_id uuid;
  v_player uuid;
  v_found int;
begin
  if v_uid is null then
    raise exception 'Devi essere loggato';
  end if;

  select array_agg(distinct x) into v_players from unnest(p_player_ids) as x;
  select array_agg(distinct x) into v_winners from unnest(p_winner_ids) as x;

  if coalesce(array_length(v_players, 1), 0) < 2 then
    raise exception 'Servono almeno 2 giocatori';
  end if;
  if coalesce(array_length(v_winners, 1), 0) < 1 then
    raise exception 'Scegli almeno un vincitore';
  end if;
  if not (v_winners <@ v_players) then
    raise exception 'I vincitori devono essere tra i giocatori';
  end if;
  if p_played_at > current_date + 1 then
    raise exception 'La data non può essere nel futuro';
  end if;
  if not exists (select 1 from public.games where id = p_game_id) then
    raise exception 'Gioco non trovato';
  end if;

  select count(*) into v_found from public.profiles
  where id = any (v_players) and onboarded;
  if v_found <> array_length(v_players, 1) then
    raise exception 'Giocatore non valido';
  end if;

  insert into public.matches (game_id, played_at, created_by, notes)
  values (p_game_id, coalesce(p_played_at, current_date), v_uid, nullif(trim(p_notes), ''))
  returning id into v_match_id;

  foreach v_player in array v_players loop
    insert into public.match_players (match_id, player_id) values (v_match_id, v_player);

    if v_player = any (v_winners) then
      insert into public.match_winners (match_id, player_id) values (v_match_id, v_player);
      update public.profiles set coins = coins + 10 where id = v_player;
      insert into public.coin_transactions (user_id, amount, reason, match_id)
      values (v_player, 10, 'win', v_match_id);
    else
      update public.profiles set coins = coins + 1 where id = v_player;
      insert into public.coin_transactions (user_id, amount, reason, match_id)
      values (v_player, 1, 'participation', v_match_id);
    end if;
  end loop;

  return v_match_id;
end;
$$;

-- il vincitore unico non serve più: i vincitori stanno in match_winners
alter table public.matches drop column winner_id;
