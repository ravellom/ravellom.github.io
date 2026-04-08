import type { SuiteState } from '../../shared/types/state';

function datasetSelectOptions(state: SuiteState, selectedId: string | null): string {
  return Object.values(state.datasets)
    .map((ds) => `<option value="${ds.id}" ${ds.id === selectedId ? 'selected' : ''}>${ds.name} (${ds.records.length})</option>`)
    .join('');
}

function columnOptions(columns: string[]): string {
  return columns.map((c) => `<option value="${c}">${c}</option>`).join('');
}

function renderPreviewTable(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return '<p style="margin:0; color:#5a6475;">Sin filas para vista previa.</p>';

  const columns = Object.keys(rows[0]);
  const head = columns.map((c) => `<th>${c}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${columns.map((c) => `<td>${String(row[c] ?? '')}</td>`).join('')}</tr>`)
    .join('');

  return `
    <div style="overflow:auto; border:1px solid #d7dbe3; border-radius:8px;">
      <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
        <thead style="background:#f8fafc;">
          <tr>${head}</tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function formatDatasetTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function inferColumnKind(values: unknown[]): 'numeric' | 'text' | 'mixed' | 'empty' {
  const present = values.filter((value) => value !== null && value !== undefined && String(value).trim() !== '');
  if (!present.length) return 'empty';
  let numericCount = 0;
  present.forEach((value) => {
    const numeric = typeof value === 'string' ? Number(value.trim()) : Number(value);
    if (Number.isFinite(numeric)) numericCount += 1;
  });
  if (numericCount === present.length) return 'numeric';
  if (numericCount === 0) return 'text';
  return 'mixed';
}

function renderDatasetInspector(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) {
    return '<p style="margin:0; color:#5a6475;">Sin informacion de dataset disponible.</p>';
  }

  const columns = Object.keys(rows[0]);
  const nullCells = rows.reduce((total, row) => (
    total + columns.reduce((acc, column) => {
      const value = row[column];
      return acc + (value === null || value === undefined || String(value).trim() === '' ? 1 : 0);
    }, 0)
  ), 0);
  const numericColumns = columns.filter((column) => inferColumnKind(rows.map((row) => row[column])) === 'numeric').length;
  const textColumns = columns.filter((column) => inferColumnKind(rows.map((row) => row[column])) === 'text').length;

  const columnCards = columns.map((column) => {
    const values = rows.map((row) => row[column]);
    const kind = inferColumnKind(values);
    const present = values.filter((value) => value !== null && value !== undefined && String(value).trim() !== '');
    const emptyCount = values.length - present.length;
    const uniqueCount = new Set(present.map((value) => String(value))).size;
    const sample = present[0] ?? '(vacio)';
    const kindLabel = kind === 'numeric' ? 'Numerica' : kind === 'text' ? 'Texto' : kind === 'mixed' ? 'Mixta' : 'Vacia';

    return `
      <article class="processor-column-card">
        <h4>${column}</h4>
        <p><strong>Tipo:</strong> ${kindLabel}</p>
        <p><strong>Unicos:</strong> ${uniqueCount}</p>
        <p><strong>Vacios:</strong> ${emptyCount}</p>
        <p><strong>Ejemplo:</strong> ${String(sample)}</p>
      </article>
    `;
  }).join('');

  return `
    <section class="processor-inspector">
      <div class="processor-stats-grid">
        <article class="processor-stat-card">
          <span>Registros</span>
          <strong>${rows.length}</strong>
        </article>
        <article class="processor-stat-card">
          <span>Columnas</span>
          <strong>${columns.length}</strong>
        </article>
        <article class="processor-stat-card">
          <span>Numericas</span>
          <strong>${numericColumns}</strong>
        </article>
        <article class="processor-stat-card">
          <span>Texto</span>
          <strong>${textColumns}</strong>
        </article>
        <article class="processor-stat-card">
          <span>Celdas vacias</span>
          <strong>${nullCells}</strong>
        </article>
      </div>

      <div class="processor-columns-grid">
        ${columnCards}
      </div>
    </section>
  `;
}

function renderStorageCards(state: SuiteState): string {
  const datasets = Object.values(state.datasets)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (!datasets.length) {
    return '<p style="margin:0; color:#5a6475;">No hay datasets guardados todavia.</p>';
  }

  return `
    <section class="processor-storage-list">
      ${datasets.map((ds) => `
        <article class="processor-storage-card ${ds.id === state.activeDatasetId ? 'active' : ''}">
          <div class="processor-storage-card-head">
            <h4>${ds.name}</h4>
            ${ds.id === state.activeDatasetId ? '<span class="processor-storage-badge">Activo</span>' : ''}
          </div>
          <p><strong>Registros:</strong> ${ds.records.length}</p>
          <p><strong>Columnas:</strong> ${ds.records[0] ? Object.keys(ds.records[0]).length : 0}</p>
          <p><strong>Actualizado:</strong> ${formatDatasetTime(ds.updatedAt)}</p>
          <div class="processor-storage-actions">
            <button type="button" data-storage-activate="${ds.id}"><i class="ph ph-play"></i> Activar</button>
            <button type="button" data-storage-delete="${ds.id}"><i class="ph ph-trash"></i> Eliminar</button>
          </div>
        </article>
      `).join('')}
    </section>
  `;
}

export function renderProcessor(root: HTMLElement, state: SuiteState): void {
  const dataset = state.activeDatasetId ? state.datasets[state.activeDatasetId] : null;
  const previewRows = Math.max(1, state.config.processor.previewRows || 8);
  const preview = dataset?.records.slice(0, previewRows) ?? [];
  const panel = state.ui.processor.panel;
  const columns = dataset?.records?.[0] ? Object.keys(dataset.records[0]) : [];

  const renderImportPanel = panel === 'import';
  const renderTransformPanel = panel === 'transform';
  const renderCleanPanel = panel === 'clean';
  const renderStoragePanel = panel === 'storage';

  root.innerHTML = `
    <section class="workspace-layout">
      <aside class="workspace-rail">
        <h4>WORKSPACE</h4>
        <button data-module-panel="import" class="${panel === 'import' ? 'active' : ''}"><i class="ph ph-upload"></i><span>Import</span></button>
        <button data-module-panel="transform" class="${panel === 'transform' ? 'active' : ''}"><i class="ph ph-magic-wand"></i><span>Transform</span></button>
        <button data-module-panel="clean" class="${panel === 'clean' ? 'active' : ''}"><i class="ph ph-broom"></i><span>Clean</span></button>
        <button data-module-panel="storage" class="${panel === 'storage' ? 'active' : ''}"><i class="ph ph-cloud"></i><span>Storage</span></button>
      </aside>

      <aside class="workspace-config-panel">
        <h3 style="margin:0;">Processor · ${panel}</h3>

        ${renderImportPanel ? `
          <div class="config-block">
            <p style="margin:0; color:#5a6475; font-size:0.9rem;">
              Importa <strong>CSV</strong>, <strong>TSV</strong> o <strong>JSON</strong>. Para <strong>Excel (.xlsx/.xls)</strong>, la referencia completa sigue estando en la v1 por ahora.
            </p>

            <label>
              Nombre del dataset
              <input id="processor-dataset-name" type="text" placeholder="encuesta-marzo-2026" />
            </label>

            <label>
              Tipo de fuente
              <select id="processor-source-type">
                <option value="auto" ${state.config.processor.sourceType === 'auto' ? 'selected' : ''}>Auto</option>
                <option value="google_forms" ${state.config.processor.sourceType === 'google_forms' ? 'selected' : ''}>Google Forms</option>
                <option value="ms_forms" ${state.config.processor.sourceType === 'ms_forms' ? 'selected' : ''}>MS Forms</option>
                <option value="generic" ${state.config.processor.sourceType === 'generic' ? 'selected' : ''}>CSV generico</option>
                <option value="json" ${state.config.processor.sourceType === 'json' ? 'selected' : ''}>JSON</option>
              </select>
            </label>

            <label>
              Formato
              <select id="processor-format">
                <option value="csv" selected>CSV</option>
                <option value="json">JSON</option>
              </select>
            </label>

            <label>
              Delimitador CSV
              <select id="processor-delimiter">
                <option value="auto" ${state.config.processor.csvDelimiterMode === 'auto' ? 'selected' : ''}>Auto</option>
                <option value="," ${state.config.processor.csvDelimiterMode === ',' ? 'selected' : ''}>Coma (,)</option>
                <option value=";" ${state.config.processor.csvDelimiterMode === ';' ? 'selected' : ''}>Punto y coma (;)</option>
                <option value="\t" ${state.config.processor.csvDelimiterMode === '\t' ? 'selected' : ''}>Tab</option>
                <option value="|" ${state.config.processor.csvDelimiterMode === '|' ? 'selected' : ''}>Barra (|)</option>
              </select>
            </label>

            <label>
              Archivo local (.csv/.tsv/.txt/.json)
              <input id="processor-file" type="file" accept=".csv,.tsv,.txt,.json,application/json,text/csv,text/plain" />
            </label>

            <label>
              O pega contenido aquí
              <textarea id="processor-input" rows="8" placeholder='respondent,q1,q2\n1,5,4\n2,3,4'></textarea>
            </label>

            <p style="margin:0; color:#5a6475; font-size:0.85rem;">
              Consejo: usa <strong>Auto</strong> para detectar delimitador y formato rapido. Si vienes de Forms o de un export poco limpio, especifica fuente y delimitador.
            </p>

            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button id="processor-import-btn" type="button"><i class="ph ph-check"></i> Importar y activar</button>
              <button id="processor-clear-btn" type="button"><i class="ph ph-eraser"></i> Limpiar</button>
            </div>
          </div>
        ` : ''}

        ${renderTransformPanel ? `
          <div class="config-block">
            <h3>Likert texto -> numero</h3>
            <label>
              Columnas
              <select id="processor-text-cols" multiple size="6">${columnOptions(columns)}</select>
            </label>
            <button id="processor-text-likert-btn" type="button"><i class="ph ph-text-aa"></i> Convertir texto</button>
          </div>

          <div class="config-block">
            <h3>Normalizar escala</h3>
            <label>
              Columnas numericas
              <select id="processor-normalize-cols" multiple size="6">${columnOptions(columns)}</select>
            </label>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:8px;">
              <label>Min<input id="processor-normalize-min" type="number" value="1" /></label>
              <label>Max<input id="processor-normalize-max" type="number" value="5" /></label>
            </div>
            <button id="processor-normalize-btn" type="button"><i class="ph ph-scales"></i> Normalizar</button>
          </div>

          <div class="config-block">
            <h3>Promedio de columnas</h3>
            <label>
              Columnas
              <select id="processor-avg-cols" multiple size="6">${columnOptions(columns)}</select>
            </label>
            <label>
              Nombre nueva columna
              <input id="processor-avg-name" type="text" placeholder="avg_score" />
            </label>
            <button id="processor-avg-btn" type="button"><i class="ph ph-calculator"></i> Calcular promedio</button>
          </div>
        ` : ''}

        ${renderCleanPanel ? `
          <div class="config-block">
            <h3>Clean</h3>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button id="processor-trim-btn" type="button"><i class="ph ph-scissors"></i> Trim</button>
              <button id="processor-remove-nulls-btn" type="button"><i class="ph ph-trash"></i> Remove nulls</button>
              <button id="processor-remove-dup-btn" type="button"><i class="ph ph-copy"></i> Remove duplicates</button>
            </div>
          </div>

          <div class="config-block">
            <h3>Fill missing values</h3>
            <label>
              Valor para completar
              <input id="processor-fill-value" type="text" value="${state.config.processor.defaultFillValue}" placeholder="N/A" />
            </label>
            <button id="processor-fill-btn" type="button"><i class="ph ph-drop-half-bottom"></i> Aplicar fill missing</button>
          </div>
        ` : ''}

        ${renderStoragePanel ? `
          <div class="config-block">
            <h3>Datasets</h3>
            <p style="margin:0; color:#5a6475; font-size:0.9rem;">
              Gestiona datasets guardados y revisa rapidamente cual esta activo.
            </p>
            <label>
              Guardar dataset activo como
              <input
                id="processor-storage-name"
                type="text"
                placeholder="${dataset?.name ? `${dataset.name}-copy` : 'dataset-guardado'}"
                value="${dataset?.name ? `${dataset.name}-copy` : ''}"
              />
            </label>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
              <button id="processor-storage-save-btn" type="button"><i class="ph ph-floppy-disk"></i> Guardar en storage</button>
            </div>
            <label>
              Seleccion
              <select id="processor-storage-select">
                <option value="">(selecciona dataset)</option>
                ${datasetSelectOptions(state, state.activeDatasetId)}
              </select>
            </label>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button id="processor-storage-load-btn" type="button"><i class="ph ph-download-simple"></i> Activar</button>
              <button id="processor-storage-delete-btn" type="button"><i class="ph ph-trash"></i> Eliminar</button>
            </div>
            ${renderStorageCards(state)}
          </div>

          <div class="config-block">
            <h3>Export</h3>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button id="processor-export-csv-btn" type="button"><i class="ph ph-file-csv"></i> Export CSV</button>
              <button id="processor-export-json-btn" type="button"><i class="ph ph-file-json"></i> Export JSON</button>
            </div>
          </div>
        ` : ''}

        <p id="processor-status" style="margin:8px 0 0; font-size:0.9rem;"></p>
      </aside>

      <section class="workspace-canvas-area">
        <div class="workspace-canvas-header">
          <h2>Data Preview</h2>
          <div class="chart-toolbar" style="width:auto;">
            <button id="processor-view-table" title="Table" class="${state.ui.processor.view === 'table' ? 'active' : ''}"><i class="ph ph-table"></i></button>
            <button id="processor-view-json" title="JSON" class="${state.ui.processor.view === 'json' ? 'active' : ''}"><i class="ph ph-code"></i></button>
          </div>
        </div>

        <div class="chart-stage">
          <p style="margin-top:0;">Nombre: <strong>${dataset?.name ?? 'Ninguno'}</strong></p>
          <p style="margin-top:0;">Registros: <strong>${dataset?.records.length ?? 0}</strong></p>
          <label style="display:grid; gap:6px; max-width:220px; margin:0 0 12px; font-size:0.9rem;">
            Filas de preview
            <input id="processor-preview-rows" type="number" min="1" max="200" value="${previewRows}" />
          </label>

          ${dataset ? renderDatasetInspector(dataset.records as Array<Record<string, unknown>>) : '<p style="margin:0 0 12px; color:#5a6475;">Carga un dataset para ver columnas, tipos y calidad basica.</p>'}

          ${state.ui.processor.view === 'table' ? renderPreviewTable(preview as Array<Record<string, unknown>>) : `<pre>${JSON.stringify(preview, null, 2)}</pre>`}
        </div>
      </section>
    </section>
  `;
}

