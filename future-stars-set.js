/* ============================================================
   WEST COAST RUN — FUTURE STARS promo set
   Best young players (mostly U21) at the 2026 World Cup.
   The counterpart to LEGENDS: instead of vintage/aged, this set
   reads brand-new — a neon / holographic-chrome finish.

   Each entry:
     name       display name on the nameplate
     team       MUST match a key in wcr-data.js TEAM_COLORS / TEAM_IDS
     position   bucket string: Keepers | Defenders | Midfielders | Forwards
     player_id  SportMonks player id — fill from the feed for photo + stats
     image_url  optional manual photo override (null = use feed photo)

   Structure mirrors LEGENDS: 15 CURRENT young players (photos + stats live from
   the SportMonks WC26 feed, no manual images) + 5 "young-breakout" LEGENDS
   (custom cards — icons who broke out as youngsters at a past World Cup; supply
   image_url, ideally a young/WC-era photo).

   FUTURE STARS RENDER SPEC (finish `fin-future`):
     • A promo finish that sits alongside the rarity finishes — the "new" tier,
       the visual opposite of LEGENDS' vintage treatment.
     • Reuse the app's standard card framework + fonts + stat-chip panel
       (these are real WC26 squad players, so they keep head-and-shoulders + stats).
     • Treatment: neon / holographic chrome — glowing edges, prism/iridescent foil
       sheen, cool electric accent, a "FUTURE" wordmark/tag (where the rarity tag sits).
     • No aged filter. Clean modern photo from the feed.
   ============================================================ */

const FUTURE_STARS_SET = [
  { name: "Joan García",         team: "Spain",     position: "Keepers",     player_id: null, image_url: null },
  { name: "Lamine Yamal",        team: "Spain",     position: "Forwards",    player_id: null, image_url: null },
  { name: "Désiré Doué",         team: "France",    position: "Forwards",    player_id: null, image_url: null },
  { name: "Endrick",             team: "Brazil",    position: "Forwards",    player_id: null, image_url: null },
  { name: "Kenan Yıldız",        team: "Türkiye",   position: "Forwards",    player_id: null, image_url: null },
  { name: "Arda Güler",          team: "Türkiye",   position: "Midfielders", player_id: null, image_url: null },
  { name: "João Neves",          team: "Portugal",  position: "Midfielders", player_id: null, image_url: null },
  { name: "Nico Paz",            team: "Argentina", position: "Midfielders", player_id: null, image_url: null },
  { name: "Kobbie Mainoo",       team: "England",   position: "Midfielders", player_id: null, image_url: null },
  { name: "Pau Cubarsí",         team: "Spain",     position: "Defenders",   player_id: null, image_url: null },

  /* ---- 5 "young-breakout" LEGENDS (custom cards) — icons who announced themselves
          as YOUNGSTERS at a World Cup (the Mbappé-2018 / Ronaldinho-2002 archetype).
          Faces NOT in the WC26 feed — supply image_url (ideally a young/WC-era photo).
          Render as the FUTURE premium tier. NOTE: Mbappé is still active — this is a
          2018-breakout tribute card. ---- */
  { name: "Pelé",            team: "Brazil",  position: "Forwards",  player_id: null, image_url: "future-stars-art/pele.webp",    custom: true },
  { name: "Ronaldo Nazário", team: "Brazil",  position: "Forwards",  player_id: null, image_url: "future-stars-art/ronaldo.webp", custom: true },
  { name: "Kylian Mbappé",   team: "France",  position: "Forwards",  player_id: null, image_url: "future-stars-art/mbappe.webp",  custom: true },
  { name: "Philipp Lahm",    team: "Germany", position: "Defenders", player_id: null, image_url: "future-stars-art/lahm.webp",    custom: true },
  { name: "Iker Casillas",   team: "Spain",   position: "Keepers",   player_id: null, image_url: "future-stars-art/casillas.webp", custom: true },
];

/* expose globally for section-games.html (same pattern as wcr-data.js / legends-set.js) */
window.FUTURE_STARS_SET = FUTURE_STARS_SET;
