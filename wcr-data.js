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

/* World Cup 2026 team IDs (participant_id) → country name */
const TEAM_IDS = {
 18660:"Germany",18704:"Argentina",18645:"England",18710:"Spain",18716:"Brazil",
 18743:"Portugal",18718:"Netherlands",18644:"France",18600:"Belgium",18552:"Croatia",
 18625:"Uruguay",18564:"Switzerland",18694:"USA",18571:"Mexico",18620:"Canada",
 18701:"Colombia",18588:"Japan",18823:"Korea Republic",18546:"Morocco",18910:"Senegal",
 18647:"Türkiye",18572:"Austria",18576:"Norway",18551:"Sweden",18804:"Ecuador",
 18553:"Paraguay",18558:"Australia",18544:"Iran",18597:"Czechia",18562:"Scotland",
 18652:"Tunisia",18745:"Egypt",18555:"Nigeria",18643:"Algeria",18723:"Ghana",
 18560:"Ivory Coast",18578:"Panama",18708:"Curaçao",18554:"Haiti",18720:"Qatar",
 18730:"Saudi Arabia",18613:"Uzbekistan",18559:"Jordan",18567:"South Africa",
 15251:"New Zealand",18573:"DR Congo",18717:"Cape Verde",18706:"Bosnia and Herzegovina",
};
function teamNameById(id){return TEAM_IDS[id]||("Team "+id);}

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
  // ---- API-spelling aliases (the live API uses these exact names) ----
  "United States":       {c1:"#1a3a8c", c2:"#e0202c", fl:"🇺🇸"},
  "Czech Republic":      {c1:"#11457e", c2:"#d7141a", fl:"🇨🇿"},
  "Cape Verde Islands":  {c1:"#003893", c2:"#cf2027", fl:"🇨🇻"},
  "Congo DR":            {c1:"#007fff", c2:"#f7d618", fl:"🇨🇩"},
  "Côte d'Ivoire":       {c1:"#ff8200", c2:"#009e60", fl:"🇨🇮"},
  "Iraq":                {c1:"#007a3d", c2:"#ce1126", fl:"🇮🇶"},
};

/* fallback for any team not in the map (keeps the book from breaking) */
const DEFAULT_COLORS = {c1:"#5a5a6e", c2:"#2c2c3a", fl:"⚪"};
function colorsFor(name){
  if(!name) return DEFAULT_COLORS;
  if(TEAM_COLORS[name]) return TEAM_COLORS[name];
  // loose match (strip accents, case, and all non-letters so apostrophe/spacing variants match)
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/gi,'').toLowerCase();
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
const wcrApi = {
  fixtures: () => smFetch(`fixtures?filters=fixtureSeasons:${WC_SEASON_ID}&include=participants;scores;state;venue&per_page=50`),
  standings: () => smFetch(`standings/seasons/${WC_SEASON_ID}?include=participant`),
  liveScores: () => smFetch(`livescores/inplay?filters=fixtureSeasons:${WC_SEASON_ID}&include=participants;scores;state`),
  fixtureDetail: (id) => smFetch(`fixtures/${id}?include=participants;scores;state;events.player;statistics.type;lineups.player;venue`),
  teamSquad: (teamId) => smFetch(`squads/teams/${teamId}?include=player.position`),
  seasonTeams: () => smFetch(`teams/seasons/${WC_SEASON_ID}?include=players.player`),
};

/* expose globally for the section files / iframes */
window.WCR = { TEAM_COLORS, colorsFor, smFetch, wcrApi, WC_SEASON_ID, WC_GROUP_STAGE_ID, SM_PROXY, SM_ANON, POS_MAP, posBucket, TEAM_IDS, teamNameById };
