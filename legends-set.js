/* ============================================================
   WEST COAST RUN — LEGENDS promo set
   "Oldies but goldies" — veteran/legend cards, retro 1989-Fleer
   aged-photo treatment (a fin-legend finish layered on the
   existing sticker card; structure + stats unchanged).

   Each entry:
     name       display name on the nameplate
     team       MUST match a key in wcr-data.js TEAM_COLORS / TEAM_IDS
                (so the card auto-themes + the flag resolves)
     position   bucket string: Keepers | Defenders | Midfielders | Forwards
     player_id  SportMonks player id — fill from the feed to pull the
                real photo + stats. null = needs wiring.
     image_url  optional manual photo override (used for custom legends
                whose faces are NOT in the WC26 SportMonks feed)
     custom     true = a "create-your-own" all-time legend (no squad row)
   ============================================================ */

const LEGENDS_SET = [
  { name: "Cristiano Ronaldo", team: "Portugal",               position: "Forwards",    player_id: null, image_url: null, custom: false },
  { name: "Neymar",            team: "Brazil",                 position: "Forwards",    player_id: null, image_url: null, custom: false },
  { name: "Manuel Neuer",      team: "Germany",                position: "Keepers",     player_id: null, image_url: null, custom: false },
  { name: "Edin Džeko",        team: "Bosnia and Herzegovina", position: "Forwards",    player_id: null, image_url: null, custom: false },
  { name: "Yuto Nagatomo",     team: "Japan",                  position: "Defenders",   player_id: null, image_url: null, custom: false },
  { name: "Riyad Mahrez",      team: "Algeria",                position: "Forwards",    player_id: null, image_url: null, custom: false },
  { name: "Fernando Muslera",  team: "Uruguay",                position: "Keepers",     player_id: null, image_url: null, custom: false },
  { name: "Luka Modrić",       team: "Croatia",                position: "Midfielders", player_id: null, image_url: null, custom: false },
  { name: "James Rodríguez",   team: "Colombia",               position: "Midfielders", player_id: null, image_url: null, custom: false },
  { name: "Kevin De Bruyne",   team: "Belgium",                position: "Midfielders", player_id: null, image_url: null, custom: false },
  { name: "David Ospina",      team: "Colombia",               position: "Keepers",     player_id: null, image_url: null, custom: false },
  { name: "Ivan Perišić",      team: "Croatia",                position: "Midfielders", player_id: null, image_url: null, custom: false },
  { name: "Nicolás Otamendi",  team: "Argentina",              position: "Defenders",   player_id: null, image_url: null, custom: false },
  // Valencia + Ochoa: pull STATS from the feed (custom:false) but the feed PHOTOS
  // are bad — override with manual photos (drop good shots in legends-art/ ->
  // valencia.webp, ochoa.webp).
  { name: "Enner Valencia",    team: "Ecuador",                position: "Forwards",    player_id: null, image_url: "legends-art/valencia.webp", custom: false },
  { name: "Guillermo Ochoa",   team: "Mexico",                 position: "Keepers",     player_id: null, image_url: "legends-art/ochoa.webp", custom: false },

  /* ---- all-time legends (custom cards — faces NOT in the WC26 feed, supply image_url;
          note: Italy isn't in wcr-data.js TEAM_COLORS, so add it or set colors manually)

     LEGEND CARD RENDER SPEC:
       • image_url is a CLEAN full-bleed national-team photo (no chrome baked in).
       • The APP renders the chrome via a NEW premium finish `fin-legend` — the
         TOP rarity tier, a notch ABOVE diamond. Rank: common < gold < diamond < LEGEND.
       • Reuse the app's card framework + fonts (Anton / Archivo Black), so legends
         feel part of the set — but more premium: polished metallic-gold frame,
         continuous gold foil sheen, "LEGENDS" wordmark top, app-style name banner
         on a black+gold bar, position tag + national flag chip (same as squad cards).
       • NO stat-chip panel (no feed stats); use a "LEGEND" pill where the rarity tag sits.
       • Photo fills the card (object-fit: cover). Clean photos live in legends-art/.   */
  { name: "Gianluigi Buffon", team: "Italy",  position: "Keepers",     player_id: null, image_url: "legends-art/buffon.webp",         custom: true },
  { name: "Roberto Carlos",   team: "Brazil", position: "Defenders",   player_id: null, image_url: "legends-art/roberto-carlos.webp", custom: true },
  { name: "Sergio Ramos",     team: "Spain",  position: "Defenders",   player_id: null, image_url: "legends-art/ramos.webp",          custom: true },
  { name: "Andrea Pirlo",     team: "Italy",  position: "Midfielders", player_id: null, image_url: "legends-art/pirlo.webp",          custom: true },
  { name: "Thierry Henry",    team: "France", position: "Forwards",    player_id: null, image_url: "legends-art/henry.webp",          custom: true },
];

/* expose globally for section-games.html (same pattern as wcr-data.js) */
window.LEGENDS_SET = LEGENDS_SET;
