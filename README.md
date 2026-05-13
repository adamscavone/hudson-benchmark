# Hudson · Peer Benchmark

A personal-curiosity benchmark of Hudson, Ohio's city services and amenities
against thirteen wealth- and size-matched Ohio peer cities.

**Live page:** `https://adamscavone.github.io/hudson-benchmark/` (after deploy)

**Passphrase:** `western reserve` (cosmetic gate — see Privacy below)

## What it is

A single-page, dark-theme HTML benchmark. The 13 peers are split into three
tiers:

- **Tier A — Core peers.** Solon, Aurora, Bay Village, Rocky River, Powell,
  Bexley, Worthington, New Albany, Upper Arlington, Montgomery.
- **Tier B — Boutique comparators.** Chagrin Falls, Madeira, Mariemont.
- **Tier C — Deliberate contrasts.** Medina, Ravenna.

Plus a separate "aspirational exemplars" sidebar (Dublin, Mason, Brecksville)
for cities that are too big to be peers but illustrate specific assets.

## What's measured

- Parks, recreation, trails, pools, pickleball, dog parks, etc.
- Civic / cultural amenities — library, community center, senior center,
  public art, ice rinks
- Events & traditions — farmers markets, concert series, fireworks
- Utilities — municipal electric, municipal fiber, water/sewer, EV chargers
- "Quiet convenience infrastructure" — deer management, mosquito, tree
  programs, leaf pickup, e-waste
- Public safety — staffing, response, ISO rating, dispatch model
- Downtown walkability
- Schools (one-liner per district)
- Costs — municipal income tax, effective property tax, water/sewer rates

## Privacy

The page uses **three layers of cosmetic privacy**, none of which is real
security:

1. `<meta name="robots" content="noindex, nofollow, noarchive">` to
   discourage indexing.
2. `robots.txt` disallowing all paths.
3. A client-side passphrase gate (SHA-256 hash check in `docs/app.js`).

**This is not real security.** The underlying `data.json` is public and the
page source is viewable. The gate keeps crawlers and casual visitors out —
nothing more. Don't store secrets here.

To change the passphrase, regenerate the SHA-256 hash and replace
`PASS_HASH` in `docs/app.js`. Instructions are in the comment above the
constant.

## Methodology

Peer cities were selected on population (~10K-30K) and median household
income (Hudson is ~$171K; peers are mostly top-quartile in Ohio).
Methodology was pressure-tested with Gemini and OpenAI Codex via the
`outsource` skill — see `collection/methodology-notes.md`.

Census numbers come from QuickFacts and ACS 5-year tables. Effective
property tax rates come from county auditor tax schedules per ORC 323.08
— the only fair way to compare across counties. Municipal income tax
rates come from the Ohio Department of Taxation "Finder" tool.

Amenity facts come from each city's official website, parks/rec catalogs,
and library sites. No statewide municipal-amenities registry exists.

## Layout

```
hudson-benchmark/
├── docs/                  # GitHub Pages source
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── data.json          # all city data
│   ├── robots.txt
│   └── assets/
│       ├── photos/        # CC/PD hero images, per-city cards
│       └── icons/         # Lucide icons (inline SVG, MIT)
├── collection/            # raw research notes with source URLs
├── README.md
└── LICENSES.md            # per-asset license & credit
```

## Local preview

The page is plain HTML — open `docs/index.html` directly in a browser,
or run a simple static server:

```sh
cd docs && python -m http.server 8000
# open http://localhost:8000
```

## Caveats

- **Rocky River.** Median HH income ≈$94K, well below Hudson's ≈$171K.
  Kept in Tier A on geographic/cultural grounds; flagged transparently.
- **Medina, Ravenna.** Explicit Tier C contrasts — not wealth peers.
- **Data freshness.** Amenity inventories were captured at a point in
  time. Cities add and remove things; assume some drift.
- **Schools.** Included as a sidebar, not the focus. Districts are
  separate legal entities from the cities.

## License

Code in this repo: MIT.
Imagery: see `LICENSES.md` for per-asset credits and license terms.
Data: factual claims drawn from public sources; not copyrighted as such.
