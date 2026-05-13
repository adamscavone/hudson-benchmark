#!/usr/bin/env node
/* Fetch city photos from Wikimedia Commons (1200px thumbnails).
   - Uses the /thumb/<hash>/<filename>/1200px-<filename> URL pattern
   - Saves to docs/assets/photos/
   - Returns a manifest with credit/license that goes into data.json + LICENSES.md
*/

const https = require('https');
const fs = require('fs');
const path = require('path');

const PHOTO_DIR = path.join(__dirname, '..', 'docs', 'assets', 'photos');
fs.mkdirSync(PHOTO_DIR, { recursive: true });

// Convert a Commons file URL to a 1200px thumbnail URL.
// e.g. https://upload.wikimedia.org/wikipedia/commons/1/1e/Foo.jpg
//   -> https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Foo.jpg/1200px-Foo.jpg
function toThumb(url, width = 1200) {
  const m = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/([0-9a-f])\/([0-9a-f]{2})\/(.+)$/);
  if (!m) return url; // not a Commons URL — leave as-is
  const [, base, a, ab, filename] = m;
  // Strip .svg fallback files etc. Keep filename encoded.
  return `${base}/thumb/${a}/${ab}/${filename}/${width}px-${filename}`;
}

// Manifest: city key -> { src_url, dest, credit, license, photographer, page_url, alt }
const MANIFEST = [
  {
    key: 'hero',
    dest: 'hudson-hero.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Clock_Tower_entrance_%28Hudson%2C_Ohio%29.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Clock_Tower_entrance_(Hudson,_Ohio).jpg',
    photographer: 'Kevin Payravi',
    license: 'CC BY-SA 4.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    subject: 'Hudson Clock Tower, Historic District',
    alt: 'Hudson Clock Tower entrance, Historic District',
    width: 1600
  },
  {
    key: 'hudson',
    dest: 'hudson.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Hudson_Historic_District_section.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Hudson_Historic_District_section.jpg',
    photographer: 'Kevin Payravi',
    license: 'CC BY-SA 4.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    subject: 'Hudson Historic District streetscape',
    alt: 'Hudson Historic District'
  },
  {
    key: 'solon',
    dest: 'solon.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/SolonCityHall.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:SolonCityHall.jpg',
    photographer: 'Mayor Pez (Wikipedia user)',
    license: 'CC BY-SA 3.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/3.0/',
    subject: 'Solon City Hall',
    alt: 'Solon City Hall',
    width: 1000
  },
  {
    key: 'aurora',
    dest: 'aurora.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Church_and_town_hall_in_Aurora.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Church_and_town_hall_in_Aurora.jpg',
    photographer: 'Nyttend',
    license: 'Public Domain',
    license_url: null,
    subject: 'Church and town hall, Aurora Center Historic District',
    alt: 'Aurora, Ohio Center Historic District'
  },
  {
    key: 'bay-village',
    dest: 'bay-village.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Huntington_Beach_With_Downtown_Cleveland_In_Background.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Huntington_Beach_With_Downtown_Cleveland_In_Background.jpg',
    photographer: 'Heather McLaughlin',
    license: 'CC BY 2.0',
    license_url: 'https://creativecommons.org/licenses/by/2.0/',
    subject: 'Huntington Beach, Lake Erie, with Cleveland skyline',
    alt: 'Huntington Beach, Bay Village, with Cleveland skyline'
  },
  {
    key: 'rocky-river',
    dest: 'rocky-river.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Rocky_River_Ohio_aerial_view.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Rocky_River_Ohio_aerial_view.jpg',
    photographer: 'Ken Winters, U.S. Army Corps of Engineers',
    license: 'Public Domain',
    license_url: null,
    subject: 'Aerial view of Rocky River harbor and Lake Erie entrance',
    alt: 'Rocky River harbor and Lake Erie'
  },
  {
    key: 'chagrin-falls',
    dest: 'chagrin-falls.jpg',
    // Use the literal waterfall — it's the iconic Chagrin Falls image
    src: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Chagrin_Falls_Waterfall%2C_Ohio.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Chagrin_Falls_Waterfall,_Ohio.jpg',
    photographer: 'AngelP8823',
    license: 'CC BY 4.0',
    license_url: 'https://creativecommons.org/licenses/by/4.0/',
    subject: 'Chagrin Falls — the literal waterfall in downtown',
    alt: 'Chagrin Falls waterfall, downtown Chagrin Falls'
  },
  {
    key: 'medina',
    dest: 'medina.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Uptown_Park%2C_Medina%2C_OH.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Uptown_Park,_Medina,_OH.jpg',
    photographer: 'AngelP8823',
    license: 'CC BY 4.0',
    license_url: 'https://creativecommons.org/licenses/by/4.0/',
    subject: 'Uptown Park gazebo on Medina Public Square',
    alt: 'Medina Public Square gazebo'
  },
  {
    key: 'ravenna',
    dest: 'ravenna.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Ravenna_downtown.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Ravenna_downtown.jpg',
    photographer: 'JonRidinger',
    license: 'CC BY 3.0',
    license_url: 'https://creativecommons.org/licenses/by/3.0/',
    subject: 'Downtown Ravenna along Main Street',
    alt: 'Downtown Ravenna, Ohio'
  },
  // Powell — no good Commons photo. Skip; SVG placeholder kicks in.
  {
    key: 'bexley',
    dest: 'bexley.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Bexley_City_Hall_1.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Bexley_City_Hall_1.jpg',
    photographer: 'Sixflashphoto',
    license: 'CC BY-SA 4.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    subject: 'Bexley City Hall',
    alt: 'Bexley City Hall'
  },
  {
    key: 'worthington',
    dest: 'worthington.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Downtown_Worthington%2C_Ohio.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Downtown_Worthington,_Ohio.jpg',
    photographer: 'Nyttend',
    license: 'Public Domain',
    license_url: null,
    subject: 'Downtown Worthington, High Street in Old Worthington Historic District',
    alt: 'Downtown Worthington, Ohio'
  },
  {
    key: 'new-albany',
    dest: 'new-albany.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/New_Albany_City_Hall_1.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:New_Albany_City_Hall_1.jpg',
    photographer: 'Sixflashphoto',
    license: 'CC BY-SA 4.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    subject: 'New Albany Village Hall (Georgian municipal building)',
    alt: 'New Albany Village Hall'
  },
  {
    key: 'upper-arlington',
    dest: 'upper-arlington.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Aerial_view_of_Upper_Arlington%2C_September_2018.JPG',
    page: 'https://commons.wikimedia.org/wiki/File:Aerial_view_of_Upper_Arlington,_September_2018.JPG',
    photographer: 'Pi.1415926535',
    license: 'CC BY-SA 3.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/3.0/',
    subject: 'Aerial view of Upper Arlington along Northwest Boulevard',
    alt: 'Upper Arlington, Ohio aerial view'
  },
  {
    key: 'montgomery',
    dest: 'montgomery.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Yost_Tavern_angle.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Yost_Tavern_angle.jpg',
    photographer: 'Nyttend',
    license: 'Public Domain',
    license_url: null,
    subject: 'Yost Tavern (1805), central Montgomery — National Register',
    alt: 'Yost Tavern (1805), Montgomery, Ohio'
  },
  {
    key: 'madeira',
    dest: 'madeira.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Maderia_OH_USA.JPG',
    page: 'https://commons.wikimedia.org/wiki/File:Maderia_OH_USA.JPG',
    photographer: 'Ed! (Wikipedia user)',
    license: 'CC BY-SA 3.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/3.0/',
    subject: 'Downtown Madeira streetscape',
    alt: 'Downtown Madeira, Ohio'
  },
  {
    key: 'mariemont',
    dest: 'mariemont.jpg',
    src: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Mariemont_Inn.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Mariemont_Inn.jpg',
    photographer: 'Greg Hume',
    license: 'CC BY-SA 4.0',
    license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    subject: 'Mariemont Inn (1926, Tudor) on the village square — NHL village',
    alt: 'Mariemont Inn, Mariemont, Ohio'
  }
];

function fetch(url, dest, ua = 'hudson-benchmark/0.2 (https://github.com/adamscavone/hudson-benchmark; contact via repo issues)') {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, { headers: { 'User-Agent': ua } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return fetch(res.headers.location, dest, ua).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        file.close(); fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve({ url, dest, bytes: fs.statSync(dest).size })));
    });
    req.on('error', err => { file.close(); try { fs.unlinkSync(dest); } catch {} ; reject(err); });
  });
}

async function main() {
  for (const item of MANIFEST) {
    const src = toThumb(item.src, item.width || 1200);
    const dest = path.join(PHOTO_DIR, item.dest);
    process.stdout.write(`  ${item.key.padEnd(20)} ← `);
    try {
      const r = await fetch(src, dest);
      console.log(`${(r.bytes / 1024).toFixed(0).padStart(4)} KB  ✓`);
    } catch (e) {
      console.log(`FAIL  ${e.message}`);
    }
  }
  // Write photo manifest for inclusion in data.json + LICENSES.md
  const manifestOut = MANIFEST.map(m => ({
    key: m.key,
    file: `assets/photos/${m.dest}`,
    alt: m.alt,
    photographer: m.photographer,
    license: m.license,
    license_url: m.license_url,
    subject: m.subject,
    page_url: m.page,
    source_url: m.src
  }));
  fs.writeFileSync(path.join(__dirname, 'photo-manifest.json'), JSON.stringify(manifestOut, null, 2));
  console.log(`\nManifest written: ${manifestOut.length} entries.`);
}

main().catch(e => { console.error(e); process.exit(1); });
