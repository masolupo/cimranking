-- =====================================================================
-- Effetti animati sull'avatar ("aura"): brillantini, stelle, fiamme, fulmini
-- =====================================================================

alter table public.shop_items drop constraint shop_items_type_check;
alter table public.shop_items
  add constraint shop_items_type_check check (type in ('crown', 'frame', 'title', 'theme', 'aura'));

alter table public.user_items drop constraint user_items_item_type_check;
alter table public.user_items
  add constraint user_items_item_type_check check (item_type in ('crown', 'frame', 'title', 'theme', 'aura'));

-- Aggiunge l'aura equipaggiata alle viste (nuova colonna in fondo)
create or replace view public.player_cards
with (security_invoker = true) as
select
  p.id,
  p.username,
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

create or replace view public.game_leaderboard
with (security_invoker = true) as
with stats as (
  select
    m.game_id,
    mp.player_id,
    count(*)::int as played,
    count(*) filter (where m.winner_id = mp.player_id)::int as wins
  from public.match_players mp
  join public.matches m on m.id = mp.match_id
  group by m.game_id, mp.player_id
)
select
  s.game_id,
  s.player_id,
  s.played,
  s.wins,
  (s.wins * 3 + (s.played - s.wins) * 1)::int as points,
  round(100.0 * s.wins / s.played)::int as win_rate,
  pc.username, pc.display_name, pc.avatar_url, pc.crown, pc.frame, pc.title,
  pc.aura
from stats s
join public.player_cards pc on pc.id = s.player_id;

create or replace view public.overall_leaderboard
with (security_invoker = true) as
with stats as (
  select
    mp.player_id,
    count(*)::int as played,
    count(*) filter (where m.winner_id = mp.player_id)::int as wins
  from public.match_players mp
  join public.matches m on m.id = mp.match_id
  group by mp.player_id
)
select
  s.player_id,
  s.played,
  s.wins,
  (s.wins * 3 + (s.played - s.wins) * 1)::int as points,
  round(100.0 * s.wins / s.played)::int as win_rate,
  pc.username, pc.display_name, pc.avatar_url, pc.crown, pc.frame, pc.title,
  pc.aura
from stats s
join public.player_cards pc on pc.id = s.player_id;

insert into public.shop_items (slug, name, description, type, price, asset_key, sort) values
  ('aura-brillantini', 'Brillantini',       'Stelline che sbrilluccicano attorno all''avatar.', 'aura', 80,  'sparkle',   300),
  ('aura-stelle',      'Stelle orbitanti',  'Piccole stelle che ti girano intorno.',            'aura', 120, 'orbit',     310),
  ('aura-fiamme',      'Fiamme',            'L''avatar va letteralmente a fuoco.',              'aura', 180, 'fire',      320),
  ('aura-fulmini',     'Fulmini',           'Saette elettriche che crepitano attorno a te.',    'aura', 220, 'lightning', 330);
