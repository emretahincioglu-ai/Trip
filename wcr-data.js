/* ============================================================
   WEST COAST RUN — shared data module
   Holds: 48-team color map, SportMonks config, API helpers.
   Both section-worldcup.html and section-games.html use this.
   ============================================================ */

/* ---- SUPABASE EDGE FUNCTION ENDPOINT ----
   The app NEVER calls SportMonks directly (CORS + token exposure).
   It calls your Supabase Edge Function, which holds the token and
   proxies the request. Set this to your function URL after deploy:
   e.g. "https://YOURPROJECT.supabase.co/functions/v1/sportmonks"   */
const SM_PROXY = "https://soszhnqkxsbamqnqlkgt.supabase.co/functions/v1/sportmonks";
const SM_ANON  = ""; // JWT verification is OFF on the function, so no key needed

/* SportMonks position_id → bucket */
const POS_MAP = {24:"Keepers",25:"Defenders",26:"Midfielders",27:"Forwards"};
function posBucket(id){return POS_MAP[id]||"Forwards";}

/* REAL team data from teams/seasons/26618 — name → {id, crest, code} */
const TEAM_DATA = {
 "Brazil":{id:18704,code:"BRA",crest:"https://cdn.sportmonks.com/images/soccer/teams/16/18704.png"},
 "New Zealand":{id:18613,code:"NZL",crest:"https://cdn.sportmonks.com/images/soccer/teams/21/18613.png"},
 "Bosnia and Herzegovina":{id:18625,code:"BIH",crest:"https://cdn.sportmonks.com/images/soccer/teams/1/18625.png"},
 "Côte d'Ivoire":{id:18560,code:"CIV",crest:"https://cdn.sportmonks.com/images/soccer/teams/0/18560.png"},
 "Haiti":{id:18804,code:"HTI",crest:"https://cdn.sportmonks.com/images/soccer/teams/20/18804.png"},
 "Qatar":{id:18544,code:"QAT",crest:"https://cdn.sportmonks.com/images/soccer/teams/16/18544.png"},
 "South Africa":{id:18555,code:"ZAF",crest:"https://cdn.sportmonks.com/images/soccer/teams/27/18555.png"},
 "Curacao":{id:18910,code:"CUW",crest:"https://cdn.sportmonks.com/images/soccer/teams/30/18910.png"},
 "Türkiye":{id:18716,code:"TUR",crest:"https://cdn.sportmonks.com/images/soccer/teams/28/18716.png"},
 "Saudi Arabia":{id:18562,code:"KSA",crest:"https://cdn.sportmonks.com/images/soccer/teams/2/18562.png"},
 "Australia":{id:18730,code:"AUS",crest:"https://cdn.sportmonks.com/images/soccer/teams/10/18730.png"},
 "Uruguay":{id:15251,code:"URU",crest:"https://cdn.sportmonks.com/images/soccer/teams/19/15251.png"},
 "France":{id:18647,code:"FRA",crest:"https://cdn.sportmonks.com/images/soccer/teams/23/18647.png"},
 "Spain":{id:18710,code:"ESP",crest:"https://cdn.sportmonks.com/images/soccer/teams/22/18710.png"},
 "Belgium":{id:18743,code:"BEL",crest:"https://cdn.sportmonks.com/images/soccer/teams/23/18743.png"},
 "Canada":{id:18572,code:"CAN",crest:"https://cdn.sportmonks.com/images/soccer/teams/12/18572.png"},
 "Korea Republic":{id:18567,code:"KOR",crest:"https://cdn.sportmonks.com/images/soccer/teams/7/18567.png"},
 "Ghana":{id:18553,code:"GHA",crest:"https://cdn.sportmonks.com/images/soccer/teams/25/18553.png"},
 "Colombia":{id:18720,code:"COL",crest:"https://cdn.sportmonks.com/images/soccer/teams/0/18720.png"},
 "Scotland":{id:18706,code:"SCO",crest:"https://cdn.sportmonks.com/images/soccer/teams/18/18706.png"},
 "Sweden":{id:18564,code:"SWE",crest:"https://cdn.sportmonks.com/images/soccer/teams/4/18564.png"},
 "United States":{id:18571,code:"USA",crest:"https://cdn.sportmonks.com/images/soccer/teams/11/18571.png"},
 "Croatia":{id:18588,code:"CRO",crest:"https://cdn.sportmonks.com/images/soccer/teams/28/18588.png"},
 "Jordan":{id:18559,code:"JOR",crest:"https://cdn.sportmonks.com/images/soccer/teams/31/18559.png"},
 "Panama":{id:18717,code:"PAN",crest:"https://cdn.sportmonks.com/images/soccer/teams/29/18717.png"},
 "Iraq":{id:18600,code:"IRQ",crest:"https://cdn.sportmonks.com/images/soccer/teams/8/18600.png"},
 "Ecuador":{id:18573,code:"ECU",crest:"https://cdn.sportmonks.com/images/soccer/teams/13/18573.png"},
 "Tunisia":{id:18554,code:"TUN",crest:"https://cdn.sportmonks.com/images/soccer/teams/26/18554.png"},
 "Uzbekistan":{id:18745,code:"UZB",crest:"https://cdn.sportmonks.com/images/soccer/teams/25/18745.png"},
 "Argentina":{id:18644,code:"ARG",crest:"https://cdn.sportmonks.com/images/soccer/teams/20/18644.png"},
 "Congo DR":{id:18552,code:"COD",crest:"https://cdn.sportmonks.com/images/soccer/teams/24/18552.png"},
 "Austria":{id:18643,code:"AUT",crest:"https://cdn.sportmonks.com/images/soccer/teams/19/18643.png"},
 "Egypt":{id:18546,code:"EGY",crest:"https://cdn.sportmonks.com/images/soccer/teams/18/18546.png"},
 "Cape Verde Islands":{id:18823,code:"CPV",crest:"https://cdn.sportmonks.com/images/soccer/teams/7/18823.png"},
 "Netherlands":{id:18694,code:"NED",crest:"https://cdn.sportmonks.com/images/soccer/teams/6/18694.png"},
 "Switzerland":{id:18708,code:"SUI",crest:"https://cdn.sportmonks.com/images/soccer/teams/20/18708.png"},
 "England":{id:18645,code:"ENG",crest:"https://cdn.sportmonks.com/images/soccer/teams/21/18645.png"},
 "Germany":{id:18660,code:"GER",crest:"https://cdn.sportmonks.com/images/soccer/teams/4/18660.png"},
 "Portugal":{id:18701,code:"POR",crest:"https://cdn.sportmonks.com/images/soccer/teams/13/18701.png"},
 "Senegal":{id:18558,code:"SEN",crest:"https://cdn.sportmonks.com/images/soccer/teams/30/18558.png"},
 "Norway":{id:18578,code:"NOR",crest:"https://cdn.sportmonks.com/images/soccer/teams/18/18578.png"},
 "Iran":{id:18652,code:"IRN",crest:"https://cdn.sportmonks.com/images/soccer/teams/28/18652.png"},
 "Morocco":{id:18551,code:"MAR",crest:"https://cdn.sportmonks.com/images/soccer/teams/23/18551.png"},
 "Czech Republic":{id:18718,code:"CZE",crest:"https://cdn.sportmonks.com/images/soccer/teams/30/18718.png"},
 "Mexico":{id:18576,code:"MEX",crest:"https://cdn.sportmonks.com/images/soccer/teams/16/18576.png"},
 "Japan":{id:18597,code:"JPN",crest:"https://cdn.sportmonks.com/images/soccer/teams/5/18597.png"},
 "Algeria":{id:18620,code:"DZA",crest:"https://cdn.sportmonks.com/images/soccer/teams/28/18620.png"},
 "Paraguay":{id:18723,code:"PRY",crest:"https://cdn.sportmonks.com/images/soccer/teams/3/18723.png"},
};
function teamInfo(name){
 if(!name) return null;
 if(TEAM_DATA[name]) return TEAM_DATA[name];
 const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const key=Object.keys(TEAM_DATA).find(k=>norm(k)===norm(name));
 return key?TEAM_DATA[key]:null;
}
/* reverse: team id → {name, crest, code} */
const ID_TO_TEAM={};
Object.keys(TEAM_DATA).forEach(n=>{ID_TO_TEAM[TEAM_DATA[n].id]={name:n,...TEAM_DATA[n]};});
function teamById(id){return ID_TO_TEAM[id]||null;}
function teamNameById(id){return ID_TO_TEAM[id]?ID_TO_TEAM[id].name:('Team '+id);}

/* World Cup 2026 season + group stage IDs (from SportMonks docs) */
const WC_SEASON_ID = 26618;
const WC_GROUP_STAGE_ID = 77478590;

/* ---- 48-TEAM COLOR MAP ----
   Each nation: primary, secondary, flag emoji.
   Used to auto-theme Panini pages + accents. SportMonks doesn't
   provide team colors, so this is the one hand-built table.
   Keyed by common country name (we match API team name to this). */
const TEAM_COLORS = {
  // Hosts
  "USA":           {c1:"#1a3a8c", c2:"#e0202c", fl:"🇺🇸"},
  "Mexico":        {c1:"#0a7d3b", c2:"#e0202c", fl:"🇲🇽"},
  "Canada":        {c1:"#e0202c", c2:"#ffffff", fl:"🇨🇦"},
  // UEFA
  "England":       {c1:"#ffffff", c2:"#e0202c", fl:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"},
  "France":        {c1:"#1a3a8c", c2:"#e0202c", fl:"🇫🇷"},
  "Croatia":       {c1:"#e0202c", c2:"#1a3a8c", fl:"🇭🇷"},
  "Norway":        {c1:"#ba0c2f", c2:"#00205b", fl:"🇳🇴"},
  "Portugal":      {c1:"#006600", c2:"#e0202c", fl:"🇵🇹"},
  "Germany":       {c1:"#000000", c2:"#dd0000", fl:"🇩🇪"},
  "Netherlands":   {c1:"#ff6b00", c2:"#1a3a8c", fl:"🇳🇱"},
  "Switzerland":   {c1:"#e0202c", c2:"#ffffff", fl:"🇨🇭"},
  "Scotland":      {c1:"#0065bf", c2:"#ffffff", fl:"🏴󠁧󠁢󠁳󠁣󠁴󠁿"},
  "Spain":         {c1:"#c60b1e", c2:"#ffc400", fl:"🇪🇸"},
  "Austria":       {c1:"#ed2939", c2:"#ffffff", fl:"🇦🇹"},
  "Belgium":       {c1:"#e30613", c2:"#ffd90c", fl:"🇧🇪"},
  "Bosnia and Herzegovina": {c1:"#002395", c2:"#ffd700", fl:"🇧🇦"},
  "Sweden":        {c1:"#006aa7", c2:"#fecc00", fl:"🇸🇪"},
  "Türkiye":       {c1:"#e30a17", c2:"#ffffff", fl:"🇹🇷"},
  "Turkey":        {c1:"#e30a17", c2:"#ffffff", fl:"🇹🇷"},
  "Czechia":       {c1:"#11457e", c2:"#d7141a", fl:"🇨🇿"},
  // CONMEBOL
  "Argentina":     {c1:"#75aadb", c2:"#ffffff", fl:"🇦🇷"},
  "Brazil":        {c1:"#ffdf00", c2:"#009c3b", fl:"🇧🇷"},
  "Uruguay":       {c1:"#5cbfeb", c2:"#ffffff", fl:"🇺🇾"},
  "Colombia":      {c1:"#fcd116", c2:"#003893", fl:"🇨🇴"},
  "Paraguay":      {c1:"#d52b1e", c2:"#1a3a8c", fl:"🇵🇾"},
  "Ecuador":       {c1:"#ffd100", c2:"#0072c6", fl:"🇪🇨"},
  // CONCACAF
  "Panama":        {c1:"#005293", c2:"#d21034", fl:"🇵🇦"},
  "Curaçao":       {c1:"#002b7f", c2:"#f9e814", fl:"🇨🇼"},
  "Curacao":       {c1:"#002b7f", c2:"#f9e814", fl:"🇨🇼"},
  "Haiti":         {c1:"#00209f", c2:"#d21034", fl:"🇭🇹"},
  // AFC
  "Japan":         {c1:"#1a3a8c", c2:"#ffffff", fl:"🇯🇵"},
  "Korea Republic":{c1:"#c60c30", c2:"#003478", fl:"🇰🇷"},
  "South Korea":   {c1:"#c60c30", c2:"#003478", fl:"🇰🇷"},
  "Iran":          {c1:"#239f40", c2:"#da0000", fl:"🇮🇷"},
  "Australia":     {c1:"#ffcd00", c2:"#00843d", fl:"🇦🇺"},
  "Saudi Arabia":  {c1:"#006c35", c2:"#ffffff", fl:"🇸🇦"},
  "Qatar":         {c1:"#8a1538", c2:"#ffffff", fl:"🇶🇦"},
  "Jordan":        {c1:"#007a3d", c2:"#ce1126", fl:"🇯🇴"},
  "Uzbekistan":    {c1:"#1eb53a", c2:"#0099b5", fl:"🇺🇿"},
  // CAF
  "Morocco":       {c1:"#c1272d", c2:"#006233", fl:"🇲🇦"},
  "Senegal":       {c1:"#00853f", c2:"#fdef42", fl:"🇸🇳"},
  "Tunisia":       {c1:"#e70013", c2:"#ffffff", fl:"🇹🇳"},
  "Algeria":       {c1:"#006233", c2:"#d21034", fl:"🇩🇿"},
  "Egypt":         {c1:"#ce1126", c2:"#000000", fl:"🇪🇬"},
  "Nigeria":       {c1:"#008751", c2:"#ffffff", fl:"🇳🇬"},
  "Ivory Coast":   {c1:"#ff8200", c2:"#009e60", fl:"🇨🇮"},
  "Ghana":         {c1:"#006b3f", c2:"#fcd116", fl:"🇬🇭"},
  "Cape Verde":    {c1:"#003893", c2:"#cf2027", fl:"🇨🇻"},
  "South Africa":  {c1:"#007a4d", c2:"#ffb612", fl:"🇿🇦"},
  "DR Congo":      {c1:"#007fff", c2:"#f7d618", fl:"🇨🇩"},
  // OFC
  "New Zealand":   {c1:"#000000", c2:"#ffffff", fl:"🇳🇿"},
};

/* fallback for any team not in the map (keeps the book from breaking) */
const DEFAULT_COLORS = {c1:"#5a5a6e", c2:"#2c2c3a", fl:"⚪"};
function colorsFor(name){
  if(!name) return DEFAULT_COLORS;
  if(TEAM_COLORS[name]) return TEAM_COLORS[name];
  // loose match (strip accents/case)
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const key = Object.keys(TEAM_COLORS).find(k=>norm(k)===norm(name));
  return key ? TEAM_COLORS[key] : DEFAULT_COLORS;
}

/* ---- API HELPER (via Supabase proxy) ----
   path = the SportMonks path after /v3/football, e.g.
   "fixtures?filters=fixtureSeasons:26618&include=participants;scores;state"
   The Edge Function appends the token + base URL. */
async function smFetch(path){
  if(SM_PROXY.startsWith("REPLACE")) {
    console.warn("[wcr] Supabase proxy not configured yet — returning null");
    return null;
  }
  try{
    const r = await fetch(SM_PROXY + "?path=" + encodeURIComponent(path), {
      headers: { "Authorization": "Bearer " + SM_ANON }
    });
    if(!r.ok){ console.error("[wcr] proxy error", r.status); return null; }
    return await r.json();
  }catch(e){ console.error("[wcr] fetch failed", e); return null; }
}

/* convenience calls */
/* World Cup 2026 group_id → group letter (from fixtures data) */
const GROUP_IDS = {
 253019:"A",253020:"B",253021:"C",253022:"D",253023:"E",253024:"F",
 253025:"G",253026:"H",253027:"I",253028:"J",253029:"K",253030:"L",
};
function groupLetter(id){return GROUP_IDS[id]||"?";}

/* fetch ALL group-stage fixtures across pages (104 matches, 25/page) */
async function fetchAllGroupFixtures(){
 const all=[]; let page=1;
 while(page<=8){
   const resp=await smFetch(`fixtures?filters=fixtureStages:${WC_GROUP_STAGE_ID}&include=scores;state&per_page=50&page=${page}`);
   if(!resp||!resp.data||!resp.data.length) break;
   all.push(...resp.data);
   if(!resp.pagination||!resp.pagination.has_more) break;
   page++;
 }
 return all;
}

const wcrApi = {
  groupFixtures: () => fetchAllGroupFixtures(),
  fixtures: () => smFetch(`fixtures?filters=fixtureStages:${WC_GROUP_STAGE_ID}&include=scores;state&per_page=50`),
  standings: () => smFetch(`standings/seasons/${WC_SEASON_ID}`),
  liveScores: () => smFetch(`livescores/inplay?include=scores;state;participants`),
  fixtureDetail: (id) => smFetch(`fixtures/${id}?include=scores;state;events.player;statistics.type;lineups.player;venue;participants`),
  teamSquad: (teamId) => smFetch(`teams/${teamId}?include=players.player`),
  seasonTeams: () => smFetch(`teams/seasons/${WC_SEASON_ID}`),
};

/* expose globally for the section files / iframes */
window.WCR = { TEAM_COLORS, colorsFor, smFetch, wcrApi, WC_SEASON_ID, WC_GROUP_STAGE_ID, SM_PROXY, SM_ANON, POS_MAP, posBucket, TEAM_DATA, teamInfo, teamById, teamNameById, ID_TO_TEAM, GROUP_IDS, groupLetter, fetchAllGroupFixtures };
