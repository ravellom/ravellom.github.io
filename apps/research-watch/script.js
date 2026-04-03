/* ResearchWatch — script.js
   Fetches data/research-watch.json and renders the full UI dynamically.
   No external dependencies beyond Font Awesome (loaded in HTML).
*/

const DATA_URL  = 'data/research-watch.json';
const FEED_URL  = 'data/research-watch-feed.json';

// ── Entry point ───────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadData();
});

async function loadData() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    hideLoading();
    render(data);
  } catch (err) {
    hideLoading();
    showError('No se pudieron cargar los datos. ' + err.message);
  }
}

// ── Render orchestrator ───────────────────────────────────────────────────────

function render(data) {
  renderStats(data);
  renderCalls(data.calls, data);
  renderJournals(data.journals);
  renderConferences(data.conferences);
  renderFilters(data.calls, data);
  renderBlogspotSnippet();
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function renderStats(data) {
  const calls = data.calls || [];
  const next  = calls.find(c => c.deadline);

  setText('stat-calls',       calls.length);
  setText('stat-next',        next ? formatDate(next.deadline) : '—');
  setText('stat-journals',    (data.journals || []).length);
  setText('stat-conferences', (data.conferences || []).length);

  if (data.meta?.generated_at) {
    const d = new Date(data.meta.generated_at);
    setText('stat-updated', 'Actualizado: ' + d.toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }));
  }
}

// ── Calls table ───────────────────────────────────────────────────────────────

function renderCalls(calls, data, filters = {}) {
  const tbody   = document.getElementById('calls-tbody');
  const empty   = document.getElementById('calls-empty');
  const table   = document.getElementById('calls-table');
  if (!tbody) return;

  let filtered = calls;
  if (filters.area) {
    filtered = filtered.filter(c =>
      c.source?.areas?.some(a => a.toLowerCase().includes(filters.area.toLowerCase()))
    );
  }
  if (filters.type) {
    filtered = filtered.filter(c => c.type === filters.type);
  }
  if (filters.days) {
    const max = parseInt(filters.days, 10);
    filtered = filtered.filter(c => c.days_until !== null && c.days_until !== undefined && c.days_until <= max);
  }

  if (!filtered.length) {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  table.style.display = '';
  empty.style.display = 'none';

  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td class="col-deadline">${c.deadline ? formatDate(c.deadline) : '<span class="badge-days badge-none">—</span>'}</td>
      <td class="col-days">${daysBadge(c.days_until)}</td>
      <td class="col-type">${typeBadge(c.type)}</td>
      <td class="col-title call-title">
        ${c.url
          ? `<a href="${escHtml(c.url)}" target="_blank" rel="noopener">${escHtml(c.title)}</a>`
          : escHtml(c.title)
        }
      </td>
      <td class="col-source">
        ${c.source
          ? `<span title="${escHtml(c.source.name)}">${escHtml(c.source.name.substring(0, 40))}${c.source.name.length > 40 ? '…' : ''}</span>`
          : '<span class="text-muted">—</span>'
        }
      </td>
      <td class="col-areas">${areaTags(c.source?.areas)}</td>
    </tr>
  `).join('');
}

// ── Filters ───────────────────────────────────────────────────────────────────

function renderFilters(calls, data) {
  // Populate area options
  const areaSet = new Set();
  (calls || []).forEach(c => (c.source?.areas || []).forEach(a => areaSet.add(a)));
  const areaSelect = document.getElementById('filter-area');
  if (areaSelect) {
    [...areaSet].sort().forEach(area => {
      const opt = document.createElement('option');
      opt.value = area;
      opt.textContent = area;
      areaSelect.appendChild(opt);
    });
  }

  // Wire up change events
  const applyFilters = () => {
    renderCalls(data.calls, data, {
      area: document.getElementById('filter-area')?.value,
      type: document.getElementById('filter-type')?.value,
      days: document.getElementById('filter-days')?.value,
    });
  };
  ['filter-area', 'filter-type', 'filter-days'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });
}

// ── Journals ──────────────────────────────────────────────────────────────────

function renderJournals(journals) {
  const list = document.getElementById('journals-list');
  if (!list) return;
  if (!journals?.length) {
    list.innerHTML = '<li class="empty-state">Sin revistas.</li>';
    return;
  }
  list.innerHTML = journals.map((j, i) => {
    const qBadge = j.quartile
      ? `<span class="src-q-badge src-q-${j.quartile.toLowerCase()}">${j.quartile}</span>` : '';
    const ifBadge = j.impact_factor
      ? `<span class="source-if">IF ${j.impact_factor}</span>` : '';
    return `
    <li class="src-expandable" data-id="j-${i}">
      <div class="source-name src-toggle-row">
        <span class="src-chevron"><i class="fa-solid fa-chevron-right"></i></span>
        <span class="src-name-text">${escHtml(j.name)}</span>
        <a href="${escHtml(j.url)}" target="_blank" rel="noopener" class="src-ext-link" title="Abrir sitio web"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>
        ${ifBadge}${qBadge}
      </div>
      <div class="source-meta">
        ${[j.issn, j.publisher].filter(Boolean).join(' · ')}
        ${j.areas?.length ? ' · ' + j.areas.slice(0, 3).join(', ') : ''}
      </div>
      <div class="src-detail" id="src-detail-j-${i}" style="display:none">
        ${j.notes ? `<p class="src-notes">${escHtml(j.notes)}</p>` : ''}
        ${(j.areas||[]).length > 3
          ? `<div class="area-tags" style="margin:.35rem 0">${j.areas.map(a=>`<span class="area-tag">${escHtml(a)}</span>`).join('')}</div>`
          : ''}
        <div class="src-articles-wrap" id="src-articles-j-${i}">
          <p class="src-articles-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando artículos…</p>
        </div>
        ${j.id ? `<div style="padding:.5rem 0 .25rem"><a href="source-detail.html?type=journal&id=${escHtml(j.id)}" class="btn btn-xs btn-outline src-detail-btn"><i class="fa-solid fa-circle-info"></i> Detalles de la revista →</a></div>` : ''}
      </div>
    </li>`;
  }).join('');
  wireExpandable('journals-list');
}

// ── Conferences ───────────────────────────────────────────────────────────────

function renderConferences(conferences) {
  const list = document.getElementById('conferences-list');
  if (!list) return;
  if (!conferences?.length) {
    list.innerHTML = '<li class="empty-state">Sin congresos.</li>';
    return;
  }
  list.innerHTML = conferences.map((c, i) => `
    <li class="src-expandable" data-id="c-${i}">
      <div class="source-name src-toggle-row">
        <span class="src-chevron"><i class="fa-solid fa-chevron-right"></i></span>
        <span class="src-name-text">${escHtml(c.name)}</span>
        <a href="${escHtml(c.url)}" target="_blank" rel="noopener" class="src-ext-link" title="Abrir sitio web"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>
        ${c.acronym ? `<span class="source-if">${escHtml(c.acronym)}</span>` : ''}
      </div>
      <div class="source-meta">
        ${[c.periodicity, c.areas?.slice(0, 2).join(', ')].filter(Boolean).join(' · ')}
      </div>
      <div class="src-detail" id="src-detail-c-${i}" style="display:none">
        ${c.notes ? `<p class="src-notes">${escHtml(c.notes)}</p>` : ''}
        ${(c.areas||[]).length > 2
          ? `<div class="area-tags" style="margin:.35rem 0">${c.areas.map(a=>`<span class="area-tag">${escHtml(a)}</span>`).join('')}</div>`
          : ''}
        <div class="src-articles-wrap" id="src-articles-c-${i}">
          <p class="src-articles-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando artículos…</p>
        </div>
        ${c.id ? `<div style="padding:.5rem 0 .25rem"><a href="source-detail.html?type=conference&id=${escHtml(c.id)}" class="btn btn-xs btn-outline src-detail-btn"><i class="fa-solid fa-circle-info"></i> Detalles del congreso →</a></div>` : ''}
      </div>
    </li>`
  ).join('');
  wireExpandable('conferences-list');
}

function wireExpandable(listId) {
  const list = document.getElementById(listId);
  if (!list) return;
  list.querySelectorAll('.src-toggle-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.src-ext-link')) return;
      const li      = row.closest('.src-expandable');
      const detail  = li.querySelector('.src-detail');
      const chevron = li.querySelector('.src-chevron i');
      const isOpen  = detail.style.display !== 'none';
      detail.style.display = isOpen ? 'none' : '';
      chevron.className = isOpen ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-down';
      li.classList.toggle('src-open', !isOpen);
      // Trigger sources enrichment if not yet loaded
      if (!isOpen) ensureSourcesLoaded();
    });
  });
}

// ── Blogspot snippet ──────────────────────────────────────────────────────────

const FEED_RAW_URL =
  'https://raw.githubusercontent.com/ravellom/ravellom.github.io/main/apps/research-watch/data/research-watch-feed.json';

function renderBlogspotSnippet() {
  const pre = document.getElementById('blogspot-snippet');
  if (!pre) return;
  const snippet = `<div id="rw-feed"></div>
<script>
(function() {
  var url = '${FEED_RAW_URL}';
  fetch(url).then(function(r){ return r.json(); }).then(function(feed) {
    var html = '<h3>' + feed.title + '</h3><ul>';
    (feed.items || []).forEach(function(item) {
      html += '<li><strong>' + item.title + '</strong><br>' + item.summary + '</li>';
    });
    html += '</ul>';
    document.getElementById('rw-feed').innerHTML = html;
  }).catch(function(){ document.getElementById('rw-feed').textContent = 'No se pudieron cargar los datos.'; });
})();
<\/script>`;
  pre.textContent = snippet;

  document.getElementById('copy-snippet')?.addEventListener('click', () => {
    navigator.clipboard.writeText(snippet).then(() => {
      const btn = document.getElementById('copy-snippet');
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
      setTimeout(() => {
        btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar';
      }, 2000);
    });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBadge(days) {
  if (days === null || days === undefined) return '<span class="badge-days badge-none">—</span>';
  if (days <= 10) return `<span class="badge-days badge-urgent">${days}d</span>`;
  if (days <= 30) return `<span class="badge-days badge-warning">${days}d</span>`;
  return `<span class="badge-days badge-ok">${days}d</span>`;
}

const TYPE_LABELS = { cfp: 'CFP', special_issue: 'Special Issue', monographic: 'Monográfico' };
function typeBadge(type) {
  const label = TYPE_LABELS[type] || type;
  return `<span class="type-badge type-${type}">${label}</span>`;
}

function areaTags(areas) {
  if (!areas?.length) return '';
  return `<div class="area-tags">${areas.slice(0, 3).map(a =>
    `<span class="area-tag">${escHtml(a)}</span>`
  ).join('')}</div>`;
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function hideLoading() {
  document.getElementById('loading-overlay')?.classList.add('hidden');
}

function showError(msg) {
  const banner = document.getElementById('error-banner');
  const msgEl  = document.getElementById('error-msg');
  if (banner) banner.style.display = 'flex';
  if (msgEl)  msgEl.textContent = msg;
}

// ── Sources enrichment (silent background load of recent RSS articles) ────────

const SOURCES_URL = 'data/research-watch-sources.json';
let _sourcesData   = null;  // null = not loaded, false = failed, object = loaded
let _sourcesPromise = null;

function ensureSourcesLoaded() {
  if (_sourcesData !== null) {
    if (_sourcesData) enrichOpenPanels(_sourcesData);
    return;
  }
  if (_sourcesPromise) return;  // already in flight
  _sourcesPromise = fetch(SOURCES_URL)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(data => {
      _sourcesData = data;
      enrichOpenPanels(data);
    })
    .catch(() => { _sourcesData = false; });
}

function enrichOpenPanels(data) {
  // Build index by id for fast lookup
  const jMap = {};
  (data.journals    || []).forEach((j, i) => { jMap[j.id] = { idx: i, entries: j.recent_entries || [] }; });
  const cMap = {};
  (data.conferences || []).forEach((c, i) => { cMap[c.id] = { idx: i, entries: c.recent_entries || [] }; });

  // We stored index-based ids in DOM (j-0, j-1 etc.), so match by DOM index.
  // Journals list
  document.querySelectorAll('#journals-list .src-expandable').forEach((li, idx) => {
    const wrap = document.getElementById(`src-articles-j-${idx}`);
    if (!wrap || !wrap.querySelector('.src-articles-loading')) return;
    const entries = (data.journals?.[idx]?.recent_entries) || [];
    wrap.innerHTML = renderArticleList(entries);
  });
  // Conferences list
  document.querySelectorAll('#conferences-list .src-expandable').forEach((li, idx) => {
    const wrap = document.getElementById(`src-articles-c-${idx}`);
    if (!wrap || !wrap.querySelector('.src-articles-loading')) return;
    const entries = (data.conferences?.[idx]?.recent_entries) || [];
    wrap.innerHTML = renderArticleList(entries);
  });
}

function renderArticleList(entries) {
  if (!entries.length) return '<p class="src-no-entries">Sin artículos recientes en el feed.</p>';
  return `<ul class="src-articles">${entries.map(e => `
    <li>
      ${e.url
        ? `<a href="${escHtml(e.url)}" target="_blank" rel="noopener">${escHtml(e.title)}</a>`
        : escHtml(e.title)}
      ${e.published ? `<span class="src-article-date">${e.published}</span>` : ''}
      ${e.summary   ? `<p class="src-article-summary">${escHtml(e.summary)}</p>` : ''}
    </li>`).join('')}
  </ul>`;
}

