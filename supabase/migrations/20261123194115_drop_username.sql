-- =====================================================================
-- Username eliminato: i giocatori hanno solo il nome (display_name)
-- e i profili si aprono per id. Applicata dopo il deploy dell'app
-- che non usa più username (20261123185209).
-- =====================================================================

-- le viste dipendono da username: si ricreano senza
drop view public.overall_standings;
drop view public.game_standings;
drop view public.player_cards;

alter table public.profiles drop column username;

-- nuovo utente: niente più username generato
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'Giocatore')
  );
  return new;
end;
$$;

create view public.player_cards
with (security_invoker = true) as
select
  p.id,
  p.display_name,
  p.avatar_url,
  p.coins,
  (select si.asset_key from public.user_items ui join public.shop_items si on si.id = ui.item_id
    where ui.user_id = p.id and ui.equipped and ui.item_type = 'crown') as crown,
  (select si.asset_key from public.user_items ui join public.shop_items si on si.id = ui.item_id
    where ui.user_id = p.id and ui.equipped and ui.item_type = 'frame') as frame,
  (select si.name from public.user_items ui join public.shop_items si on si.id = ui.item_id
    where ui.user_id = p.id and ui.equipped and ui.item_type = 'title') as title,
  (select si.asset_key from public.user_items ui join public.shop_items si on si.id = ui.item_id
    where ui.user_id = p.id and ui.equipped and ui.item_type = 'aura') as aura
from public.profiles p
where p.onboarded;

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
  pc.display_name, pc.avatar_url, pc.crown, pc.frame, pc.title, pc.aura
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
  pc.display_name, pc.avatar_url, pc.crown, pc.frame, pc.title, pc.aura
from scored s
join public.player_cards pc on pc.id = s.player_id;

grant select on public.player_cards, public.overall_standings, public.game_standings to authenticated;
