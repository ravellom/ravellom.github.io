const DATA_URL = "data/research-watch.json";
const SOURCES_URL = "data/research-watch-sources.json";
const FEED_RAW_URL =
  "https://raw.githubusercontent.com/ravellom/ravellom.github.io/main/apps/research-watch/data/research-watch-feed.json";

const TYPE_LABELS = {
  cfp: "CFP",
  special_issue: "Special Issue",
  monographic: "Monografico",
  project_call: "Project call",
};

let sourcesCache = null;
let sourcesPromise = null;

document.addEventListener("DOMContentLoaded", () => {
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
    showError("No se pudieron cargar los datos. " + err.message);
  }
}

function render(data) {
  renderStats(data);
  renderCalls(getMainCalls(data.calls || []), {});
  renderJournals(data.journals || []);
  renderConferences(data.conferences || []);
  renderFundingSources(data.funding_sources || []);
  renderFilters(data);
  renderBlogspotSnippet();
  initTabs();
}

function renderStats(data) {
  const calls = data.calls || [];
  const next = [...calls]
    .filter((call) => !!call.deadline)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))[0];

  setText("stat-calls", calls.length);
  setText("stat-next", next ? formatDate(next.deadline) : "-");
  setText("stat-journals", (data.journals || []).length);
  setText("stat-conferences", (data.conferences || []).length);
  setText("stat-funding", (data.funding_sources || []).length);

  if (data.meta?.generated_at) {
    const updated = new Date(data.meta.generated_at);
    setText(
      "stat-updated",
      "Actualizado: " +
        updated.toLocaleString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
    );
  }
}

function renderCalls(calls, filters) {
  const tbody = document.getElementById("calls-tbody");
  const empty = document.getElementById("calls-empty");
  const table = document.getElementById("calls-table");
  if (!tbody) return;

  let filtered = [...calls];

  if (filters.area) {
    const areaLower = filters.area.toLowerCase();
    filtered = filtered.filter((call) =>
      (call.source?.areas || []).some((area) => area.toLowerCase().includes(areaLower))
    );
  }

  if (filters.type) {
    filtered = filtered.filter((call) => call.type === filters.type);
  }

  if (filters.days) {
    const maxDays = Number.parseInt(filters.days, 10);
    filtered = filtered.filter(
      (call) => call.days_until !== null && call.days_until !== undefined && call.days_until <= maxDays
    );
  }

  filtered.sort((a, b) => {
    if (!a.deadline && !b.deadline) return a.title.localeCompare(b.title);
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });

  if (!filtered.length) {
    table.style.display = "none";
    empty.style.display = "block";
    tbody.innerHTML = "";
    return;
  }

  table.style.display = "";
  empty.style.display = "none";
  tbody.innerHTML = filtered
    .map(
      (call) => `
        <tr>
          <td class="col-deadline">${call.deadline ? formatDate(call.deadline) : '<span class="badge-days badge-none">-</span>'}</td>
          <td class="col-days">${daysBadge(call.days_until)}</td>
          <td class="col-type">${typeBadge(call.type)}</td>
          <td class="col-title call-title">
            ${call.url ? `<a href="${escHtml(call.url)}" target="_blank" rel="noopener">${escHtml(call.title)}</a>` : escHtml(call.title)}
          </td>
          <td class="col-source">${renderSourceLabel(call.source)}</td>
          <td class="col-areas">${areaTags(call.source?.areas)}</td>
        </tr>
      `
    )
    .join("");
}

function renderFilters(data) {
  const areaSelect = document.getElementById("filter-area");
  const areaSet = new Set();
  (data.calls || []).forEach((call) => {
    (call.source?.areas || []).forEach((area) => areaSet.add(area));
  });

  [...areaSet].sort().forEach((area) => {
    const option = document.createElement("option");
    option.value = area;
    option.textContent = area;
    areaSelect.appendChild(option);
  });

  const apply = () => {
    renderCalls(getMainCalls(data.calls || []), {
      area: document.getElementById("filter-area")?.value,
      type: document.getElementById("filter-type")?.value,
      days: document.getElementById("filter-days")?.value,
    });
  };

  ["filter-area", "filter-type", "filter-days"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", apply);
  });
}

function renderJournals(journals) {
  renderSourceList({
    listId: "journals-list",
    items: journals,
    keyPrefix: "j",
    detailLabel: "Detalles de la revista",
    detailType: "journal",
    badgeText: (journal) =>
      [journal.impact_factor ? `IF ${journal.impact_factor}` : "", journal.quartile || ""].filter(Boolean),
    metaText: (journal) =>
      [journal.issn, journal.publisher, (journal.areas || []).slice(0, 3).join(", ")]
        .filter(Boolean)
        .join(" · "),
  });
}

function renderConferences(conferences) {
  renderSourceList({
    listId: "conferences-list",
    items: conferences,
    keyPrefix: "c",
    detailLabel: "Detalles del congreso",
    detailType: "conference",
    badgeText: (conference) => [conference.acronym].filter(Boolean),
    metaText: (conference) =>
      [conference.periodicity, (conference.areas || []).slice(0, 3).join(", ")]
        .filter(Boolean)
        .join(" · "),
  });
}

function renderFundingSources(fundingSources) {
  renderSourceList({
    listId: "funding-list",
    items: fundingSources,
    keyPrefix: "f",
    detailLabel: "Detalles del programa",
    detailType: "funding_source",
    badgeText: (source) => [source.acronym, source.program_type].filter(Boolean),
    metaText: (source) => (source.areas || []).slice(0, 3).join(", "),
  });
}

function renderSourceList(config) {
  const list = document.getElementById(config.listId);
  if (!list) return;
  if (!config.items.length) {
    list.innerHTML = '<li class="empty-state">Sin elementos.</li>';
    return;
  }

  list.innerHTML = config.items
    .map((item, index) => {
      const badges = (config.badgeText(item) || [])
        .map((badge) => `<span class="source-if">${escHtml(badge)}</span>`)
        .join("");
      const detailHref = item.id
        ? `source-detail.html?type=${config.detailType}&id=${encodeURIComponent(item.id)}`
        : "";
      return `
        <li class="src-expandable" data-id="${config.keyPrefix}-${index}">
          <div class="source-name src-toggle-row">
            <span class="src-chevron"><i class="fa-solid fa-chevron-right"></i></span>
            <span class="src-name-text">${escHtml(item.name)}</span>
            ${item.url ? `<a href="${escHtml(item.url)}" target="_blank" rel="noopener" class="src-ext-link" title="Abrir sitio web"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ""}
            ${badges}
          </div>
          <div class="source-meta">${escHtml(config.metaText(item) || "")}</div>
          <div class="src-detail" id="src-detail-${config.keyPrefix}-${index}" style="display:none">
            ${item.notes ? `<p class="src-notes">${escHtml(item.notes)}</p>` : ""}
            ${detailHref ? `<div style="padding:.25rem 0 .5rem"><a href="${detailHref}" class="btn btn-xs btn-outline src-detail-btn"><i class="fa-solid fa-circle-info"></i> ${config.detailLabel} -&gt;</a></div>` : ""}
            ${(item.areas || []).length > 3 ? `<div class="area-tags" style="margin:.35rem 0">${item.areas.map((area) => `<span class="area-tag">${escHtml(area)}</span>`).join("")}</div>` : ""}
            <div class="src-articles-wrap" id="src-articles-${config.keyPrefix}-${index}">
              <p class="src-articles-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando feed...</p>
            </div>
          </div>
        </li>
      `;
    })
    .join("");

  wireExpandable(config.listId);
}

function initTabs() {
  const tabs = document.querySelectorAll(".rw-tab");
  const panels = document.querySelectorAll(".rw-tab-panel");
  if (!tabs.length || !panels.length) return;

  const activate = (targetId) => {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.tabTarget === targetId;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    panels.forEach((panel) => {
      const isActive = panel.id === targetId;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activate(tab.dataset.tabTarget));
  });
}

function wireExpandable(listId) {
  const list = document.getElementById(listId);
  if (!list) return;
  list.querySelectorAll(".src-toggle-row").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest(".src-ext-link")) return;
      const item = row.closest(".src-expandable");
      const detail = item.querySelector(".src-detail");
      const chevron = item.querySelector(".src-chevron i");
      const isOpen = detail.style.display !== "none";
      detail.style.display = isOpen ? "none" : "";
      chevron.className = isOpen ? "fa-solid fa-chevron-right" : "fa-solid fa-chevron-down";
      item.classList.toggle("src-open", !isOpen);
      if (!isOpen) ensureSourcesLoaded();
    });
  });
}

function renderBlogspotSnippet() {
  const pre = document.getElementById("blogspot-snippet");
  if (!pre) return;

  const snippet = `<div id="rw-feed"></div>
<script>
(function () {
  var url = '${FEED_RAW_URL}';
  fetch(url)
    .then(function (r) { return r.json(); })
    .then(function (feed) {
      var html = '<h3>' + feed.title + '</h3><ul>';
      (feed.items || []).forEach(function (item) {
        html += '<li><strong>' + item.title + '</strong><br>' + item.summary + '</li>';
      });
      html += '</ul>';
      document.getElementById('rw-feed').innerHTML = html;
    })
    .catch(function () {
      document.getElementById('rw-feed').textContent = 'No se pudieron cargar los datos.';
    });
})();
<\/script>`;

  pre.textContent = snippet;
  document.getElementById("copy-snippet")?.addEventListener("click", () => {
    navigator.clipboard.writeText(snippet).then(() => {
      const button = document.getElementById("copy-snippet");
      button.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
      setTimeout(() => {
        button.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar';
      }, 1500);
    });
  });
}

function ensureSourcesLoaded() {
  if (sourcesCache !== null) {
    if (sourcesCache) enrichOpenPanels(sourcesCache);
    return;
  }
  if (sourcesPromise) return;

  sourcesPromise = fetch(SOURCES_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      sourcesCache = data;
      enrichOpenPanels(data);
    })
    .catch(() => {
      sourcesCache = false;
    });
}

function enrichOpenPanels(data) {
  enrichList("journals-list", "j", data.journals || []);
  enrichList("conferences-list", "c", data.conferences || []);
  enrichList("funding-list", "f", data.funding_sources || []);
}

function enrichList(listId, prefix, items) {
  document.querySelectorAll(`#${listId} .src-expandable`).forEach((element, index) => {
    const wrap = document.getElementById(`src-articles-${prefix}-${index}`);
    if (!wrap || !wrap.querySelector(".src-articles-loading")) return;
    wrap.innerHTML = renderArticleList(items[index]?.recent_entries || []);
  });
}

function renderArticleList(entries) {
  if (!entries.length) return '<p class="src-no-entries">Sin articulos recientes en el feed.</p>';
  return `
    <ul class="src-articles">
      ${entries
        .map(
          (entry) => `
            <li>
              ${entry.url ? `<a href="${escHtml(entry.url)}" target="_blank" rel="noopener">${escHtml(entry.title)}</a>` : escHtml(entry.title)}
              ${entry.published ? `<span class="src-article-date">${escHtml(entry.published)}</span>` : ""}
              ${entry.summary ? `<p class="src-article-summary">${escHtml(entry.summary)}</p>` : ""}
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

function renderSourceLabel(source) {
  if (!source) return '<span class="text-muted">-</span>';
  const kind =
    source.type === "journal"
      ? "Revista"
      : source.type === "conference"
      ? "Congreso"
      : "Programa";
  return `<span title="${escHtml(source.name)}">${escHtml(source.name)} <span class="text-muted">(${kind})</span></span>`;
}

function getMainCalls(calls) {
  return (calls || []).filter(
    (call) => call.source && (call.source.type === "journal" || call.source.type === "conference")
  );
}

function daysBadge(days) {
  if (days === null || days === undefined) return '<span class="badge-days badge-none">-</span>';
  if (days <= 10) return `<span class="badge-days badge-urgent">${days}d</span>`;
  if (days <= 30) return `<span class="badge-days badge-warning">${days}d</span>`;
  return `<span class="badge-days badge-ok">${days}d</span>`;
}

function typeBadge(type) {
  const label = TYPE_LABELS[type] || type;
  return `<span class="type-badge type-${type}">${escHtml(label)}</span>`;
}

function areaTags(areas) {
  if (!areas?.length) return "";
  return `<div class="area-tags">${areas
    .slice(0, 3)
    .map((area) => `<span class="area-tag">${escHtml(area)}</span>`)
    .join("")}</div>`;
}

function formatDate(iso) {
  if (!iso) return "-";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function escHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function hideLoading() {
  document.getElementById("loading-overlay")?.classList.add("hidden");
}

function showError(message) {
  const banner = document.getElementById("error-banner");
  const error = document.getElementById("error-msg");
  if (banner) banner.style.display = "flex";
  if (error) error.textContent = message;
}
