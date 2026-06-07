create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  rider_id int unique not null,
  name text not null,
  pin_hash text,
  created_at timestamptz not null default now()
);

create table if not exists wallets (
  user_id uuid primary key references profiles(id) on delete cascade,
  coins int not null default 0 check (coins >= 0)
);

create table if not exists sets (
  id bigint generated always as identity primary key,
  name text not null,
  sort_order int,
  released_at timestamptz,
  active boolean not null default true
);

create table if not exists cards (
  id bigint generated always as identity primary key,
  set_id bigint references sets(id) on delete restrict,
  player_id int,
  player_name text not null,
  team text,
  rarity text not null check (rarity in ('common','gold','diamond')),
  image_url text,
  active boolean not null default true
);

create table if not exists inventory (
  user_id uuid references profiles(id) on delete cascade,
  card_id bigint references cards(id) on delete cascade,
  count int not null default 1 check (count >= 0),
  primary key (user_id, card_id)
);

create table if not exists daily_claims (
  user_id uuid references profiles(id) on delete cascade,
  claim_date date not null default current_date,
  primary key (user_id, claim_date)
);

create table if not exists ledger (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  type text not null check (type in ('daily','game_reward','pack_buy','pull','wager_stake','wager_payout','bet_stake','bet_payout')),
  amount int not null default 0,
  ref text,
  created_at timestamptz not null default now()
);

create table if not exists config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_ledger_user_created on ledger (user_id, created_at desc);
create index if not exists idx_ledger_user_type on ledger (user_id, type);
create index if not exists idx_inventory_user on inventory (user_id);
create index if not exists idx_cards_set_rarity on cards (set_id, rarity);

insert into config (key, value) values
  ('daily_coins', '300'::jsonb),
  ('daily_free_packs', '2'::jsonb),
  ('game_reward_per_game', '50'::jsonb),
  ('game_reward_daily_cap', '300'::jsonb),
  ('pack_cost_normal', '40'::jsonb),
  ('pack_cost_deluxe', '120'::jsonb),
  ('pack_size', '5'::jsonb),
  ('pity_packs', '8'::jsonb),
  ('sportsbook_vig', '0.07'::jsonb),
  ('wager_max_coins', '200'::jsonb),
  ('wager_max_cards', '1'::jsonb)
on conflict (key) do update set value = excluded.value;

insert into config (key, value) values
  ('rarity_weights_normal', '{"common":0.75,"gold":0.19,"diamond":0.06}'::jsonb),
  ('rarity_weights_deluxe', '{"common":0.55,"gold":0.33,"diamond":0.12}'::jsonb)
on conflict (key) do update set value = excluded.value;

alter table profiles enable row level security;
alter table wallets enable row level security;
alter table sets enable row level security;
alter table cards enable row level security;
alter table inventory enable row level security;
alter table daily_claims enable row level security;
alter table ledger enable row level security;
alter table config enable row level security;
