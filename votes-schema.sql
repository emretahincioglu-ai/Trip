-- ============================================================
-- GROUP PICKS — voting tables for the World Cup Trip app
-- Run ONCE in the Supabase SQL editor BEFORE using ?api=votes.
-- The edge function `sportmonks` reads/writes these with the
-- service role, so RLS can stay on with no public policies.
-- ============================================================

create table if not exists polls (
  poll_id text primary key,                 -- e.g. "sf-2026-06-18-lunch"
  city    text not null,                     -- slug: "sf" (matches VOTE_CITIES in section-trip.html)
  date    date not null,
  meal    text not null check (meal in ('breakfast','lunch','dinner','snack','activity')),
  title   text not null,
  options jsonb not null default '[]'::jsonb -- [{option_id,name,gmaps,menu,youtube,photo}]
);

create table if not exists votes_cast (
  poll_id    text not null references polls(poll_id) on delete cascade,
  rider_id   int  not null check (rider_id between 0 and 5),
  option_id  text not null,
  updated_at timestamptz not null default now(),
  primary key (poll_id, rider_id)            -- ONE pick per rider per poll; upsert replaces
);

create index if not exists votes_cast_poll_idx on votes_cast(poll_id);

alter table polls      enable row level security;  -- service-role edge fn bypasses RLS
alter table votes_cast enable row level security;

-- ---- Seed: San Francisco polls (NO San Diego). -------------------------------
-- Option SETS are reused across dates; same options for every SF day.
-- Keep these in sync with OPTION_SETS / POLL_PLAN in section-trip.html.
insert into polls (poll_id, city, date, meal, title, options) values
 ('sf-2026-06-18-breakfast','sf','2026-06-18','breakfast','Breakfast',
   '[{"option_id":"sf-bk-early-to-rise","name":"Early to Rise","youtube":"https://youtu.be/vdXGvD7dt5w?t=49"},
     {"option_id":"sf-bk-alt-tbd","name":"Alt breakfast (TBD)","youtube":"https://youtu.be/zUjAvVlFEoQ?t=30"}]'::jsonb),
 ('sf-2026-06-19-breakfast','sf','2026-06-19','breakfast','Breakfast',
   '[{"option_id":"sf-bk-early-to-rise","name":"Early to Rise","youtube":"https://youtu.be/vdXGvD7dt5w?t=49"},
     {"option_id":"sf-bk-alt-tbd","name":"Alt breakfast (TBD)","youtube":"https://youtu.be/zUjAvVlFEoQ?t=30"}]'::jsonb),
 ('sf-2026-06-17-lunch','sf','2026-06-17','lunch','Lunch',
   '[{"option_id":"sf-ln-golden-boy","name":"Golden Boy Pizza","gmaps":"https://maps.google.com/?q=Golden+Boy+Pizza+San+Francisco"},
     {"option_id":"sf-ln-good-mong-kok","name":"Good Mong Kok · Chinatown","gmaps":"https://maps.google.com/?q=Good+Mong+Kok+Bakery+San+Francisco"}]'::jsonb),
 ('sf-2026-06-18-lunch','sf','2026-06-18','lunch','Lunch',
   '[{"option_id":"sf-ln-golden-boy","name":"Golden Boy Pizza","gmaps":"https://maps.google.com/?q=Golden+Boy+Pizza+San+Francisco"},
     {"option_id":"sf-ln-good-mong-kok","name":"Good Mong Kok · Chinatown","gmaps":"https://maps.google.com/?q=Good+Mong+Kok+Bakery+San+Francisco"}]'::jsonb),
 ('sf-2026-06-19-lunch','sf','2026-06-19','lunch','Lunch',
   '[{"option_id":"sf-ln-golden-boy","name":"Golden Boy Pizza","gmaps":"https://maps.google.com/?q=Golden+Boy+Pizza+San+Francisco"},
     {"option_id":"sf-ln-good-mong-kok","name":"Good Mong Kok · Chinatown","gmaps":"https://maps.google.com/?q=Good+Mong+Kok+Bakery+San+Francisco"}]'::jsonb)
on conflict (poll_id) do update
  set city=excluded.city, date=excluded.date, meal=excluded.meal,
      title=excluded.title, options=excluded.options;

-- DEPLOY: paste supabase-edge-function.ts into the `sportmonks` Edge Function (Deploy),
-- run this file once in the SQL editor, then the app's Group Picks work end-to-end.
