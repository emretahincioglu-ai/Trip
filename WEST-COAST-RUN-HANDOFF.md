# West Coast Run — Project Handoff

This document catches you (Claude, in a new Cowork session) up completely on the **West Coast Run** app so we can keep building without re-explaining. Read this first.

---

## What this is

A personalized **group trip + World Cup companion app** for 6 friends traveling SF → LA for the 2026 World Cup. It started as a budgeting app and grew into a full itinerary + live World Cup app. It's live, hosted on **GitHub Pages**, with live sports data flowing through a **Supabase Edge Function** proxy.

**The match:** Türkiye vs Paraguay, Group D, Fri June 19 2026, ~8 PM PT, Levi's Stadium, Santa Clara.

**The 6 people:** Emre, KD, Ali, Ali K, Mekin, Kaan.

---

## The 6 LIVE files (these are the app — everything else is old concepts, ignore)

All files MUST live in the **same folder** (GitHub Pages root). They reference each other by relative path.

1. **index.html** — the shell / "TV". Name-picker (6 riders, accent colors), 4 bottom tabs (Trip / World Cup / Games / You). Loads each section into an iframe passing `?rider=N`. Native You tab. Loading spinner on tab switch.
2. **section-trip.html** — the Trip section. Full-screen shatter lock-screen countdown → swipe up to Home → city carousel + Overview toggle → per-city detail with itinerary (List/Map toggle), flights, lodging, cars, reservations. **~66KB, the biggest/most active file.**
3. **section-worldcup.html** — FotMob-style World Cup section. LIVE API data (fixtures, standings, team pages, squads). Top tabs: Matches / Table / Bracket.
4. **section-games.html** — themed Panini sticker album (pack-opening, real player photos). **PARKED** — Emre is polishing this himself as a surprise for a friend. Don't touch unless asked.
5. **wcr-data.js** — shared data module: 48-team color map, real TEAM_DATA (name→{id, crest, code}), API helpers, group-id→letter map, fixtures fetcher.
6. **supabase-edge-function.ts** — the deployed Supabase proxy code (reference copy; the real one is deployed in Supabase).

---

## How it's deployed (the stack)

- **Host:** GitHub Pages. Emre publishes by replacing files in the repo → auto-deploys in ~1 min. `index.html` is the entry point.
- **Live sports data:** **Supabase Edge Function** acts as a token-vault + CORS proxy in front of the SportMonks API.
  - Project ref: `soszhnqkxsbamqnqlkgt`
  - Proxy URL pattern: `https://soszhnqkxsbamqnqlkgt.supabase.co/functions/v1/sportmonks?path=...`
  - The function takes `?path=`, prepends the SportMonks base URL, appends the secret API token (stored as `SPORTMONKS_TOKEN` in Supabase secrets), returns JSON with CORS headers. JWT verification is OFF.
- **SportMonks plan:** Paid **€69 "World Cup 2026" Advanced** plan (the €29 Starter does NOT cover WC2026). Active.
- **Maps:** **Mapbox GL JS v3.9** for the itinerary map view. Public token (`pk....`) is hardcoded in section-trip.html (it's a public token — safe, but should have a URL restriction set in the Mapbox dashboard for the GitHub Pages domain).

---

## Key API facts (SportMonks, World Cup 2026)

- **Season ID:** 26618. **Group Stage ID:** 77478590. League 732.
- **group_id → letter:** 253019=A, 253020=B, 253021=C, 253022=D (our group), 253023=E, 253024=F, 253025=G, 253026=H, 253027=I, 253028=J, 253029=K, 253030=L.
- **Group-stage fixtures** (real teams + times): `fixtures?filters=fixtureStages:77478590&include=scores;state&per_page=50&page=N` — paginated. The `name` field is "Mexico vs South Africa" (split on " vs "). `participants` include does NOT attach team objects, so match teams by NAME against TEAM_DATA in wcr-data.js.
- **Knockout fixtures** are placeholders ("Winner Match X", "2nd Group D") — expected, teams TBD.
- **Teams (crests + IDs):** `teams/seasons/26618` — each has id, name, short_code, image_path (crest URL).
- **Squad (photos):** `teams/{id}?include=players.player` — player.display_name, player.image_path (headshot), jersey_number (often null this far out), position_id (24=GK, 25=DEF, 26=MID, 27=FWD).
- **Standings:** `standings/seasons/26618` — participant_id, group_id, position, points. ALL ZEROS until the tournament starts June 11. The W/D/L/GD field names are guessed (games_played/won/draw/lost/goals_scored/goals_against) — verify once games are played.
- **Key team IDs:** Türkiye=18716, Paraguay=18723, Australia=18730, USA=18571, Mexico=18576, Germany=18660. (NOTE: an earlier wrong map had Türkiye=18647 which is actually France — the real TEAM_DATA in wcr-data.js is correct now.)

I cannot fetch the Supabase URL directly. To get fresh API data, Emre pastes results from the browser. Test URLs by opening the proxy URL in a browser.

---

## Real trip data baked into the app

### People + flights (per person — each sees their own flights)
- **Emre + Ali:** United UA 1826, EWR (Newark/NYC) → SAN (San Diego), Jun 12, 4:59 PM → 7:52 PM. Return LAX → NYC Jun 23, 9:00 PM → 5:18 AM.
- **Ali K:** Delta DL 685, JFK → SAN, Jun 12, 8:29 PM → 11:39 PM. Return LAX → NYC Jun 23.
- **Kaan (full loop):** LHR → SAN (AA 6986) Jun 12 2:30 PM → 5:50 PM; SAN → PHX (AA 625) Jun 15 6:25 AM → 8:02 AM, seat 8F; PHX → SFO (AA 686) Jun 17 8:22 PM → 10:23 PM, seat 8F; return LAX → LHR (AA 136) Jun 23 6:05 PM → 12:45 PM, seat 32J.
- **KD:** SF arrival flight UNKNOWN. Return LAX → NYC Jun 23.
- **Mekin:** Chicago (ORD) → SFO Jun 17, details UNKNOWN.
- **ALL PRICES ARE UNKNOWN / blank ("Add it")** — to be collected per-person later. Budget is the original purpose but is NOT the current focus until prices are known.

### Cities / route (per-person visibility via `seenBy`)
- **00 San Diego** (Jun 12–17) — only Emre, Ali, Ali K, Kaan see it (`seenBy:[0,2,3,5]`). Kaan's card shows "Until Jun 15 · then Arizona" (he leaves early). KD & Mekin don't see it.
- **01 San Francisco** (Jun 17–19) — everyone lands. **Full itinerary built** (see below) with List/Map toggle.
- **02 Santa Clara** (Jun 19–20) — bike ride + match day. Full itinerary built.
- **03 Monterey / Carmel** (Jun 20–21)
- **04 Big Sur → Santa Barbara** (Jun 21–22)
- **05 Santa Monica / LA** (Jun 22–23) — `flightOut:true` shows everyone's return flight home.

### Hotels (real receipts, split ÷6)
- **Residence Inn Sunnyvale Silicon Valley I**, 750 Lakeway Dr, Sunnyvale CA 94085. Jun 19→20. 1× Penthouse 2BR. $370.76. Conf 72073179604705. (Emre once called it "Hampton Inn" — same place; receipt is the source of truth.) Mekin & Kaan are on the sofa bed (known tradeoff).
- **Portola Hotel & Spa, Monterey**, Two Portola Plaza, Monterey CA 93940. Jun 20→21. 2× Portola Room Two Queen. $634.75. Conf 72073355187522.
- Santa Barbara + Santa Monica hotels: NOT booked yet ($0).

### Cars (real receipts, split ÷6)
- **2× Jeep Wrangler** (open-air 4WD): pickup Jun 20 9:30 AM Santa Clara, drop Jun 22 9:30 AM. $807.56 total (conf 73452524856605 + 73463265910668).
- **1× Full-size SUV** (7-pax): pickup Jun 22 6:30 PM, drop Jun 23 6:15 PM. $179.82. Conf 73425481040001.

### SF itinerary (built, with real coordinates for the map)
Main day: Battery Spencer 9a → Palace of Fine Arts 10a → Wharf breakfast 10:45a → Ghirardelli/Pier 39 11:30a → Lombard St 1p → Chinatown (Good Mong Kok) 1:30p → Painted Ladies 2:30p → Mission/Clarion Alley 3:15p → hotel 4:30p → **San Ho Won dinner 7p**.

### Santa Clara / Friday Jun 19 (built)
Breakfast 8a → bike pickup 9a → ride Wharf→GG Bridge→Sausalito 9:30a → Sausalito 11:30a → lunch 12p → ferry back 1p → drop bikes 1:30p → drive to Santa Clara 2p → check in Residence Inn 3p → **TÜRKIYE MATCH 9p**.

---

## What's DONE and working

- ✅ Full-screen shatter lock screen + TikTok-style swipe-up to Home (one-way; lock only reachable from Home).
- ✅ Per-person flights — each rider sees their own legs; San Diego + return-home flights show on the right cities.
- ✅ Trip view toggle: **By City** (carousel) ⇄ **Overview** (by-type cards: Flights / Stays / Cars / Bookings, each aggregating the whole trip).
- ✅ Itinerary **List ⇄ Map** toggle. Map = large (72vh), Mapbox dark 3D, fly-in intro, pins drop staggered + color-coded by type, animated route line draws stop-to-stop, tap pin → popup with "Open in Maps" Google link. (SF has coords; other cities need coords added.)
- ✅ World Cup section: live fixtures grouped by real dates, real crests (round flag images), tap any team → live team page (next match, form for Türkiye, squad with photos, group standing), match detail Preview (hero banner, group standings, tappable teams), Table tab (all 12 group tables with crests + qual color bars, Türkiye green), Bracket tab stubbed.
- ✅ Panini (PARKED — Emre polishing solo).
- ✅ Deployment: GitHub Pages + Supabase function, all live.

---

## PENDING / next up (rough priority)

1. **Cars on correct days** (NOT done yet): Wranglers should surface on **Saturday Jun 20** (Monterey/Carmel pickup day); SUV on **Tuesday Jun 23** (SB→LAX pickup day). Currently cars module aggregates all; this is about showing the right car on the right city/day.
2. **Map for the other cities** — add coordinates + map view to Monterey, Big Sur/SB, Santa Monica, San Diego (SF is the only one with coords so far).
3. **Login questions system** — when a person picks their name, ask for their missing info (mainly flight prices, plus KD's SF flight + Mekin's flight details). Structure exists; not built.
4. **Budget** — the original purpose. Don't build out until prices are collected. Per-person totals (their flights + share of hotels/cars).
5. **Restaurant reservation links** — food stops currently link to Google Maps search; could add specific reservation URLs per restaurant.
6. **Remaining itineraries** — Monterey/Carmel, Big Sur, Santa Monica day plans.
7. **World Cup:** last-5-games form per team (parked), knockout bracket page (real placeholder fixtures exist), verify standings W/D/L/GD field names once games play.
8. **Predictor game** — Emre is building; results to feed the WC match preview later.

---

## Design system

- Fonts: Anton / Archivo Black (display), DM Sans (body), Space Mono (mono).
- Per-person accent colors: `["#ff6b4a","#ffb347","#ff4d8d","#4ad6c4","#7c8cff","#ffd447"]`.
- Trip dark bg `#07080f`. World Cup: FotMob black + green `#16e06a`. Panini: maroon.

---

## How Emre works (important)

- **Bottom line first, tight, actionable.** Hates fluff. Wants a decision/number, not "it depends."
- Beginner→developing on dev/APIs — explain in plain language, no jargon dumps. He gets confused by technical detail.
- Communicates casually, often driving / can't read long replies — keep it scannable.
- Pushes for **wow factor** and fun design. "Don't make it break."
- Syntax-check edited JS (e.g. `node -e`) before declaring done.
- He values being challenged with strong reasoning, and honest flags about what's real data vs. placeholder.

---

## Critical gotchas

- All 6 files must stay in the **same folder** (relative paths).
- The `seenBy` array on cities controls per-person visibility; San Diego is index 0, which shifted LODGING keys to 2,3 and SHARED city indexes +1. Be careful with city indexing.
- GitHub push protection flags the Mapbox `pk.` token as a "secret" — it's a false positive (public tokens are meant to be exposed). Set a URL restriction in Mapbox to be safe.
- The SportMonks `participants` include doesn't attach teams to fixtures — always match by team NAME via TEAM_DATA.
- Standings + live scores are EMPTY until June 11 (tournament start) — that's correct, not a bug. The app auto-fills when games begin.
