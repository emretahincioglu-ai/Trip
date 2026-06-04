// ============================================================
// SUPABASE EDGE FUNCTION — "sportmonks"
// Now proxies BOTH SportMonks AND Splitwise.
//
// DEPLOY STEPS (same function, just paste this updated code):
//  1. Supabase project → Edge Functions → sportmonks → Edit
//  2. Replace with this file
//  3. Add the second secret (Settings → Edge Functions → Secrets):
//        SPLITWISE_TOKEN = your_splitwise_api_key
//     (SPORTMONKS_TOKEN already exists from before)
//  4. Deploy
//
// FRONTEND CALLS:
//   ?path=fixtures?filters=...           → SportMonks (backward compat, default)
//   ?api=splitwise&path=get_group/12345  → Splitwise
//   ?api=splitwise&path=get_current_user → Splitwise
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SM_BASE = "https://api.sportmonks.com/v3/football/";
const SW_BASE = "https://secure.splitwise.com/api/v3.0/";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const url = new URL(req.url);
  const api = (url.searchParams.get("api") || "sportmonks").toLowerCase();
  const path = url.searchParams.get("path");

  if (!path) {
    return new Response(JSON.stringify({ error: "missing ?path=" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }

  try {
    if (api === "splitwise") {
      const token = Deno.env.get("SPLITWISE_TOKEN");
      if (!token) {
        return new Response(JSON.stringify({ error: "SPLITWISE_TOKEN secret not set" }),
          { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
      }
      const target = `${SW_BASE}${path}`;
      const r = await fetch(target, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await r.text();
      return new Response(body, {
        status: r.status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // default: sportmonks
    const token = Deno.env.get("SPORTMONKS_TOKEN");
    if (!token) {
      return new Response(JSON.stringify({ error: "SPORTMONKS_TOKEN secret not set" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const sep = path.includes("?") ? "&" : "?";
    const target = `${SM_BASE}${path}${sep}api_token=${token}`;
    const r = await fetch(target);
    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }),
      { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
</content>
</invoke>