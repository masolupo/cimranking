-- =====================================================================
-- Tavolo dei Campioni: schema iniziale
-- Regole: vittoria = 3 punti + 10 monete, partecipazione = 1 punto + 1 moneta
-- =====================================================================

-- ---------------------------------------------------------------------
-- PROFILI
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null
    check (char_length(display_name) between 1 and 40),
  avatar_url text,
  coins integer not null default 0 check (coins >= 0),
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- Crea il profilo automaticamente alla registrazione
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 10),
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'Giocatore')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- GIOCHI
-- ---------------------------------------------------------------------
create table public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,70}$'),
  cover_path text,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);

create index games_created_by_idx on public.games (created_by);

-- ---------------------------------------------------------------------
-- PARTITE
-- ---------------------------------------------------------------------
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  played_at date not null default current_date,
  winner_id uuid not null references public.profiles (id),
  created_by uuid not null references public.profiles (id),
  notes text check (char_length(notes) <= 280),
  created_at timestamptz not null default now()
);

create index matches_game_id_idx on public.matches (game_id, played_at desc);
create index matches_winner_id_idx on public.matches (winner_id);
create index matches_created_by_idx on public.matches (created_by);

create table public.match_players (
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.profiles (id),
  primary key (match_id, player_id)
);

create index match_players_player_id_idx on public.match_players (player_id);

-- ---------------------------------------------------------------------
-- NEGOZIO
-- ---------------------------------------------------------------------
create table public.shop_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  type text not null check (type in ('crown', 'frame', 'title')),
  price integer not null check (price >= 0),
  asset_key text not null,
  active boolean not null default true,
  sort integer not null default 0
);

create table public.user_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid not null references public.shop_items (id),
  item_type text not null check (item_type in ('crown', 'frame', 'title')),
  equipped boolean not null default false,
  purchased_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index user_items_item_id_idx on public.user_items (item_id);
-- un solo oggetto equipaggiato per tipo
create unique index user_items_one_equipped_per_type
  on public.user_items (user_id, item_type) where equipped;

-- ---------------------------------------------------------------------
-- MOVIMENTI MONETE (storico)
-- ---------------------------------------------------------------------
create table public.coin_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  reason text not null check (reason in ('win', 'participation', 'purchase', 'refund')),
  match_id uuid references public.matches (id) on delete set null,
  item_id uuid references public.shop_items (id),
  created_at timestamptz not null default now()
);

create index coin_transactions_user_id_idx on public.coin_transactions (user_id, created_at desc);
create index coin_transactions_match_id_idx on public.coin_transactions (match_id);
create index coin_transactions_item_id_idx on public.coin_transactions (item_id);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.shop_items enable row level security;
alter table public.user_items enable row level security;
alter table public.coin_transactions enable row level security;

-- Lettura: tutti gli utenti loggati vedono tutto tranne lo storico monete altrui
create policy "profili visibili agli utenti" on public.profiles
  for select to authenticated using (true);
create policy "giochi visibili agli utenti" on public.games
  for select to authenticated using (true);
create policy "partite visibili agli utenti" on public.matches
  for select to authenticated using (true);
create policy "partecipanti visibili agli utenti" on public.match_players
  for select to authenticated using (true);
create policy "negozio visibile agli utenti" on public.shop_items
  for select to authenticated using (true);
create policy "oggetti visibili agli utenti" on public.user_items
  for select to authenticated using (true);
create policy "solo i propri movimenti" on public.coin_transactions
  for select to authenticated using ((select auth.uid()) = user_id);

-- Profilo: ognuno modifica solo il proprio (e solo alcune colonne, vedi GRANT)
create policy "modifica il proprio profilo" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Giochi: chiunque sia loggato li aggiunge, il creatore li modifica
create policy "aggiungi giochi" on public.games
  for insert to authenticated
  with check ((select auth.uid()) = created_by);
create policy "modifica i propri giochi" on public.games
  for update to authenticated
  using ((select auth.uid()) = created_by)
  with check ((select auth.uid()) = created_by);

-- ---------------------------------------------------------------------
-- GRANT (le nuove tabelle non sono esposte automaticamente alla Data API)
-- ---------------------------------------------------------------------
grant select on
  public.profiles, public.games, public.matches, public.match_players,
  public.shop_items, public.user_items, public.coin_transactions
to authenticated;

-- monete, partite e oggetti si cambiano SOLO tramite le funzioni qui sotto
grant update (username, display_name, avatar_url, onboarded) on public.profiles to authenticated;
grant insert (name, slug, cover_path, created_by) on public.games to authenticated;
grant update (name, cover_path) on public.games to authenticated;

-- ---------------------------------------------------------------------
-- VISTE (security_invoker: rispettano la RLS di chi le interroga)
-- ---------------------------------------------------------------------
create view public.player_cards
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
    where ui.user_id = p.id and ui.equipped and ui.item_type = 'title') as title
from public.profiles p
where p.onboarded;

create view public.game_leaderboard
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
  pc.username, pc.display_name, pc.avatar_url, pc.crown, pc.frame, pc.title
from stats s
join public.player_cards pc on pc.id = s.player_id;

create view public.overall_leaderboard
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
  pc.username, pc.display_name, pc.avatar_url, pc.crown, pc.frame, pc.title
from stats s
join public.player_cards pc on pc.id = s.player_id;

grant select on public.player_cards, public.game_leaderboard, public.overall_leaderboard to authenticated;

-- ---------------------------------------------------------------------
-- FUNZIONI (security definer: unica via per toccare monete/partite/oggetti)
-- Ognuna controlla auth.uid() ed è eseguibile solo da utenti loggati.
-- ---------------------------------------------------------------------

-- Registra una partita e assegna le monete
create function public.record_match(
  p_game_id uuid,
  p_played_at date,
  p_player_ids uuid[],
  p_winner_id uuid,
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
  v_match_id uuid;
  v_player uuid;
  v_found int;
begin
  if v_uid is null then
    raise exception 'Devi essere loggato';
  end if;

  select array_agg(distinct x) into v_players from unnest(p_player_ids) as x;

  if coalesce(array_length(v_players, 1), 0) < 2 then
    raise exception 'Servono almeno 2 giocatori';
  end if;
  if not (p_winner_id = any (v_players)) then
    raise exception 'Il vincitore deve essere tra i giocatori';
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
  values (p_game_id, coalesce(p_played_at, current_date), p_winner_id, v_uid, nullif(trim(p_notes), ''))
  returning id into v_match_id;

  foreach v_player in array v_players loop
    insert into public.match_players (match_id, player_id) values (v_match_id, v_player);

    if v_player = p_winner_id then
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

-- Cancella una partita (solo chi l'ha creata, entro 24 ore) e storna le monete
create function public.delete_match(p_match_id uuid)
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

  if not exists (
    select 1 from public.matches
    where id = p_match_id and created_by = v_uid and created_at > now() - interval '24 hours'
  ) then
    raise exception 'Puoi cancellare solo le tue partite entro 24 ore';
  end if;

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

-- Compra un oggetto del negozio
create function public.buy_item(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_item public.shop_items;
  v_coins int;
begin
  if v_uid is null then
    raise exception 'Devi essere loggato';
  end if;

  select * into v_item from public.shop_items where id = p_item_id and active;
  if not found then
    raise exception 'Oggetto non disponibile';
  end if;

  if exists (select 1 from public.user_items where user_id = v_uid and item_id = p_item_id) then
    raise exception 'Hai già questo oggetto';
  end if;

  select coins into v_coins from public.profiles where id = v_uid for update;
  if v_coins < v_item.price then
    raise exception 'Monete insufficienti';
  end if;

  update public.profiles set coins = coins - v_item.price where id = v_uid;
  insert into public.user_items (user_id, item_id, item_type) values (v_uid, p_item_id, v_item.type);
  insert into public.coin_transactions (user_id, amount, reason, item_id)
  values (v_uid, -v_item.price, 'purchase', p_item_id);
end;
$$;

-- Equipaggia un oggetto posseduto (toglie quello dello stesso tipo)
create function public.equip_item(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_type text;
begin
  if v_uid is null then
    raise exception 'Devi essere loggato';
  end if;

  select item_type into v_type from public.user_items where user_id = v_uid and item_id = p_item_id;
  if not found then
    raise exception 'Non possiedi questo oggetto';
  end if;

  update public.user_items set equipped = false
  where user_id = v_uid and item_type = v_type and equipped;
  update public.user_items set equipped = true
  where user_id = v_uid and item_id = p_item_id;
end;
$$;

-- Toglie l'oggetto equipaggiato di un tipo
create function public.unequip_item(p_type text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Devi essere loggato';
  end if;
  update public.user_items set equipped = false
  where user_id = auth.uid() and item_type = p_type and equipped;
end;
$$;

revoke execute on function public.record_match(uuid, date, uuid[], uuid, text) from public, anon;
revoke execute on function public.delete_match(uuid) from public, anon;
revoke execute on function public.buy_item(uuid) from public, anon;
revoke execute on function public.equip_item(uuid) from public, anon;
revoke execute on function public.unequip_item(text) from public, anon;
grant execute on function public.record_match(uuid, date, uuid[], uuid, text) to authenticated;
grant execute on function public.delete_match(uuid) to authenticated;
grant execute on function public.buy_item(uuid) to authenticated;
grant execute on function public.equip_item(uuid) to authenticated;
grant execute on function public.unequip_item(text) to authenticated;

-- ---------------------------------------------------------------------
-- STORAGE: copertine dei giochi e avatar (pubblici in lettura)
-- I file vanno caricati in una cartella col proprio id: <uid>/<file>
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('game-covers', 'game-covers', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

create policy "carica immagini nella propria cartella" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('game-covers', 'avatars')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------
-- OGGETTI DEL NEGOZIO
-- ---------------------------------------------------------------------
insert into public.shop_items (slug, name, description, type, price, asset_key, sort) values
  ('corona-bronzo',     'Corona di bronzo',     'Il primo passo verso il trono.',            'crown', 30,  'bronze',  10),
  ('corona-argento',    'Corona d''argento',     'Per chi vince con una certa regolarità.',   'crown', 60,  'silver',  20),
  ('corona-oro',        'Corona d''oro',         'Il re del tavolo.',                         'crown', 120, 'gold',    30),
  ('corona-diamante',   'Corona di diamante',   'Leggenda assoluta. Tutti si inchinano.',    'crown', 250, 'diamond', 40),
  ('cornice-smeraldo',  'Cornice smeraldo',     'Un anello verde attorno all''avatar.',       'frame', 20,  'emerald', 50),
  ('cornice-rubino',    'Cornice rubino',       'Rosso fuoco, per i più competitivi.',       'frame', 40,  'ruby',    60),
  ('cornice-arcobaleno','Cornice arcobaleno',   'Impossibile non notarti.',                  'frame', 100, 'rainbow', 70),
  ('titolo-fortunello', 'Fortunello',           'Titolo mostrato sotto il nome.',            'title', 15,  'title',   80),
  ('titolo-stratega',   'Stratega',             'Titolo mostrato sotto il nome.',            'title', 25,  'title',   90),
  ('titolo-re-dadi',    'Il Re dei Dadi',       'Titolo mostrato sotto il nome.',            'title', 25,  'title',  100),
  ('titolo-leggenda',   'Leggenda del Tavolo',  'Titolo mostrato sotto il nome.',            'title', 150, 'title',  110);
