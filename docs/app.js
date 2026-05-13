/* ==============================================================
   Hudson · Peer Benchmark — page logic
   - Password gate (cosmetic — see README)
   - Loads data.json, renders city grid, comparison table,
     amenity gallery, distinctives, aspirational, costs, schools,
     sources
   ============================================================== */

(() => {
  'use strict';

  // ----------------------------------------------------------------
  // Password gate
  // ----------------------------------------------------------------
  // Cosmetic — the real benchmark data is in data.json, which is
  // public. The gate just hides the rendered UI until the right
  // word is typed. Documented in README + on the gate itself.
  //
  // We compare against a SHA-256 hash so the literal passphrase
  // isn't visible in source.
  const PASS_HASH =
    // SHA-256 of the passphrase (lowercased + trimmed before hashing).
    // Default passphrase: "western reserve" (Hudson is in the Western Reserve).
    // To change: run in any browser console:
    //   crypto.subtle.digest('SHA-256', new TextEncoder().encode('your phrase'.toLowerCase())).then(b=>console.log(Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')))
    '3f8241542bc6f98e81bd8bf5c5ae0a55906b2a19ac5e50ed7d2dcc2e64434b45';

  async function sha256(s) {
    const buf = new TextEncoder().encode(s);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function tryUnlock(pw) {
    const h = await sha256(pw.trim().toLowerCase());
    return h === PASS_HASH;
  }

  function unlock() {
    document.getElementById('gate').style.display = 'none';
    document.getElementById('page').hidden = false;
    sessionStorage.setItem('hb-unlocked', '1');
    boot();
  }

  if (sessionStorage.getItem('hb-unlocked') === '1') {
    // Already unlocked this session
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('gate').style.display = 'none';
      document.getElementById('page').hidden = false;
      boot();
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      const form = document.getElementById('gate-form');
      const input = document.getElementById('gate-input');
      const err = document.getElementById('gate-error');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (await tryUnlock(input.value)) {
          unlock();
        } else {
          err.hidden = false;
          input.select();
        }
      });
    });
  }

  // ----------------------------------------------------------------
  // Data + rendering
  // ----------------------------------------------------------------
  let DATA = null;
  let activeFilters = { tier: 'all', region: 'all' };
  let sortState = { col: 'tier', dir: 'asc' };

  async function boot() {
    try {
      const res = await fetch('data.json', { cache: 'no-store' });
      DATA = await res.json();
    } catch (e) {
      console.error('Failed to load data.json', e);
      return;
    }
    if (DATA.meta && DATA.meta.compiled) {
      document.getElementById('compiled-date').textContent = DATA.meta.compiled;
    }
    if (DATA.meta && DATA.meta.hero_image) {
      const img = document.getElementById('hero-img');
      const cap = document.getElementById('hero-caption');
      if (img) img.src = DATA.meta.hero_image.src;
      if (cap) cap.innerHTML = DATA.meta.hero_image.credit || '';
    }
    renderAll();
    wireFilters();
    wireSort();
  }

  function renderAll() {
    renderCityGrid();
    renderCompareTable();
    renderAmenities();
    renderDistinctives();
    renderAspirational();
    renderCosts();
    renderSchools();
    renderSources();
  }

  function visibleCities() {
    return DATA.cities.filter(c => {
      if (activeFilters.tier !== 'all' && c.tier !== activeFilters.tier) return false;
      if (activeFilters.region !== 'all' && c.region !== activeFilters.region) return false;
      return true;
    });
  }

  // ---------- City grid -------------------------------------------
  function renderCityGrid() {
    const grid = document.getElementById('city-grid');
    grid.innerHTML = '';
    visibleCities().forEach(city => {
      const card = document.createElement('article');
      card.className = 'city-card' + (city.tier === 'subject' ? ' subject' : '');
      card.dataset.city = city.key;

      const photo = city.photo && city.photo.src
        ? `<img class="city-card-img" src="${city.photo.src}" alt="${escapeHtml(city.photo.alt || city.name)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'city-card-img city-card-img-placeholder','innerHTML':'<svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1\\' aria-hidden=\\'true\\'><path d=\\'M3 21V7l9-4 9 4v14\\'/><path d=\\'M9 21v-6h6v6\\'/></svg>'}))" />`
        : `<div class="city-card-img city-card-img-placeholder" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M3 21V7l9-4 9 4v14"/><path d="M9 21v-6h6v6"/></svg></div>`;

      const income = city.median_hh_income
        ? '$' + Math.round(city.median_hh_income / 1000) + 'K'
        : '—';
      const pop = city.population ? formatNum(city.population) : '—';

      card.innerHTML = `
        ${photo}
        <div class="city-card-body">
          <div class="city-card-head">
            <h3 class="city-card-name">${escapeHtml(city.name)}</h3>
            <span class="tier-badge tier-${city.tier === 'subject' ? 'subject' : city.tier.toLowerCase()}">${tierLabel(city.tier)}</span>
          </div>
          <p class="city-card-meta">${escapeHtml(city.county || '')} · ${escapeHtml(city.region || '')}</p>
          <div class="city-card-stats">
            <div class="city-card-stat">
              <div class="num-value">${pop}</div>
              <div class="num-label">Population</div>
            </div>
            <div class="city-card-stat">
              <div class="num-value">${income}</div>
              <div class="num-label">Median HH</div>
            </div>
          </div>
          <p class="city-card-distinctive">${escapeHtml(city.distinctive || '')}</p>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function tierLabel(t) {
    if (t === 'subject') return 'Subject';
    if (t === 'A') return 'Tier A';
    if (t === 'B') return 'Tier B';
    if (t === 'C') return 'Tier C';
    return t;
  }

  // ---------- Comparison table ------------------------------------
  function renderCompareTable() {
    const tbody = document.getElementById('compare-tbody');
    tbody.innerHTML = '';
    const sorted = [...visibleCities()].sort(compareCities);
    sorted.forEach(c => {
      const tr = document.createElement('tr');
      if (c.tier === 'subject') tr.className = 'subject';
      tr.innerHTML = `
        <td>${escapeHtml(c.name)}</td>
        <td>${tierLabel(c.tier)}</td>
        <td>${escapeHtml(c.region || '')}</td>
        <td class="num">${c.population ? formatNum(c.population) : '—'}</td>
        <td class="num">${c.median_hh_income ? '$' + formatNum(c.median_hh_income) : '—'}</td>
        <td>${yn(c.utilities && c.utilities.electric_is_municipal)}</td>
        <td>${yn(c.utilities && c.utilities.fiber_is_municipal)}</td>
        <td>${yn(c.civic && c.civic.has_rec_center)}</td>
        <td class="cell-na">${escapeHtml(c.signature_amenity || '—')}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function compareCities(a, b) {
    const col = sortState.col;
    const dir = sortState.dir === 'asc' ? 1 : -1;
    // Subject always pinned to top
    if (a.tier === 'subject' && b.tier !== 'subject') return -1;
    if (b.tier === 'subject' && a.tier !== 'subject') return 1;
    let av = a[col], bv = b[col];
    if (col === 'tier') { av = tierOrder(a.tier); bv = tierOrder(b.tier); }
    if (col === 'muni_electric') { av = a.utilities && a.utilities.electric_is_municipal ? 1 : 0; bv = b.utilities && b.utilities.electric_is_municipal ? 1 : 0; }
    if (col === 'muni_fiber')    { av = a.utilities && a.utilities.fiber_is_municipal ? 1 : 0; bv = b.utilities && b.utilities.fiber_is_municipal ? 1 : 0; }
    if (col === 'rec_center')    { av = a.civic && a.civic.has_rec_center ? 1 : 0; bv = b.civic && b.civic.has_rec_center ? 1 : 0; }
    if (col === 'signature')     { av = a.signature_amenity || ''; bv = b.signature_amenity || ''; }
    if (av == null) av = '';
    if (bv == null) bv = '';
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  }

  function tierOrder(t) {
    return { subject: 0, A: 1, B: 2, C: 3 }[t] || 9;
  }

  // ---------- Amenity gallery -------------------------------------
  function renderAmenities() {
    const root = document.getElementById('amenity-categories');
    root.innerHTML = '';
    (DATA.amenity_categories || []).forEach(cat => {
      const section = document.createElement('div');
      section.className = 'amenity-category';
      section.innerHTML = `
        <div class="amenity-head">
          <div class="amenity-icon">${cat.icon || ''}</div>
          <div>
            <h3 class="amenity-title">${escapeHtml(cat.title)}</h3>
            <p class="amenity-blurb">${escapeHtml(cat.blurb || '')}</p>
          </div>
        </div>
        <div class="amenity-rows" data-cat="${cat.key}"></div>
      `;
      const rows = section.querySelector('.amenity-rows');
      DATA.cities.forEach(city => {
        const v = city.amenities && city.amenities[cat.key];
        if (!isInformative(v)) return;
        const row = document.createElement('div');
        row.className = 'amenity-row' + (city.tier === 'subject' ? ' subject' : '');
        row.innerHTML = `
          <div>
            <span class="amenity-city">${escapeHtml(city.name)}</span>
            <span class="amenity-city-meta">${escapeHtml(city.region || '')} · ${tierLabel(city.tier)}</span>
          </div>
          <div class="amenity-value">${escapeHtml(v)}</div>
        `;
        rows.appendChild(row);
      });
      root.appendChild(section);
    });
  }

  // Skip amenity rows whose value is null, empty, or just "no data" text.
  // Kept lenient because research notes like "no municipal X" are still
  // informative — only truly-empty cells get dropped.
  function isInformative(v) {
    if (v == null) return false;
    if (typeof v !== 'string') return true;
    const s = v.trim();
    if (!s || s === '—' || s === '-') return false;
    const lower = s.toLowerCase();
    // Drop pure "not published / not advertised / unknown / not detailed" rows
    const noiseStarts = [
      'not published',
      'not advertised',
      'not detailed',
      'not specifically',
      'not centrally',
      'not prominently',
      'not confirmed',
      'status not confirmed',
      'limited published',
      'unknown'
    ];
    if (noiseStarts.some(n => lower.startsWith(n))) return false;
    return true;
  }

  // ---------- Distinctives ----------------------------------------
  function renderDistinctives() {
    const grid = document.getElementById('distinctives-grid');
    grid.innerHTML = '';
    (DATA.hudson_distinctives || []).forEach(d => {
      const card = document.createElement('div');
      card.className = 'dist-card';
      card.innerHTML = `
        <h3 class="dist-card-title">${escapeHtml(d.title)}</h3>
        <p class="dist-card-body">${d.body || ''}</p>
        <p class="dist-card-peer"><strong>Peers with similar:</strong> ${escapeHtml(d.peers || 'none in this benchmark')}</p>
      `;
      grid.appendChild(card);
    });
  }

  // ---------- Aspirational ----------------------------------------
  function renderAspirational() {
    const grid = document.getElementById('aspirational-grid');
    grid.innerHTML = '';
    (DATA.aspirational || []).forEach(a => {
      const card = document.createElement('div');
      card.className = 'asp-card';
      card.innerHTML = `
        <div class="asp-card-head">
          <h3 class="asp-card-name">${escapeHtml(a.name)}</h3>
          <span class="asp-card-pop">${escapeHtml(a.size_note || '')}</span>
        </div>
        <p class="asp-card-body">${a.body || ''}</p>
      `;
      grid.appendChild(card);
    });
  }

  // ---------- Costs -----------------------------------------------
  function renderCosts() {
    const grid = document.getElementById('cost-grid');
    grid.innerHTML = '';
    const hudson = DATA.cities.find(c => c.tier === 'subject');
    if (!hudson || !hudson.costs) {
      grid.innerHTML = '<p class="amenity-blurb">Costs to be collected.</p>';
      return;
    }
    const metrics = [
      { label: 'Municipal income tax', key: 'municipal_income_tax_pct', fmt: v => v != null ? v.toFixed(2) + '%' : '—', sub: 'Hudson · peers vary 1.5–2.5%' },
      { label: 'Property tax on $500K home', key: 'effective_property_tax_per_500k', fmt: v => v ? '$' + formatNum(v) : '—', sub: 'effective millage · annual' },
      { label: 'Water · 5,000 gal/mo', key: 'water_per_5kgal', fmt: v => v ? '$' + v.toFixed(2) : '—', sub: 'monthly' },
      { label: 'Sewer · 5,000 gal/mo', key: 'sewer_per_5kgal', fmt: v => v ? '$' + v.toFixed(2) : '—', sub: 'monthly' },
      { label: 'Stormwater fee', key: 'stormwater_fee', fmt: v => v != null ? '$' + v.toFixed(2) : '—', sub: 'where separately billed' },
      { label: 'Rec / pool resident pass', key: 'rec_pass', fmt: v => v ? '$' + v : '—', sub: 'annual, resident rate' }
    ];
    metrics.forEach(m => {
      const card = document.createElement('div');
      card.className = 'cost-card';
      card.innerHTML = `
        <p class="cost-label">${m.label}</p>
        <div class="cost-value">${m.fmt(hudson.costs[m.key])}</div>
        <p class="cost-sub">${m.sub}</p>
      `;
      grid.appendChild(card);
    });
  }

  // ---------- Schools ---------------------------------------------
  function renderSchools() {
    const root = document.getElementById('schools-content');
    root.innerHTML = '';
    DATA.cities.forEach(c => {
      if (!c.schools) return;
      const name = document.createElement('div');
      name.className = 'school-name';
      name.textContent = c.name;
      const info = document.createElement('div');
      info.className = 'school-info';
      const parts = [];
      if (c.schools.district) parts.push(`<strong>${escapeHtml(c.schools.district)}</strong>`);
      if (c.schools.report_card_grade) parts.push(`Grade ${escapeHtml(c.schools.report_card_grade)}`);
      if (c.schools.per_pupil_spending) parts.push(`$${formatNum(c.schools.per_pupil_spending)}/pupil`);
      if (c.schools.note) parts.push(`<em>${escapeHtml(c.schools.note)}</em>`);
      info.innerHTML = parts.join(' · ') || '<span class="cell-na">to be collected</span>';
      root.appendChild(name);
      root.appendChild(info);
    });
  }

  // ---------- Sources ---------------------------------------------
  function renderSources() {
    const root = document.getElementById('sources-content');
    root.innerHTML = '';
    DATA.cities.forEach(c => {
      if (!c.sources || c.sources.length === 0) return;
      const name = document.createElement('div');
      name.className = 'source-city';
      name.textContent = c.name;
      const info = document.createElement('div');
      info.className = 'source-info';
      const ul = document.createElement('ul');
      c.sources.forEach(s => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label)}</a>`;
        ul.appendChild(li);
      });
      info.appendChild(ul);
      root.appendChild(name);
      root.appendChild(info);
    });
  }

  // ---------- Filters & sort wiring -------------------------------
  function wireFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.filterType;
        const val = btn.dataset.filter;
        // Toggle active state within its type
        document.querySelectorAll(`.filter-btn[data-filter-type="${type}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilters[type] = val;
        renderCityGrid();
        renderCompareTable();
      });
    });
  }

  function wireSort() {
    document.querySelectorAll('#compare-table th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (sortState.col === col) {
          sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
        } else {
          sortState.col = col; sortState.dir = 'asc';
        }
        renderCompareTable();
      });
    });
  }

  // ---------- Helpers ---------------------------------------------
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function formatNum(n) {
    if (n == null) return '—';
    return Math.round(n).toLocaleString('en-US');
  }

  function yn(v) {
    if (v === true)  return '<span class="cell-yes">yes</span>';
    if (v === false) return '<span class="cell-no">—</span>';
    return '<span class="cell-na">?</span>';
  }
})();
