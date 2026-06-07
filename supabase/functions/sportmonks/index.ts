// ============================================================
// SUPABASE EDGE FUNCTION - "sportmonks"
// Proxies SportMonks, Splitwise, the Claude API, a one-time card seeder,
// AND the Phase-1 collection economy (wallet / daily / packs / inventory).
//
// Secrets: SPORTMONKS_TOKEN, SPLITWISE_TOKEN, ANTHROPIC_API_KEY.
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected automatically and are
// used (service role) to read/write the RLS-locked economy tables.
//
// Requires (run once in SQL editor before using the economy routes):
//   alter table wallets add column if not exists free_packs       int not null default 0;
//   alter table wallets add column if not exists packs_since_good int not null default 0;
//   -- and at least one profiles row per rider (rider_id -> account).
//
// ROUTES:
//   ?path=...                              -> SportMonks (default, GET)
//   ?api=splitwise&path=...                -> Splitwise (GET)
//   ?api=claude   (POST, JSON {prompt})    -> Claude API; returns model text
//   ?api=seedcards[&from=&to=&reset=1]     -> one-time card-catalog seed (GET)
//   ?api=getWallet&rider_id=N              -> {coins, freePacks}
//   ?api=claimDaily&rider_id=N             -> grant daily coins+packs once/day
//   ?api=openPack&rider_id=N (POST {type}) -> open a normal/deluxe pack
//   ?api=getInventory&rider_id=N           -> owned cards (details + count)
// All economy numbers come from the `config` table (never hardcoded).
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SM_BASE = "https://api.sportmonks.com/v3/football/";
const SW_BASE = "https://secure.splitwise.com/api/v3.0/";
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const WC_SEASON_ID = 26618;
const SEED_BATCH = 12;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function jres(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function smFetch(path, token) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`${SM_BASE}${path}${sep}api_token=${token}`);
  if (!r.ok) throw new Error(`SportMonks ${r.status} on ${path}`);
  return r.json();
}

function isPlaceholderTeam(n) {
  if (!n) return true;
  return /^(winner|loser)\b/i.test(n) || /^\d(st|nd|rd)\s+group/i.test(n);
}

// --- card-rarity curation helpers (seedcards) ---
function kindOf(pos) {
  return ({ 24: "Keepers", 25: "Defenders", 26: "Midfielders", 27: "Forwards" })[pos] || "Midfielders";
}
function posRank(pos) {
  const m = { 27: 0, 26: 1, 25: 2, 24: 3 };
  return (m[pos] != null) ? m[pos] : 4;
}
const SEED_SHIRT = { 10: 0, 9: 1, 7: 2, 11: 3, 17: 4, 19: 5, 21: 6, 8: 7, 20: 8, 14: 9, 18: 10, 22: 11 };
function jerseyWeight(j) {
  if (j == null) return 60;
  const w = SEED_SHIRT[j];
  return (w != null) ? w : (30 + (Number(j) || 99));
}
function attackScore(p) { return posRank(p.pos) * 1000 + jerseyWeight(p.jersey); }
function seedNorm(s) {
  return ("" + s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
}
// CURATED override - pin specific stars per team (matched case/accent-insensitively).
// Names are forced to the FRONT of the ranking in the given order; the rest of the squad
// then fills by attacking priority. Final tiering of the top 11: top 2 = Diamond,
// next 3 = Gold, next 6 = Common. So curated[0..1] -> Diamond, curated[2..4] -> Gold, etc.
const CURATED = {
  // "Turkiye": ["Arda Guler", "Kenan Yildiz", "Hakan Calhanoglu", "Kerem Akturkoglu", "Ferdi Kadioglu"],
  // "Brazil":  ["Vinicius Junior", "Raphinha", "Rodrygo", "Estevao", "Bruno Guimaraes"],
};

// --- Supabase REST (service role) ---
function sbClient(SB_URL, SB_KEY) {
  const base = SB_URL + "/rest/v1/";
  const h = (extra) => ({
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
    ...(extra || {}),
  });
  return {
    async get(q) {
      const r = await fetch(base + q, { headers: h() });
      if (!r.ok) throw new Error(`GET ${q} -> ${r.status} ${await r.text()}`);
      return r.json();
    },
    async insert(table, body, prefer) {
      const r = await fetch(base + table, { method: "POST", headers: h({ Prefer: prefer || "return=representation" }), body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`INSERT ${table} -> ${r.status} ${await r.text()}`);
      return (prefer === "return=minimal") ? null : r.json();
    },
    async tryInsert(table, body) {
      const r = await fetch(base + table, { method: "POST", headers: h({ Prefer: "return=minimal" }), body: JSON.stringify(body) });
      let j = null; try { j = await r.json(); } catch (_e) {}
      return { ok: r.ok, status: r.status, json: j };
    },
    async patch(q, body) {
      const r = await fetch(base + q, { method: "PATCH", headers: h({ Prefer: "return=minimal" }), body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`PATCH ${q} -> ${r.status} ${await r.text()}`);
      return true;
    },
    async del(q) {
      const r = await fetch(base + q, { method: "DELETE", headers: h({ Prefer: "return=minimal" }) });
      if (!r.ok) throw new Error(`DELETE ${q} -> ${r.status} ${await r.text()}`);
      return true;
    },
  };
}
async function loadConfig(sb) {
  const rows = await sb.get("config?select=key,value");
  const c = {};
  for (const row of rows) c[row.key] = row.value; // jsonb -> JS number/object
  return c;
}
async function resolveProfile(sb, riderId) {
  if (riderId == null || riderId === "") return { error: "missing rider_id" };
  const rows = await sb.get(`profiles?rider_id=eq.${encodeURIComponent(riderId)}&select=id,name,rider_id`);
  if (!rows.length) return { error: `no profile for rider_id=${riderId}` };
  return { user: rows[0] };
}
async function ensureWallet(sb, userId) {
  const rows = await sb.get(`wallets?user_id=eq.${userId}&select=user_id,coins,free_packs,packs_since_good`);
  if (rows.length) return rows[0];
  const created = await sb.insert("wallets", { user_id: userId, coins: 0, free_packs: 0, packs_since_good: 0 });
  return created[0];
}
// resolve service-role client + config + validated profile from ?rider_id=
async function ecoCtx(url) {
  const SB_URL = Deno.env.get("SUPABASE_URL");
  const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SB_URL || !SB_KEY) return { error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not available", status: 500 };
  const sb = sbClient(SB_URL, SB_KEY);
  const riderId = url.searchParams.get("rider_id") ?? url.searchParams.get("rider");
  const u = await resolveProfile(sb, riderId);
  if (u.error) return { error: u.error, status: 400 };
  const cfg = await loadConfig(sb);
  return { sb, cfg, user: u.user };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const url = new URL(req.url);
  const api = (url.searchParams.get("api") || "sportmonks").toLowerCase();

  // ---- Claude route (POST with JSON body {prompt}; no ?path= needed) ----
  if (api === "claude") {
    try {
      const key = Deno.env.get("ANTHROPIC_API_KEY");
      if (!key) return jres({ error: "ANTHROPIC_API_KEY secret not set" }, 500);

      let prompt = "";
      try {
        const body = await req.json();
        prompt = (body && body.prompt) ? String(body.prompt) : "";
      } catch (_e) { /* handled below */ }
      if (!prompt) return jres({ error: "missing 'prompt' in JSON body" }, 400);

      const r = await fetch(CLAUDE_URL, {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 100,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!r.ok) {
        const err = await r.text();
        return new Response(err, { status: r.status, headers: { ...cors, "Content-Type": "application/json" } });
      }
      const data = await r.json();
      const text = Array.isArray(data && data.content)
        ? data.content.filter((b) => b && b.type === "text").map((b) => b.text).join("")
        : "";
      return new Response(text, { status: 200, headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" } });
    } catch (e) {
      return jres({ error: String(e) }, 502);
    }
  }

  // ---- Card-catalog seeding route (one-time, batched). GET ?api=seedcards ----
  if (api === "seedcards") {
    try {
      const smToken = Deno.env.get("SPORTMONKS_TOKEN");
      if (!smToken) return jres({ error: "SPORTMONKS_TOKEN secret not set" }, 500);
      const SB_URL = Deno.env.get("SUPABASE_URL");
      const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!SB_URL || !SB_KEY) return jres({ error: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not available" }, 500);
      const sbHeaders = (extra) => ({
        apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", ...(extra || {}),
      });

      // 1) ensure the "Group Stage" set exists
      let setsCreated = 0;
      let setId;
      const g = await fetch(`${SB_URL}/rest/v1/sets?name=eq.Group%20Stage&select=id`, { headers: sbHeaders() });
      const found = await g.json();
      if (Array.isArray(found) && found.length) {
        setId = found[0].id;
      } else {
        const c = await fetch(`${SB_URL}/rest/v1/sets`, {
          method: "POST", headers: sbHeaders({ Prefer: "return=representation" }),
          body: JSON.stringify({ name: "Group Stage", sort_order: 1, active: true }),
        });
        const created = await c.json();
        if (!c.ok) throw new Error("create set failed: " + JSON.stringify(created));
        setId = created[0].id;
        setsCreated = 1;
      }

      // 2) the 48 real WC teams (filter bracket placeholders), stable-sorted by id
      const teamsResp = await smFetch(`teams/seasons/${WC_SEASON_ID}`, smToken);
      const teams = (teamsResp.data || []).filter((t) => !isPlaceholderTeam(t.name)).sort((a, b) => a.id - b.id);
      const totalTeams = teams.length;

      const from = Math.max(0, parseInt(url.searchParams.get("from") || "0") || 0);
      const toParam = url.searchParams.get("to");
      const to = Math.min(totalTeams, toParam != null ? (parseInt(toParam) || 0) : from + SEED_BATCH);
      const slice = teams.slice(from, to);

      const reset = ["1", "true", "yes"].includes((url.searchParams.get("reset") || "").toLowerCase());
      let cleared = 0;
      if (reset && from === 0) {
        const del = await fetch(`${SB_URL}/rest/v1/cards?set_id=eq.${setId}`, { method: "DELETE", headers: sbHeaders({ Prefer: "return=representation" }) });
        if (!del.ok) throw new Error("clear cards failed: " + (await del.text()));
        const delRows = await del.json().catch(() => []);
        cleared = Array.isArray(delRows) ? delRows.length : 0;
      }

      const ex = await fetch(`${SB_URL}/rest/v1/cards?set_id=eq.${setId}&select=player_id,rarity`, { headers: sbHeaders() });
      const exRows = await ex.json();
      const seen = new Set((Array.isArray(exRows) ? exRows : []).map((r) => `${r.player_id}:${r.rarity}`));

      const rows = [];
      const picks = [];
      let teamsProcessed = 0;
      let skipped = 0;
      for (const at of slice) {
        let squad;
        try { squad = await smFetch(`teams/${at.id}?include=players.player`, smToken); }
        catch (_e) { continue; }
        const dedupe = new Set();
        const ps = [];
        const playerRows = (squad.data && squad.data.players) || [];
        for (const row of playerRows) {
          const p = row.player;
          if (!p || dedupe.has(p.id)) continue;
          dedupe.add(p.id);
          ps.push({ id: p.id, name: p.display_name || p.name, img: p.image_path || null, pos: row.position_id || 0, jersey: row.jersey_number || null });
        }
        if (!ps.length) { teamsProcessed++; continue; }

        const byAttack = ps.slice().sort((a, b) => attackScore(a) - attackScore(b));
        const curKey = Object.keys(CURATED).find((k) => seedNorm(k) === seedNorm(at.name));
        const curNames = curKey ? CURATED[curKey] : [];
        const findByName = (nm) => ps.find((p) => seedNorm(p.name) === seedNorm(nm)) || ps.find((p) => seedNorm(p.name).includes(seedNorm(nm)));

        // final ranking = curated names first (in order), then the rest by attacking priority
        const usedIds = new Set();
        const ranked = [];
        for (const nm of curNames) { const p = findByName(nm); if (p && !usedIds.has(p.id)) { ranked.push(p); usedIds.add(p.id); } }
        for (const p of byAttack) { if (!usedIds.has(p.id)) { ranked.push(p); usedIds.add(p.id); } }
        const top11 = ranked.slice(0, 11);

        // ONE rarity per player: top 2 = diamond, next 3 = gold, next 6 = common
        const tierOf = (idx) => (idx < 2 ? "diamond" : (idx < 5 ? "gold" : "common"));
        const mkBase = (pl) => ({ set_id: setId, player_id: pl.id, player_name: pl.name, team: at.name, image_url: pl.img });
        const add = (pl, rarity) => { const k = `${pl.id}:${rarity}`; if (seen.has(k)) { skipped++; return; } seen.add(k); rows.push({ ...mkBase(pl), rarity }); };
        const tierNames = { diamond: [], gold: [], common: [] };
        top11.forEach((pl, idx) => { const t = tierOf(idx); add(pl, t); tierNames[t].push(pl.name); });

        picks.push({ team: at.name, diamond: tierNames.diamond, gold: tierNames.gold, common: tierNames.common, curated: !!curKey });
        teamsProcessed++;
      }

      const inserted = { common: 0, gold: 0, diamond: 0 };
      if (rows.length) {
        const ins = await fetch(`${SB_URL}/rest/v1/cards`, { method: "POST", headers: sbHeaders({ Prefer: "return=minimal" }), body: JSON.stringify(rows) });
        if (!ins.ok) throw new Error("insert cards failed: " + (await ins.text()));
        for (const r of rows) inserted[r.rarity] = (inserted[r.rarity] || 0) + 1;
      }

      const done = to >= totalTeams;
      return jres({
        ok: true, setsCreated, cleared, setId, totalTeams,
        processedRange: { from, to }, teamsProcessed, inserted, insertedTotal: rows.length, skippedExisting: skipped, picks, done,
        next: done ? null : { from: to, to: Math.min(totalTeams, to + SEED_BATCH) },
        hint: done ? "All teams processed - card catalog seeded." : `Call again: ?api=seedcards&from=${to}&to=${Math.min(totalTeams, to + SEED_BATCH)}`,
      });
    } catch (e) {
      return jres({ ok: false, error: String(e) }, 502);
    }
  }

  // ---- Economy: getWallet ----
  if (api === "getwallet") {
    try {
      const ctx = await ecoCtx(url);
      if (ctx.error) return jres({ error: ctx.error }, ctx.status || 400);
      const w = await ensureWallet(ctx.sb, ctx.user.id);
      return jres({ ok: true, rider_id: ctx.user.rider_id, name: ctx.user.name, coins: w.coins || 0, freePacks: w.free_packs || 0 });
    } catch (e) { return jres({ error: String(e) }, 502); }
  }

  // ---- Economy: claimDaily ----
  if (api === "claimdaily") {
    try {
      const ctx = await ecoCtx(url);
      if (ctx.error) return jres({ error: ctx.error }, ctx.status || 400);
      const { sb, cfg } = ctx;
      const uid = ctx.user.id;
      const today = new Date().toISOString().slice(0, 10); // UTC date

      // read/create the wallet FIRST so a wallet problem can't strand a claim
      const w = await ensureWallet(sb, uid);

      // lock the day via the (user_id, claim_date) primary key (409 = already claimed)
      const claim = await sb.tryInsert("daily_claims", { user_id: uid, claim_date: today });
      const dup = claim.status === 409 || (claim.json && (claim.json.code === "23505"));
      if (dup) return jres({ ok: true, alreadyClaimed: true, coins: w.coins || 0, freePacks: w.free_packs || 0 });
      if (!claim.ok) throw new Error("daily_claims insert failed: " + JSON.stringify(claim.json));

      // credit; if anything below fails, release the claim row so the user can retry
      try {
        const addCoins = Number(cfg.daily_coins) || 0;
        const addPacks = Number(cfg.daily_free_packs) || 0;
        const coins = (w.coins || 0) + addCoins;
        const freePacks = (w.free_packs || 0) + addPacks;
        await sb.patch(`wallets?user_id=eq.${uid}`, { coins, free_packs: freePacks });
        await sb.insert("ledger", { user_id: uid, type: "daily", amount: addCoins, ref: `daily ${today}` }, "return=minimal");
        return jres({ ok: true, claimed: true, coinsAdded: addCoins, freePacksAdded: addPacks, coins, freePacks });
      } catch (creditErr) {
        try { await sb.del(`daily_claims?user_id=eq.${uid}&claim_date=eq.${today}`); } catch (_e) {}
        throw creditErr;
      }
    } catch (e) { return jres({ error: String(e) }, 502); }
  }

  // ---- Economy: openPack ----
  if (api === "openpack") {
    try {
      const ctx = await ecoCtx(url);
      if (ctx.error) return jres({ error: ctx.error }, ctx.status || 400);
      const { sb, cfg } = ctx;
      const uid = ctx.user.id;

      // pack type from JSON body {type} or ?type=
      let type = "normal";
      try { const body = await req.json(); if (body && body.type) type = String(body.type).toLowerCase(); } catch (_e) {}
      const qt = url.searchParams.get("type"); if (qt) type = qt.toLowerCase();
      if (type !== "normal" && type !== "deluxe") type = "normal";

      const w = await ensureWallet(sb, uid);
      const packSize = Number(cfg.pack_size) || 5;
      const pityPacks = Number(cfg.pity_packs) || 8;
      const weights = (type === "deluxe" ? cfg.rarity_weights_deluxe : cfg.rarity_weights_normal) || { common: 1 };
      const cost = Number(cfg[type === "deluxe" ? "pack_cost_deluxe" : "pack_cost_normal"]) || 0;

      // ---- payment ----
      let usedFreePack = false;
      let newCoins = w.coins || 0;
      let newFree = w.free_packs || 0;
      if (type === "normal" && (w.free_packs || 0) > 0) {
        usedFreePack = true; newFree = (w.free_packs || 0) - 1;
      } else {
        if ((w.coins || 0) < cost) return jres({ error: "insufficient coins", coins: w.coins || 0, cost }, 400);
        newCoins = (w.coins || 0) - cost;
      }

      // ---- catalog pool (active cards), bucketed by rarity ----
      const catalog = await sb.get("cards?active=is.true&select=id,player_name,team,rarity,image_url");
      if (!catalog.length) return jres({ error: "card catalog empty - run ?api=seedcards first" }, 400);
      const pool = { common: [], gold: [], diamond: [] };
      for (const c of catalog) { (pool[c.rarity] || (pool[c.rarity] = [])).push(c); }
      const isGood = (t) => t === "gold" || t === "diamond";
      const rollTier = () => { const r = Math.random(); let a = 0; for (const k of Object.keys(weights)) { a += Number(weights[k]) || 0; if (r < a) return k; } return "common"; };
      const pickFrom = (tier) => { for (const t of [tier, "gold", "diamond", "common"]) { const arr = pool[t]; if (arr && arr.length) return arr[Math.floor(Math.random() * arr.length)]; } return null; };

      // ---- roll pack_size cards (avoid exact dup within a pack when possible) ----
      const pulls = [];
      const inPack = new Set();
      for (let n = 0; n < packSize; n++) {
        const tier = rollTier();
        let c = pickFrom(tier);
        for (let tries = 0; c && inPack.has(c.id) && tries < 6; tries++) c = pickFrom(tier);
        if (c) { inPack.add(c.id); pulls.push(c); }
      }
      // ---- pity: guarantee gold-or-better at least every pity_packs packs ----
      const pityDue = (w.packs_since_good || 0) >= (pityPacks - 1);
      if (pityDue && !pulls.some((c) => isGood(c.rarity)) && (pool.gold.length || pool.diamond.length)) {
        const src = pool.gold.length ? pool.gold : pool.diamond;
        const g = src[Math.floor(Math.random() * src.length)];
        if (g) pulls[Math.floor(Math.random() * pulls.length)] = g;
      }
      const packHasGood = pulls.some((c) => isGood(c.rarity));

      // ---- new-vs-duplicate flags (vs current inventory) ----
      const ids = [...new Set(pulls.map((c) => c.id))];
      const invRows = ids.length ? await sb.get(`inventory?user_id=eq.${uid}&card_id=in.(${ids.join(",")})&select=card_id,count`) : [];
      const existing = {};
      for (const r of invRows) existing[r.card_id] = r.count;
      const ownedNow = new Set(ids.filter((id) => (existing[id] || 0) > 0));
      const revealed = pulls.map((c) => {
        const isNew = !ownedNow.has(c.id);
        ownedNow.add(c.id);
        return { card_id: c.id, player_name: c.player_name, team: c.team, rarity: c.rarity, image_url: c.image_url, isNew };
      });

      // ---- persist: payment + pity counter, inventory increments, ledger ----
      await sb.patch(`wallets?user_id=eq.${uid}`, { coins: newCoins, free_packs: newFree, packs_since_good: packHasGood ? 0 : ((w.packs_since_good || 0) + 1) });
      await sb.insert("ledger", { user_id: uid, type: "pack_buy", amount: usedFreePack ? 0 : -cost, ref: usedFreePack ? `free ${type}` : `${type} pack` }, "return=minimal");

      const perCard = {};
      pulls.forEach((c) => { perCard[c.id] = (perCard[c.id] || 0) + 1; });
      for (const id of ids) {
        if ((existing[id] || 0) > 0) await sb.patch(`inventory?user_id=eq.${uid}&card_id=eq.${id}`, { count: existing[id] + perCard[id] });
        else await sb.insert("inventory", { user_id: uid, card_id: id, count: perCard[id] }, "return=minimal");
      }
      for (const c of pulls) await sb.insert("ledger", { user_id: uid, type: "pull", amount: 0, ref: String(c.id) }, "return=minimal");

      return jres({ ok: true, type, usedFreePack, cost: usedFreePack ? 0 : cost, coins: newCoins, freePacks: newFree, cards: revealed });
    } catch (e) { return jres({ error: String(e) }, 502); }
  }

  // ---- Economy: getInventory ----
  if (api === "getinventory") {
    try {
      const ctx = await ecoCtx(url);
      if (ctx.error) return jres({ error: ctx.error }, ctx.status || 400);
      const rows = await ctx.sb.get(`inventory?user_id=eq.${ctx.user.id}&select=count,card:cards(player_id,player_name,team,rarity,image_url,set_id)`);
      const items = (rows || []).map((r) => ({ count: r.count, ...(r.card || {}) }));
      return jres({ ok: true, rider_id: ctx.user.rider_id, total: items.length, items });
    } catch (e) { return jres({ error: String(e) }, 502); }
  }

  // ---- SportMonks / Splitwise routes (GET with ?path=) ----
  const path = url.searchParams.get("path");
  if (!path) return jres({ error: "missing ?path=" }, 400);

  try {
    if (api === "splitwise") {
      const token = Deno.env.get("SPLITWISE_TOKEN");
      if (!token) return jres({ error: "SPLITWISE_TOKEN secret not set" }, 500);
      const r = await fetch(`${SW_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await r.text();
      return new Response(body, { status: r.status, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // default: sportmonks
    const token = Deno.env.get("SPORTMONKS_TOKEN");
    if (!token) return jres({ error: "SPORTMONKS_TOKEN secret not set" }, 500);
    const sep = path.includes("?") ? "&" : "?";
    const r = await fetch(`${SM_BASE}${path}${sep}api_token=${token}`);
    const body = await r.text();
    return new Response(body, { status: r.status, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return jres({ error: String(e) }, 502);
  }
});
