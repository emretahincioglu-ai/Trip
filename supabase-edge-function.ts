// ============================================================
// SUPABASE EDGE FUNCTION — "sportmonks"
// This runs ON Supabase's servers (not in the browser), so your
// SportMonks token stays secret and there is no CORS problem.
//
// HOW TO DEPLOY (you know Supabase, so this is quick):
//  1. In your Supabase project: Edge Functions → Create function → name it "sportmonks"
//  2. Paste this whole file as the function code.
//  3. Add your token as a secret (Settings → Edge Functions → Secrets, or CLI):
//        SPORTMONKS_TOKEN = your_token_here
//  4. Deploy. Your function URL becomes:
//        https://YOURPROJECT.supabase.co/functions/v1/sportmonks
//  5. Put that URL + your anon key into wcr-data.js (SM_PROXY / SM_ANON).
//
// The frontend calls:  {function}?path=fixtures?filters=...
// and this adds the base URL + token, then returns the JSON.
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const BASE = "https://api.sportmonks.com/v3/football/";

// CORS headers so your GitHub Pages site is allowed to call this
const cors = {
  "Access-Control-Allow-Origin": "*",            // tighten to your domain later if you want
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  // browser preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const token = Deno.env.get("SPORTMONKS_TOKEN");
  if (!token) {
    return new Response(JSON.stringify({ error: "SPORTMONKS_TOKEN secret not set" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }

  // read the requested SportMonks path
  const url = new URL(req.url);
  const path = url.searchParams.get("path");
  if (!path) {
    return new Response(JSON.stringify({ error: "missing ?path=" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }

  // build the real SportMonks URL (add token, handle existing ? in path)
  const sep = path.includes("?") ? "&" : "?";
  const target = `${BASE}${path}${sep}api_token=${token}`;

  try {
    const r = await fetch(target);
    const body = await r.text(); // pass through as-is
    return new Response(body, {
      status: r.status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }),
      { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
