#!/usr/bin/env node
/* Apply photo credits to docs/data.json and regenerate LICENSES.md.
   Source of truth: the photo manifest embedded here (matches fetch-images.sh).
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'docs', 'data.json');
const LICENSES_PATH = path.join(ROOT, 'LICENSES.md');

const MANIFEST = [
  { key: 'hero', file: 'hudson-hero.jpg', photographer: 'Kevin Payravi', license: 'CC BY-SA 4.0', license_url: 'https://creativecommons.org/licenses/by-sa/4.0/', subject: 'Hudson Clock Tower, Historic District', page_url: 'https://commons.wikimedia.org/wiki/File:Clock_Tower_entrance_(Hudson,_Ohio).jpg' },
  { key: 'hudson', file: 'hudson.jpg', photographer: 'Kevin Payravi', license: 'CC BY-SA 4.0', license_url: 'https://creativecommons.org/licenses/by-sa/4.0/', subject: 'Hudson Historic District streetscape', page_url: 'https://commons.wikimedia.org/wiki/File:Hudson_Historic_District_section.jpg' },
  { key: 'solon', file: 'solon.jpg', photographer: 'Mayor Pez (Wikipedia user)', license: 'CC BY-SA 3.0', license_url: 'https://creativecommons.org/licenses/by-sa/3.0/', subject: 'Solon City Hall', page_url: 'https://commons.wikimedia.org/wiki/File:SolonCityHall.jpg' },
  { key: 'aurora', file: 'aurora.jpg', photographer: 'Nyttend', license: 'Public Domain', license_url: null, subject: 'Church and town hall, Aurora Center Historic District', page_url: 'https://commons.wikimedia.org/wiki/File:Church_and_town_hall_in_Aurora.jpg' },
  { key: 'bay-village', file: 'bay-village.jpg', photographer: 'Heather McLaughlin', license: 'CC BY 2.0', license_url: 'https://creativecommons.org/licenses/by/2.0/', subject: 'Huntington Beach, Lake Erie, with Cleveland skyline', page_url: 'https://commons.wikimedia.org/wiki/File:Huntington_Beach_With_Downtown_Cleveland_In_Background.jpg' },
  { key: 'rocky-river', file: 'rocky-river.jpg', photographer: 'Ken Winters, U.S. Army Corps of Engineers', license: 'Public Domain', license_url: null, subject: 'Aerial view of Rocky River harbor and Lake Erie entrance', page_url: 'https://commons.wikimedia.org/wiki/File:Rocky_River_Ohio_aerial_view.jpg' },
  { key: 'chagrin-falls', file: 'chagrin-falls.jpg', photographer: 'AngelP8823', license: 'CC BY 4.0', license_url: 'https://creativecommons.org/licenses/by/4.0/', subject: 'Chagrin Falls — the literal waterfall in downtown', page_url: 'https://commons.wikimedia.org/wiki/File:Chagrin_Falls_Waterfall,_Ohio.jpg' },
  { key: 'medina', file: 'medina.jpg', photographer: 'AngelP8823', license: 'CC BY 4.0', license_url: 'https://creativecommons.org/licenses/by/4.0/', subject: 'Uptown Park gazebo on Medina Public Square', page_url: 'https://commons.wikimedia.org/wiki/File:Uptown_Park,_Medina,_OH.jpg' },
  { key: 'ravenna', file: 'ravenna.jpg', photographer: 'JonRidinger', license: 'CC BY 3.0', license_url: 'https://creativecommons.org/licenses/by/3.0/', subject: 'Downtown Ravenna along Main Street', page_url: 'https://commons.wikimedia.org/wiki/File:Ravenna_downtown.jpg' },
  { key: 'bexley', file: 'bexley.jpg', photographer: 'Sixflashphoto', license: 'CC BY-SA 4.0', license_url: 'https://creativecommons.org/licenses/by-sa/4.0/', subject: 'Bexley City Hall', page_url: 'https://commons.wikimedia.org/wiki/File:Bexley_City_Hall_1.jpg' },
  { key: 'worthington', file: 'worthington.jpg', photographer: 'Nyttend', license: 'Public Domain', license_url: null, subject: 'Downtown Worthington, Old Worthington Historic District', page_url: 'https://commons.wikimedia.org/wiki/File:Downtown_Worthington,_Ohio.jpg' },
  { key: 'new-albany', file: 'new-albany.jpg', photographer: 'Sixflashphoto', license: 'CC BY-SA 4.0', license_url: 'https://creativecommons.org/licenses/by-sa/4.0/', subject: 'New Albany Village Hall', page_url: 'https://commons.wikimedia.org/wiki/File:New_Albany_City_Hall_1.jpg' },
  { key: 'upper-arlington', file: 'upper-arlington.jpg', photographer: 'Pi.1415926535', license: 'CC BY-SA 3.0', license_url: 'https://creativecommons.org/licenses/by-sa/3.0/', subject: 'Aerial view of Upper Arlington', page_url: 'https://commons.wikimedia.org/wiki/File:Aerial_view_of_Upper_Arlington,_September_2018.JPG' },
  { key: 'montgomery', file: 'montgomery.jpg', photographer: 'Nyttend', license: 'Public Domain', license_url: null, subject: 'Yost Tavern (1805), central Montgomery', page_url: 'https://commons.wikimedia.org/wiki/File:Yost_Tavern_angle.jpg' },
  { key: 'madeira', file: 'madeira.jpg', photographer: 'Ed! (Wikipedia user)', license: 'CC BY-SA 3.0', license_url: 'https://creativecommons.org/licenses/by-sa/3.0/', subject: 'Downtown Madeira streetscape', page_url: 'https://commons.wikimedia.org/wiki/File:Maderia_OH_USA.JPG' },
  { key: 'mariemont', file: 'mariemont.jpg', photographer: 'Greg Hume', license: 'CC BY-SA 4.0', license_url: 'https://creativecommons.org/licenses/by-sa/4.0/', subject: 'Mariemont Inn (1926) on the village square', page_url: 'https://commons.wikimedia.org/wiki/File:Mariemont_Inn.jpg' }
];

// Update data.json
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const byKey = Object.fromEntries(MANIFEST.map(m => [m.key, m]));

// Hero
if (byKey.hero) {
  data.meta.hero_image = {
    src: `assets/photos/${byKey.hero.file}`,
    credit: `Hudson Clock Tower, Historic District. Photo by <a href="${byKey.hero.page_url}" target="_blank" rel="noopener">${byKey.hero.photographer}</a> via Wikimedia Commons, ${byKey.hero.license}.`
  };
}

// Per-city photos
for (const city of data.cities) {
  const m = byKey[city.key];
  if (m) {
    city.photo = {
      src: `assets/photos/${m.file}`,
      alt: m.subject,
      credit: `Photo by ${m.photographer} via Wikimedia Commons, ${m.license}`,
      page_url: m.page_url
    };
  } else {
    // Powell — no photo; clear the placeholder so the SVG fallback shows
    delete city.photo;
  }
}

data.meta.version = '0.3';
data.meta.compiled = new Date().toISOString().slice(0, 10);
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

// Regenerate LICENSES.md
const rows = MANIFEST
  .filter(m => m.key !== 'hero')
  .map(m => {
    const lic = m.license_url
      ? `[${m.license}](${m.license_url})`
      : m.license;
    return `| \`docs/assets/photos/${m.file}\` | ${m.subject} | ${m.photographer} | ${lic} | [Commons](${m.page_url}) |`;
  })
  .join('\n');

const heroRow = byKey.hero
  ? `| \`docs/assets/photos/${byKey.hero.file}\` | ${byKey.hero.subject} (page hero) | ${byKey.hero.photographer} | [${byKey.hero.license}](${byKey.hero.license_url}) | [Commons](${byKey.hero.page_url}) |`
  : '';

const md = `# Asset licenses & credits

Per-asset credit table for every image, icon, and font used on the
benchmark page. Most assets are Creative Commons, MIT-licensed, or
released under permissive licenses by their original creators.

## Fonts

| Family | License | Source |
|---|---|---|
| Fraunces | SIL Open Font License 1.1 | [Google Fonts](https://fonts.google.com/specimen/Fraunces) |
| Inter | SIL Open Font License 1.1 | [Google Fonts](https://fonts.google.com/specimen/Inter) |

## Icons

| Set | License | Source |
|---|---|---|
| Lucide Icons (used as inline SVG patterns) | ISC License | [lucide.dev](https://lucide.dev) |

## Photographs

All 16 photographs were downloaded from Wikimedia Commons at 1200-1600 px
widths (Hudson hero at 1600 px). Each photographer is credited; CC BY-SA
images are reproduced under their share-alike terms.

| File | Subject | Photographer | License | Source |
|---|---|---|---|---|
${heroRow}
${rows}

### Notes
- The **Powell, Ohio** card has no photograph. Commons coverage was inadequate;
  a stylized SVG placeholder is shown in its place. Replace with a
  locally-taken or commissioned photo when available.
- The **Solon** photo (City Hall, 1000 px) is below the page's preferred
  resolution; Commons coverage of Solon is sparse.
- The **Madeira** filename is misspelled "Maderia" on Wikimedia Commons —
  the URL spelling is preserved.

## Data

Factual data points (population, income, tax rates, amenity inventories)
are drawn from public sources. Source URLs are listed in the page's
"Sources & Credits" footer and in \`docs/data.json\` under each city's
\`sources\` array. No copyright is asserted on raw facts.

## This benchmark's code

The HTML, CSS, and JavaScript files in \`docs/\` are released under the
MIT License.
`;

fs.writeFileSync(LICENSES_PATH, md);
console.log(`Applied ${MANIFEST.length} photo credits to data.json.`);
console.log(`LICENSES.md regenerated.`);
