-- DATI DEMO: 4 giocatori finti, 5 giochi, 28 partite nell'ultimo mese, qualche oggetto equipaggiato.
-- Tutto è riconoscibile dagli id fissi d000000X-... e dagli slug dei giochi che finiscono con "-demo".
-- Per cancellare tutto: supabase/demo/demo_cleanup.sql

-- 1) Account finti (non possono fare login: niente password). Il trigger crea il profilo.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  id::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  email, '', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', ''
from (values
  ('d0000001-0000-4000-8000-00000000d001', 'demo1@demo.invalid'),
  ('d0000002-0000-4000-8000-00000000d002', 'demo2@demo.invalid'),
  ('d0000003-0000-4000-8000-00000000d003', 'demo3@demo.invalid'),
  ('d0000004-0000-4000-8000-00000000d004', 'demo4@demo.invalid')
) as u(id, email);

update public.profiles p
set username = v.username, display_name = v.display_name, onboarded = true
from (values
  ('d0000001-0000-4000-8000-00000000d001'::uuid, 'marco_r', 'Marco Rossi'),
  ('d0000002-0000-4000-8000-00000000d002'::uuid, 'giulia_b', 'Giulia Bianchi'),
  ('d0000003-0000-4000-8000-00000000d003'::uuid, 'luca_f', 'Luca Ferri'),
  ('d0000004-0000-4000-8000-00000000d004'::uuid, 'sara_c', 'Sara Conti')
) as v(id, username, display_name)
where p.id = v.id;

-- 2) Giochi
insert into public.games (name, slug, created_by) values
  ('Catan',          'catan-demo',          'd0000001-0000-4000-8000-00000000d001'),
  ('Ticket to Ride', 'ticket-to-ride-demo', 'd0000001-0000-4000-8000-00000000d001'),
  ('Carcassonne',    'carcassonne-demo',    'd0000001-0000-4000-8000-00000000d001'),
  ('Dixit',          'dixit-demo',          'd0000001-0000-4000-8000-00000000d001'),
  ('Uno',            'uno-demo',            'd0000001-0000-4000-8000-00000000d001');

-- 3) Partite (monete come record_match: +10 a chi vince, +1 agli altri)
do $$
declare
  p uuid[] := array[
    'd0000001-0000-4000-8000-00000000d001', 'd0000002-0000-4000-8000-00000000d002',
    'd0000003-0000-4000-8000-00000000d003', 'd0000004-0000-4000-8000-00000000d004'
  ]::uuid[];
  -- chi vince ogni partita (1=Marco 12, 2=Giulia 7, 3=Luca 5, 4=Sara 4)
  winners int[] := array[1,2,1,3,1,4,2,1,3,1,2,4,1,2,3,1,1,2,4,3,1,2,1,3,2,1,4,1];
  g uuid[];
  players uuid[];
  m uuid;
  pl uuid;
  n int;
begin
  select array_agg(id order by name) into g from public.games where slug like '%-demo';

  for i in 1..array_length(winners, 1) loop
    n := case i % 3 when 0 then 4 when 1 then 3 else 2 end;
    players := array[p[winners[i]]];
    for k in 1..3 loop
      exit when array_length(players, 1) >= n;
      players := players || p[((winners[i] - 1 + k) % 4) + 1];
    end loop;

    insert into public.matches (game_id, played_at, winner_id, created_by)
    values (g[1 + (i % array_length(g, 1))], current_date - (28 - i), p[winners[i]], p[1])
    returning id into m;

    foreach pl in array players loop
      insert into public.match_players (match_id, player_id) values (m, pl);
      if pl = p[winners[i]] then
        update public.profiles set coins = coins + 10 where id = pl;
        insert into public.coin_transactions (user_id, amount, reason, match_id) values (pl, 10, 'win', m);
      else
        update public.profiles set coins = coins + 1 where id = pl;
        insert into public.coin_transactions (user_id, amount, reason, match_id) values (pl, 1, 'participation', m);
      end if;
    end loop;
  end loop;
end $$;

-- 4) Oggetti equipaggiati, per vedere corone/cornici/effetti/titoli in classifica
insert into public.user_items (user_id, item_id, item_type, equipped)
select v.user_id::uuid, si.id, si.type, true
from (values
  ('d0000001-0000-4000-8000-00000000d001', 'corona-oro'),
  ('d0000001-0000-4000-8000-00000000d001', 'aura-fiamme'),
  ('d0000001-0000-4000-8000-00000000d001', 'titolo-leggenda'),
  ('d0000002-0000-4000-8000-00000000d002', 'cornice-arcobaleno'),
  ('d0000002-0000-4000-8000-00000000d002', 'aura-brillantini'),
  ('d0000002-0000-4000-8000-00000000d002', 'titolo-stratega'),
  ('d0000003-0000-4000-8000-00000000d003', 'corona-argento'),
  ('d0000003-0000-4000-8000-00000000d003', 'cornice-rubino'),
  ('d0000004-0000-4000-8000-00000000d004', 'aura-fulmini'),
  ('d0000004-0000-4000-8000-00000000d004', 'titolo-fortunello')
) as v(user_id, slug)
join public.shop_items si on si.slug = v.slug;
