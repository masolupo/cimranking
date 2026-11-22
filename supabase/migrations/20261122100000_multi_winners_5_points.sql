-- =====================================================================
-- Più vincitori per partita (Avalon, Sonar, giochi a squadre/cooperativi),
-- vittoria = 5 punti, e posizione in classifica con i pari merito.
--
-- Compatibile con la versione già pubblicata dell'app:
--   - matches.winner_id resta (= primo vincitore) e il vecchio record_match funziona ancora;
--   - le vecchie viste overall_leaderboard / game_leaderboard non vengono toccate.
-- La nuova app usa match_winners e le viste overall_standings / game_standings.
-- Dopo la pubblicazione le vecchie viste e winner_id sono stati eliminati (20261122120000).
-- =====================================================================

-- ---------------------------------------------------------------------
-- VINCITORI
-- ---------------------------------------------------------------------
create table public.match_winners (
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.profiles (id),
  primary key (match_id, player_id)
);

create index match_winners_player_id_idx on public.match_winners (player_id);

alter table public.match_winners enable row level security;
create policy "vincitori visibili agli utenti" on public.match_winners
  for select to authenticated using (true);
grant select on public.match_winners to authenticated;

-- partite già registrate: un vincitore ciascuna
insert into public.match_winners (match_id, player_id)
select id, winner_id from public.matches;

-- ---------------------------------------------------------------------
-- REGISTRA PARTITA con uno o più vincitori
-- ---------------------------------------------------------------------
create function public.record_match(
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

  insert into public.matches (game_id, played_at, winner_id, created_by, notes)
  values (p_game_id, coalesce(p_played_at, current_date), v_winners[1], v_uid, nullif(trim(p_notes), ''))
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

revoke execute on function public.record_match(uuid, date, uuid[], uuid[], text) from public, anon;
grant execute on function public.record_match(uuid, date, uuid[], uuid[], text) to authenticated;

-- La vecchia versione (un solo vincitore, usata dall'app già pubblicata) passa dalla nuova,
-- così anche le sue partite finiscono in match_winners.
create or replace function public.record_match(
  p_game_id uuid,
  p_played_at date,
  p_player_ids uuid[],
  p_winner_id uuid,
  p_notes text default null
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select public.record_match(p_game_id, p_played_at, p_player_ids, array[p_winner_id], p_notes);
$$;

-- ---------------------------------------------------------------------
-- CLASSIFICHE: vittoria 5 punti, partecipazione 1 punto.
-- rank = posizione con pari merito (stessi punti = stessa posizione: 1, 1, 2, ...)
-- ---------------------------------------------------------------------
create view public.overall_standings
with (security_invoker = true) as
with stats as (
  select
    mp.player_id,
    count(*)::int as played,
    count(mw.player_id)::int as wins
  from public.match_players mp
  left join public.match_winners mw
    on mw.match_id = mp.match_id and mw.player_id = mp.player_id
  group by mp.player_id
),
scored as (
  select s.*, (s.wins * 5 + (s.played - s.wins) * 1)::int as points
  from stats s
)
select
  s.player_id,
  dense_rank() over (order by s.points desc)::int as rank,
  s.played,
  s.wins,
  s.points,
  round(100.0 * s.wins / s.played)::int as win_rate,
  pc.username, pc.display_name, pc.avatar_url, pc.crown, pc.frame, pc.title, pc.aura
from scored s
join public.player_cards pc on pc.id = s.player_id;

create view public.game_standings
with (security_invoker = true) as
with stats as (
  select
    m.game_id,
    mp.player_id,
    count(*)::int as played,
    count(mw.player_id)::int as wins
  from public.match_players mp
  join public.matches m on m.id = mp.match_id
  left join public.match_winners mw
    on mw.match_id = mp.match_id and mw.player_id = mp.player_id
  group by m.game_id, mp.player_id
),
scored as (
  select s.*, (s.wins * 5 + (s.played - s.wins) * 1)::int as points
  from stats s
)
select
  s.game_id,
  s.player_id,
  dense_rank() over (partition by s.game_id order by s.points desc)::int as rank,
  s.played,
  s.wins,
  s.points,
  round(100.0 * s.wins / s.played)::int as win_rate,
  pc.username, pc.display_name, pc.avatar_url, pc.crown, pc.frame, pc.title, pc.aura
from scored s
join public.player_cards pc on pc.id = s.player_id;

grant select on public.overall_standings, public.game_standings to authenticated;
