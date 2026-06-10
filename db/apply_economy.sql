-- ============================================================
-- World Cup Trip — apply economy + grant Emre a test bankroll
-- Run in Supabase SQL Editor (safe: plain SQL, not edge-function code).
-- Idempotent: re-running just overwrites with the same values.
-- ============================================================

-- 1) Economy config (tier odds + generosity + within-tier star weights)
insert into config (key, value) values
  ('rarity_weights_normal', '{"common":0.64,"gold":0.27,"diamond":0.09}'::jsonb),
  ('rarity_weights_deluxe', '{"common":0.44,"gold":0.38,"diamond":0.18}'::jsonb),
  ('daily_coins','300'::jsonb), ('daily_free_packs','3'::jsonb),
  ('pack_cost_normal','40'::jsonb), ('pack_cost_deluxe','120'::jsonb),
  ('pack_size','5'::jsonb), ('pity_packs','6'::jsonb),
  ('game_reward_per_game','50'::jsonb), ('game_reward_daily_cap','300'::jsonb),
  ('pull_weight_base','100'::jsonb), ('pull_weight_icon','45'::jsonb), ('pull_weight_super_icon','25'::jsonb)
on conflict (key) do update set value = excluded.value;

-- 2) Test bankroll for Emre (rider 0):
--    ~a day's faucet (600 coins + 3 packs) + a modest sportsbook win (~+900 coins, +2 packs)
--    => 1500 coins + 5 free packs. Wipes to this exact amount so you can see where you land.
insert into wallets (user_id, coins, free_packs, packs_since_good)
select id, 1500, 5, 0 from profiles where rider_id = 0
on conflict (user_id) do update
  set coins = 1500, free_packs = 5, packs_since_good = 0;
