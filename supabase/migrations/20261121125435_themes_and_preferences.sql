-- =====================================================================
-- Temi (gratis e a pagamento) + preferenze grafiche per utente
-- =====================================================================

-- Nuovo tipo di oggetto: 'theme'
alter table public.shop_items drop constraint shop_items_type_check;
alter table public.shop_items
  add constraint shop_items_type_check check (type in ('crown', 'frame', 'title', 'theme'));

alter table public.user_items drop constraint user_items_item_type_check;
alter table public.user_items
  add constraint user_items_item_type_check check (item_type in ('crown', 'frame', 'title', 'theme'));

-- Preferenze grafiche (sfondo animato, font, angoli): le modifica solo il proprietario
alter table public.profiles
  add column preferences jsonb not null default '{}'::jsonb
  check (jsonb_typeof(preferences) = 'object' and pg_column_size(preferences) < 2048);

grant update (preferences) on public.profiles to authenticated;

-- Equipaggia: gli oggetti gratuiti (prezzo 0) si ottengono automaticamente
create or replace function public.equip_item(p_item_id uuid)
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
    select type into v_type from public.shop_items where id = p_item_id and active and price = 0;
    if not found then
      raise exception 'Non possiedi questo oggetto';
    end if;
    insert into public.user_items (user_id, item_id, item_type) values (v_uid, p_item_id, v_type);
  end if;

  update public.user_items set equipped = false
  where user_id = v_uid and item_type = v_type and equipped;
  update public.user_items set equipped = true
  where user_id = v_uid and item_id = p_item_id;
end;
$$;

revoke execute on function public.equip_item(uuid) from public, anon;
grant execute on function public.equip_item(uuid) to authenticated;

-- Temi
insert into public.shop_items (slug, name, description, type, price, asset_key, sort) values
  ('tema-tavolo',   'Tavolo verde',     'Il classico panno da gioco, verde e oro.',      'theme', 0,   'tavolo',   200),
  ('tema-oceano',   'Oceano',           'Blu profondo e onde turchesi.',                 'theme', 0,   'oceano',   210),
  ('tema-lavanda',  'Lavanda',          'Viola tenue, rilassante.',                      'theme', 0,   'lavanda',  220),
  ('tema-tramonto', 'Tramonto',         'Arancio e rosa, come una sera d''estate.',      'theme', 40,  'tramonto', 230),
  ('tema-foresta',  'Foresta incantata','Verdi profondi e luci dorate tra gli alberi.',  'theme', 40,  'foresta',  240),
  ('tema-caramella','Caramella',        'Rosa zucchero e azzurro pastello.',             'theme', 60,  'caramella',250),
  ('tema-vulcano',  'Vulcano',          'Lava vera: rosso fuoco e brace.',               'theme', 100, 'vulcano',  260),
  ('tema-neon',     'Neon',             'Cyberpunk: fucsia elettrico e ciano.',          'theme', 100, 'neon',     270),
  ('tema-reale',    'Reale',            'Porpora e oro, per veri sovrani.',              'theme', 150, 'reale',    280),
  ('tema-aurora',   'Aurora boreale',   'Verde, viola e azzurro che danzano nel cielo.', 'theme', 200, 'aurora',   290);
