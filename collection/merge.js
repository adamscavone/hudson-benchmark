#!/usr/bin/env node
/* Merge regional research JSON files into docs/data.json.
   - Loads current docs/data.json
   - Loads ne-ohio-research.json, columbus-research.json, cincinnati-research.json
   - For each city in regional research, deep-merges utilities/civic/amenities/schools/costs/sources
   - Updates aspirational[] cards from research (Brecksville, Dublin, Mason, UA)
   - Updates hudson_distinctives[] to reflect that Dublin also has municipal fiber
   - Preserves Hudson's manually-curated content
   - Writes back to docs/data.json
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'docs', 'data.json');
const REGIONS = ['ne-ohio', 'columbus', 'cincinnati'];

function load(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function save(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2)); }

const data = load(DATA_PATH);
const research = {};
for (const r of REGIONS) {
  const obj = load(path.join(__dirname, `${r}-research.json`));
  for (const [key, val] of Object.entries(obj)) {
    if (key === '_meta') continue;
    research[key] = val;
  }
}

// Deep-ish merge: for utilities/civic/costs/schools, merge keys; for amenities, prefer research; sources concat unique by URL
function mergeCity(target, src) {
  if (!src) return target;
  for (const field of ['utilities', 'civic', 'costs', 'schools']) {
    if (src[field]) target[field] = { ...(target[field] || {}), ...src[field] };
  }
  if (src.amenities) {
    target.amenities = { ...(target.amenities || {}), ...src.amenities };
  }
  if (src.sources) {
    const existing = new Set((target.sources || []).map(s => s.url));
    target.sources = [
      ...(target.sources || []),
      ...src.sources.filter(s => !existing.has(s.url))
    ];
  }
  return target;
}

// Cities in data.json (the 16) get merged from research where keys match
let mergedCount = 0;
for (const city of data.cities) {
  if (research[city.key]) {
    mergeCity(city, research[city.key]);
    mergedCount++;
  }
}

// Refresh aspirational cards from research where we have it
const aspirationalSources = {
  'upper-arlington': {
    name: 'Upper Arlington',
    size_note: 'Pop. ~36K · larger',
    body: 'The Ohio gold-standard suburb. <strong>Bob Crane Community Center</strong> (3200 Tremont Rd) is ~165,000 sq ft across 5 floors with an indoor pool, two gyms, walking track, art gallery, e-sports room, and cafe — winner of top OPRA awards. UA also operates three outdoor pools, the <strong>Labor Day Arts Festival</strong> (since 1966, 15K+ visitors), and an <strong>independent UA Public Library</strong> established by Ohio HB 494 in 1967.'
  },
  'dublin': {
    name: 'Dublin',
    size_note: 'Pop. ~52K · much larger',
    body: '<strong>Art in Public Places</strong> is the most formal municipal public-art program in Ohio: established 1988, 60+ permanent installations, a 2021 Master Plan, funded by 6% hotel/motel tax. Dublin also operates <strong>DubLink</strong> — a 100 Gbps municipal fiber backbone — and is rolling out <strong>Fiber to Every Home</strong> (substantially complete 2026). 130+ miles of paved trails. <strong>Dublin has municipal fiber, too</strong> — Hudson is not alone in this benchmark.'
  },
  'mason': {
    name: 'Mason',
    size_note: 'Pop. ~37K · larger',
    body: '<strong>Mason Community Center</strong> (150,000+ sq ft) + the attached Municipal Aquatic Center: zero-depth leisure pool with spray geysers and tot-slide, lazy river / whirlpool, a <strong>three-story flume slide</strong>, and a 25m × 25yd 11-lane competition pool seating ~800. Mason also has <strong>8 dedicated pickleball courts</strong> at Heritage Oak Park, Pawmyra Dog Park (three size-segregated areas), and 330+ acres of developed parks. Municipal water/sewer/stormwater/trash.'
  },
  'brecksville': {
    name: 'Brecksville',
    size_note: 'Pop. ~14K · NE Ohio aquatics benchmark',
    body: 'Too small to be a peer on population, but the <strong>Jack A. Hruby Natatorium</strong> (2021, $10M expansion) is the aspirational rec-aquatics benchmark for NE Ohio: indoor activity pool with two enclosed waterslides, 6-lane competition pool, and an outdoor pool with a <strong>rock-climbing wall, zipline, and dump bucket</strong>. Bow hunting allowed for deer management. Cleveland Metroparks Brecksville Reservation (3,026 acres) abuts the city.'
  }
};
data.aspirational = Object.values(aspirationalSources);

// Update Hudson distinctives — Dublin has muni fiber, correct the claim
const fiberDistinctive = data.hudson_distinctives.find(d => d.title.includes('Velocity'));
if (fiberDistinctive) {
  fiberDistinctive.peers = 'Within this benchmark, only <strong>Dublin</strong> has equivalent: DubLink (100 Gbps muni backbone) plus Fiber to Every Home. Fairlawn ran a similar municipal-fiber project. Most peers rely on the cable incumbent and AT&amp;T/Verizon DSL/fiber.';
}
// Update municipal electric peer note to mention Dublin's water also is municipal — and to be more precise
const electricDistinctive = data.hudson_distinctives.find(d => d.title.includes('Public Power'));
if (electricDistinctive) {
  electricDistinctive.peers = 'Statewide comparators: Westerville, Wadsworth, Cleveland Public Power, and a handful of others run their own electric — <strong>but no other city in this benchmark does</strong>. All peers are FirstEnergy (NE Ohio), AEP Ohio (Columbus), or Duke Energy (Cincinnati).';
}
// Library — add specifics from research
const libDistinctive = data.hudson_distinctives.find(d => d.title.includes('Library'));
if (libDistinctive) {
  libDistinctive.peers = 'In this benchmark, <strong>Bexley Public Library</strong>, <strong>Rocky River Public Library</strong>, <strong>Worthington Libraries</strong>, <strong>Upper Arlington Public Library</strong>, <strong>Mason Public Library</strong>, and <strong>Reed Memorial Library</strong> (Ravenna) are also independent municipal libraries with their own taxing authority. Hudson is unusual in being <em>privately endowed</em> — the city is not on the hook for operating costs the way it would be for a typical municipal library.';
}
// First & Main — add references
const fmDistinctive = data.hudson_distinctives.find(d => d.title.includes('First'));
if (fmDistinctive) {
  fmDistinctive.peers = 'Closest analogs: <strong>New Albany Village Center / Market Square</strong> (planned Georgian) and <strong>Dublin Bridge Park</strong> (modern mixed-use). <strong>Worthington\'s Old Worthington high street</strong> and <strong>Mariemont Square</strong> (1920s Tudor, National Historic Landmark) are different vintages of the same idea.';
}
// Green & Clock Tower
const greenDist = data.hudson_distinctives.find(d => d.title.includes('Green'));
if (greenDist) {
  greenDist.peers = '<strong>Chagrin Falls</strong> Triangle Park, <strong>Worthington</strong> Village Green, <strong>Medina</strong> Public Square (Victorian courthouse square), and <strong>Mariemont Square</strong> are the comparable historic civic spaces.';
}
// Holiday lighting
const holidayDist = data.hudson_distinctives.find(d => d.title.includes('Holiday') || d.title.includes('Christmas'));
if (holidayDist) {
  holidayDist.peers = '<strong>Chagrin Falls</strong> goes big on Main Street (plus the New Year\'s Giant Popcorn Ball Drop). <strong>Mariemont</strong>\'s Luminaria Festival is genuinely distinct. <strong>Medina</strong>\'s Candlelight Walk and Ice Festival are square-anchored. Most other peers do tasteful but standard municipal decorations.';
}

// Bump version + compiled
data.meta.version = '0.2';
data.meta.compiled = new Date().toISOString().slice(0, 10);

save(DATA_PATH, data);
console.log(`Merged ${mergedCount} cities from research files.`);
console.log(`Aspirational cards: ${data.aspirational.length}`);
console.log(`Hudson distinctives: ${data.hudson_distinctives.length}`);
console.log(`Total cities: ${data.cities.length}`);
