import { store } from '../state/store';
import { t } from '../../shared/i18n';
import type { Dataset } from '../../shared/types/state';

function renderDatasetOptions(datasets: Record<string, Dataset>, activeDatasetId: string | null): string {
  const options = Object.values(datasets)
    .map((dataset) => `<option value="${dataset.id}" ${dataset.id === activeDatasetId ? 'selected' : ''}>${dataset.name}</option>`)
    .join('');

  return `<option value="">--</option>${options}`;
}

function moduleLabel(moduleId: string): string {
  if (moduleId === 'likert') return 'Likert Charts';
  if (moduleId === 'distribution') return 'Distribution Lab';
  return 'Data Processor';
}

function moduleIcon(moduleId: string): string {
  if (moduleId === 'likert') return 'ph-chart-bar';
  if (moduleId === 'distribution') return 'ph-chart-scatter';
  return 'ph-database';
}

export function renderShell(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const state = store.getState();
  const activeDataset = state.activeDatasetId ? state.datasets[state.activeDatasetId] : null;

  app.innerHTML = `
    <div class="shell module-${state.activeModule}">
      <header class="suite-topbar">
        <div class="suite-brand">
          <i class="ph ph-circles-three-plus suite-brand-dot"></i>
          <strong>Survey Suite</strong>
          <span class="suite-badge">BETA</span>
        </div>

        <nav class="suite-modules-nav nav nav-horizontal">
          <button data-module="processor" class="${state.activeModule === 'processor' ? 'active' : ''}">
            <i class="ph ph-database"></i>
            <span>${t(state.language, 'processor')}</span>
          </button>
          <button data-module="likert" class="${state.activeModule === 'likert' ? 'active' : ''}">
            <i class="ph ph-chart-bar"></i>
            <span>${t(state.language, 'likert')}</span>
          </button>
          <button data-module="distribution" class="${state.activeModule === 'distribution' ? 'active' : ''}">
            <i class="ph ph-chart-scatter"></i>
            <span>${t(state.language, 'distribution')}</span>
          </button>
        </nav>

        <div class="suite-topbar-actions">
          <button id="btn-create-sample">
            <i class="ph ph-flask"></i>
            <span>${t(state.language, 'createSample')}</span>
          </button>
          <button id="btn-reset">
            <i class="ph ph-arrow-counter-clockwise"></i>
            <span>${t(state.language, 'clearData')}</span>
          </button>
        </div>
      </header>

      <section class="suite-ribbon">
        <div class="suite-ribbon-main">
          <i class="ph ${moduleIcon(state.activeModule)}"></i>
          <strong class="suite-ribbon-title">${moduleLabel(state.activeModule)}</strong>
          <span class="suite-ribbon-dataset">Dataset activo: <strong>${activeDataset?.name ?? t(state.language, 'noDataset')}</strong></span>
        </div>

        <div class="suite-ribbon-controls">
          <label>
            Dataset en storage
            <select id="dataset-select">${renderDatasetOptions(state.datasets, state.activeDatasetId)}</select>
          </label>

          <label>
            Idioma
            <select id="lang-select">
              <option value="es" ${state.language === 'es' ? 'selected' : ''}>Español</option>
              <option value="en" ${state.language === 'en' ? 'selected' : ''}>English</option>
            </select>
          </label>
        </div>
      </section>

      <main id="module-root" class="module-root"></main>
    </div>
  `;
}
