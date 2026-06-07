-- Seed the 6 riders into profiles + wallets. Safe to re-run.
-- Rider IDs match the app's ?rider=<id>. Starting balance: 500 coins each.

insert into profiles (rider_id, name) values
  (0, 'Emre'),
  (1, 'KD'),
  (2, 'Ali'),
  (3, 'Ali K'),
  (4, 'Mekin'),
  (5, 'Kaan')
on conflict (rider_id) do nothing;

insert into wallets (user_id, coins)
select id, 500 from profiles
on conflict (user_id) do nothing;
