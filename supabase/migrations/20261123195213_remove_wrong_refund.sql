-- La riallineazione in 20261123195105 ha corretto il saldo di masolupo (10 -> 5)
-- ma ha anche aggiunto un movimento -5 allo storico, che invece era già giusto.
-- Si toglie quel movimento: saldo e storico tornano entrambi a 5.
delete from public.coin_transactions
where id = 207
  and user_id = 'c3f9c838-0138-4d78-a828-8de31d85465c'
  and amount = -5
  and reason = 'refund'
  and match_id is null;
