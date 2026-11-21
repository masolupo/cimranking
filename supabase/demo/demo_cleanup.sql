-- Cancella TUTTI i dati demo creati da demo_seed.sql (e nient'altro).
-- Ordine: partite e giochi prima (non si cancellano a cascata), poi gli account
-- (che cancellano a cascata profilo, oggetti e storico monete).

delete from public.match_players
where match_id in (
  select m.id from public.matches m
  join public.games g on g.id = m.game_id
  where g.slug like '%-demo' and g.created_by = 'd0000001-0000-4000-8000-00000000d001'
);

delete from public.matches
where game_id in (
  select id from public.games
  where slug like '%-demo' and created_by = 'd0000001-0000-4000-8000-00000000d001'
);

-- partite (anche su giochi veri) in cui compare un giocatore demo
delete from public.matches
where winner_id in (
    'd0000001-0000-4000-8000-00000000d001', 'd0000002-0000-4000-8000-00000000d002',
    'd0000003-0000-4000-8000-00000000d003', 'd0000004-0000-4000-8000-00000000d004'
  )
  or id in (
    select match_id from public.match_players where player_id in (
      'd0000001-0000-4000-8000-00000000d001', 'd0000002-0000-4000-8000-00000000d002',
      'd0000003-0000-4000-8000-00000000d003', 'd0000004-0000-4000-8000-00000000d004'
    )
  );

delete from public.games
where slug like '%-demo' and created_by = 'd0000001-0000-4000-8000-00000000d001';

delete from auth.users
where id in (
  'd0000001-0000-4000-8000-00000000d001', 'd0000002-0000-4000-8000-00000000d002',
  'd0000003-0000-4000-8000-00000000d003', 'd0000004-0000-4000-8000-00000000d004'
);
