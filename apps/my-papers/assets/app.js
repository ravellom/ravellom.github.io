const state = {
  publications: [],
  filteredItems: [],
  selectedId: null,
  currentView: "publications",
  filters: {
    search: "",
    year: "all",
    type: "all",
    venue: "all",
    language: "all",
    oa: "all",
    sort: "year-desc",
  },
};

const els = {
  heroStats: document.querySelector("#hero-stats"),
  summaryList: document.querySelector("#summary-list"),
  venuesList: document.querySelector("#venues-list"),
  resultsTitle: document.querySelector("#results-title"),
  activeFilters: document.querySelector("#active-filters"),
  publicationsList: document.querySelector("#publications-list"),
  detailPanel: document.querySelector("#detail-panel"),
  publicationsView: document.querySelector("#publications-view"),
  venuesView: document.querySelector("#venues-view"),
  viewPublications: document.querySelector("#view-publications"),
  viewVenues: document.querySelector("#view-venues"),
  template: document.querySelector("#paper-card-template"),
  search: document.querySelector("#search-input"),
  year: document.querySelector("#year-filter"),
  type: document.querySelector("#type-filter"),
  venue: document.querySelector("#venue-filter"),
  language: document.querySelector("#language-filter"),
  oa: document.querySelector("#oa-filter"),
  sort: document.querySelector("#sort-filter"),
  reset: document.querySelector("#reset-filters"),
  exportJson: document.querySelector("#export-json"),
};

async function loadData() {
  const response = await fetch("./data/publications.json", { cache: "no-store" });
  const publications = await response.json();
  state.publications = Array.isArray(publications) ? publications : [];
  populateFilters();
  bindEvents();
  render();
}

function populateSelect(select, values, label) {
  select.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = label;
  select.appendChild(allOption);

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function uniqueValues(key) {
  return [...new Set(state.publications.map((item) => item[key]).filter(Boolean))];
}

function populateFilters() {
  populateSelect(els.year, uniqueValues("year").sort((a, b) => b - a), "Todos");
  populateSelect(els.type, uniqueValues("type").sort(), "Todos");
  populateSelect(els.venue, uniqueValues("venue").sort((a, b) => a.localeCompare(b, "es")), "Todos");
  populateSelect(els.language, uniqueValues("language").sort(), "Todos");
}

function bindEvents() {
  els.search.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    render();
  });

  ["year", "type", "venue", "language", "oa", "sort"].forEach((key) => {
    els[key].addEventListener("change", (event) => {
      state.filters[key] = event.target.value;
      render();
    });
  });

  els.reset.addEventListener("click", () => {
    state.filters = {
      search: "",
      year: "all",
      type: "all",
      venue: "all",
      language: "all",
      oa: "all",
      sort: "year-desc",
    };
    els.search.value = "";
    els.year.value = "all";
    els.type.value = "all";
    els.venue.value = "all";
    els.language.value = "all";
    els.oa.value = "all";
    els.sort.value = "year-desc";
    render();
  });

  els.exportJson.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state.filteredItems, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "publications-filtered.json";
    link.click();
    URL.revokeObjectURL(url);
  });

  els.viewPublications.addEventListener("click", () => setView("publications"));
  els.viewVenues.addEventListener("click", () => setView("venues"));
}

function setView(view) {
  state.currentView = view;
  els.viewPublications.classList.toggle("is-active", view === "publications");
  els.viewVenues.classList.toggle("is-active", view === "venues");
  els.publicationsView.classList.toggle("is-active", view === "publications");
  els.venuesView.classList.toggle("is-active", view === "venues");
}

function rebuildAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== "object") {
    return "";
  }
  const words = [];
  Object.entries(invertedIndex).forEach(([word, positions]) => {
    positions.forEach((position) => {
      words[position] = word;
    });
  });
  return words.filter(Boolean).join(" ");
}

function matchesSearch(item, search) {
  if (!search) return true;
  const haystack = [
    item.title,
    item.doi,
    item.venue,
    item.publisher,
    item.language,
    ...(item.authors || []),
    ...(item.keywords || []),
    ...(item.topics || []).map((topic) => topic.display_name || topic),
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(search);
}

function getFilteredPublications() {
  const filtered = state.publications.filter((item) => {
    if (!matchesSearch(item, state.filters.search)) return false;
    if (state.filters.year !== "all" && String(item.year) !== state.filters.year) return false;
    if (state.filters.type !== "all" && item.type !== state.filters.type) return false;
    if (state.filters.venue !== "all" && item.venue !== state.filters.venue) return false;
    if (state.filters.language !== "all" && item.language !== state.filters.language) return false;
    if (state.filters.oa === "yes" && !item.is_open_access) return false;
    if (state.filters.oa === "no" && item.is_open_access) return false;
    return true;
  });

  filtered.sort((left, right) => {
    if (state.filters.sort === "citations-desc") {
      return (right.citations || 0) - (left.citations || 0);
    }
    if (state.filters.sort === "title-asc") {
      return (left.title || "").localeCompare(right.title || "", "es");
    }
    return (right.year || 0) - (left.year || 0) || (right.citations || 0) - (left.citations || 0);
  });

  return filtered;
}

function metricCard(label, value) {
  return `<div class="metric-item"><strong>${value}</strong><span>${label}</span></div>`;
}

function summaryCard(label, value) {
  return `<div class="summary-item"><strong>${value}</strong><span>${label}</span></div>`;
}

function renderStats(items) {
  const citations = items.reduce((sum, item) => sum + (item.citations || 0), 0);
  const venues = new Set(items.map((item) => item.venue).filter(Boolean)).size;
  const years = items.map((item) => item.year).filter(Boolean);
  const latestYear = years.length ? Math.max(...years) : "—";

  els.heroStats.innerHTML = [
    metricCard("Pubs", items.length),
    metricCard("Citas", citations),
    metricCard("Venues", venues),
    metricCard("Año", latestYear),
  ].join("");

  els.summaryList.innerHTML = [
    summaryCard("Acceso abierto", items.filter((item) => item.is_open_access).length),
    summaryCard("Con DOI", items.filter((item) => item.doi).length),
    summaryCard("Idiomas", new Set(items.map((item) => item.language).filter(Boolean)).size),
    summaryCard("Tipos", new Set(items.map((item) => item.type).filter(Boolean)).size),
  ].join("");
}

function renderVenues(items) {
  const counts = new Map();
  items.forEach((item) => {
    if (!item.venue) return;
    counts.set(item.venue, (counts.get(item.venue) || 0) + 1);
  });

  const rows = [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "es"));

  if (!rows.length) {
    els.venuesList.innerHTML = '<div class="empty-state">No hay venues con los filtros actuales.</div>';
    return;
  }

  els.venuesList.innerHTML = rows
    .map(
      ([venue, count], index) => `
        <button class="venue-row" type="button" data-venue="${escapeHtml(venue)}">
          <span class="venue-row-index">${index + 1}.</span>
          <span class="venue-row-name">${escapeHtml(venue)}</span>
          <span class="venue-row-count">${count}</span>
        </button>
      `
    )
    .join("");

  els.venuesList.querySelectorAll(".venue-row").forEach((button) => {
    button.addEventListener("click", () => {
      const venue = button.dataset.venue || "all";
      state.filters.venue = venue;
      els.venue.value = venue;
      setView("publications");
      render();
    });
  });
}

function renderActiveFilters() {
  const labels = {
    search: "buscar",
    year: "año",
    type: "tipo",
    venue: "venue",
    language: "idioma",
    oa: "oa",
    sort: "orden",
  };
  const pills = [];
  Object.entries(state.filters).forEach(([key, value]) => {
    if (!value || value === "all" || (key === "sort" && value === "year-desc")) return;
    pills.push(`<span class="filter-pill">${labels[key]}: ${escapeHtml(String(value))}</span>`);
  });
  els.activeFilters.innerHTML = pills.join("");
}

function createMetaBits(item) {
  const bits = [];
  if (item.type) bits.push(item.type);
  if (item.language) bits.push(item.language.toUpperCase());
  if (item.volume) bits.push(`Vol. ${item.volume}`);
  if (item.issue) bits.push(`N. ${item.issue}`);
  if (item.citations || item.citations === 0) bits.push(`Citas ${item.citations}`);
  return bits.map((bit) => `<span>${escapeHtml(String(bit))}</span>`).join('<span class="meta-sep">|</span>');
}

function createLink(href, label) {
  if (!href) return "";
  return `<a href="${href}" target="_blank" rel="noreferrer">${label}</a>`;
}

function renderDetail(item) {
  if (!item) {
    els.detailPanel.innerHTML = '<div class="detail-empty">Selecciona una publicación para ver sus detalles.</div>';
    return;
  }

  const abstract = rebuildAbstract(item.abstract_inverted_index) || "Sin resumen disponible.";
  const topics = (item.topics || []).map((topic) => topic.display_name || topic).filter(Boolean).slice(0, 8);
  const details = [
    ["Año", item.year || "—"],
    ["Tipo", item.type || "—"],
    ["Idioma", item.language || "—"],
    ["Venue", item.venue || "—"],
    ["DOI", item.doi || "—"],
    ["Volumen", item.volume || "—"],
    ["Issue", item.issue || "—"],
    ["Citas", item.citations ?? "—"],
  ];

  els.detailPanel.innerHTML = `
    <div class="detail-card">
      <div class="detail-header">
        <p class="eyebrow">Detalle</p>
        <h3>${escapeHtml(item.title || "Sin título")}</h3>
      </div>
      <p class="detail-authors">${escapeHtml((item.authors || []).join(", ") || "Autores no disponibles")}</p>
      <p class="detail-venue">${escapeHtml(item.venue || "Venue no disponible")}</p>
      <div class="detail-grid">
        ${details.map(([label, value]) => `<div class="detail-meta"><strong>${label}</strong><span>${escapeHtml(String(value))}</span></div>`).join("")}
      </div>
      <div class="detail-block">
        <strong>Resumen</strong>
        <p>${escapeHtml(abstract)}</p>
      </div>
      ${topics.length ? `<div class="detail-block"><strong>Temas</strong><p>${escapeHtml(topics.join(" · "))}</p></div>` : ""}
      <div class="detail-links">
        ${[
          createLink(item.oa_landing_page_url || item.source_url, "Abrir"),
          createLink(item.oa_pdf_url, "PDF"),
          createLink(item.doi ? `https://doi.org/${item.doi}` : "", "DOI"),
        ].join('<span class="meta-sep">|</span>')}
      </div>
    </div>
  `;
}

function renderCards(items) {
  els.publicationsList.innerHTML = "";

  if (!items.length) {
    els.publicationsList.innerHTML = '<div class="empty-state">No hay publicaciones que coincidan con los filtros actuales.</div>';
    renderDetail(null);
    return;
  }

  if (!items.some((item) => item.id === state.selectedId)) {
    state.selectedId = items[0].id;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item, index) => {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.dataset.id = item.id || "";
    node.classList.toggle("is-selected", item.id === state.selectedId);
    node.querySelector(".paper-index").textContent = `${index + 1}.`;
    node.querySelector(".paper-year").textContent = item.year || "—";
    node.querySelector(".paper-title").textContent = item.title || "Sin título";
    node.querySelector(".paper-authors").textContent = (item.authors || []).join(", ") || "Autores no disponibles";
    node.querySelector(".paper-venue").textContent = item.venue || "Venue no disponible";
    node.querySelector(".paper-meta").innerHTML = createMetaBits(item);
    node.addEventListener("click", () => {
      state.selectedId = item.id;
      render();
    });
    fragment.appendChild(node);
  });

  els.publicationsList.appendChild(fragment);
  renderDetail(items.find((item) => item.id === state.selectedId) || items[0]);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function render() {
  const items = getFilteredPublications();
  state.filteredItems = items;
  els.resultsTitle.textContent = `${items.length} publicaciones visibles`;
  renderStats(items);
  renderVenues(items);
  renderActiveFilters();
  renderCards(items);
}

loadData().catch((error) => {
  els.resultsTitle.textContent = "No se pudo cargar la base";
  els.publicationsList.innerHTML = `<div class="empty-state">${error.message}</div>`;
  renderDetail(null);
});
