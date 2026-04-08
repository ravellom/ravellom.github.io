import './styles/main.css';
import { renderShell } from './app/shell/render';
import { initRouter } from './app/router';
import { store } from './app/state/store';
import { renderProcessor } from './features/processor/view';
import { renderLikert } from './features/likert/view';
import { renderDistribution } from './features/distribution/view';
import { getLikertPreset, getLikertPresetLabels } from './features/likert/presets';
import { compareDistributionGroups, groupDistributionData, summarizeOverall } from './features/distribution/analysis';
import { parseCSV, parseJSON } from './features/processor/parser';
import { renderLikertCanvas } from './features/likert/chart';
import { renderDistributionCanvas } from './features/distribution/chart';
import { eventBus } from './shared/events/bus';
import { downloadContent } from './shared/export/files';
import { bindChartExportControls, bindChartStageControls } from './shared/ui/chartControls';
import type { DatasetRecord } from './shared/types/state';

function sampleRecords() {
  return [
    { respondent: '1', q1: 5, q2: 4, q3: 5 },
    { respondent: '2', q1: 4, q2: 4, q3: 3 },
    { respondent: '3', q1: 3, q2: 5, q3: 4 }
  ];
}

function getActiveDataset() {
  const state = store.getState();
  return state.activeDatasetId ? state.datasets[state.activeDatasetId] : null;
}

function getLikertComparisonDataset() {
  const state = store.getState();
  const preId = state.config.likert.comparisonPreDatasetId;
  const postId = state.config.likert.comparisonPostDatasetId;
  if (!preId || !postId) return null;

  const pre = state.datasets[preId];
  const post = state.datasets[postId];
  if (!pre || !post) return null;

  const preHeaders = pre.records[0] ? Object.keys(pre.records[0]) : [];
  const postHeaders = post.records[0] ? Object.keys(post.records[0]) : [];
  const common = preHeaders.filter((header) => postHeaders.includes(header)).filter((col) => {
    const hasNumeric = (rows: DatasetRecord[]) => rows.some((row) => {
      const raw = row[col];
      const n = typeof raw === 'string' ? Number(raw.trim()) : Number(raw);
      return Number.isFinite(n);
    });
    return hasNumeric(pre.records) || hasNumeric(post.records);
  });

  if (!common.length) return null;

  const maxRows = Math.max(pre.records.length, post.records.length);
  const records: DatasetRecord[] = [];
  for (let index = 0; index < maxRows; index += 1) {
    const row: DatasetRecord = {};
    common.forEach((col) => {
      row[`${col} [Pre]`] = pre.records[index]?.[col] ?? null;
      row[`${col} [Post]`] = post.records[index]?.[col] ?? null;
    });
    records.push(row);
  }

  return {
    id: `cmp_${pre.id}_${post.id}`,
    name: `${pre.name} vs ${post.name}`,
    records,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function renderActiveModule() {
  const state = store.getState();
  const root = document.getElementById('module-root');
  if (!root) return;

  switch (state.activeModule) {
    case 'likert':
      renderLikert(root, state);
      break;
    case 'distribution':
      renderDistribution(root, state);
      break;
    case 'processor':
    default:
      renderProcessor(root, state);
      break;
  }
}

function bindShellActions() {
  const langSelect = document.getElementById('lang-select') as HTMLSelectElement | null;
  const datasetSelect = document.getElementById('dataset-select') as HTMLSelectElement | null;
  const btnCreateSample = document.getElementById('btn-create-sample') as HTMLButtonElement | null;
  const btnReset = document.getElementById('btn-reset') as HTMLButtonElement | null;

  langSelect?.addEventListener('change', (event) => {
    const target = event.target as HTMLSelectElement;
    if (target.value === 'es' || target.value === 'en') {
      store.setLanguage(target.value);
    }
  });

  datasetSelect?.addEventListener('change', (event) => {
    const target = event.target as HTMLSelectElement;
    store.setActiveDataset(target.value || null);
  });

  btnCreateSample?.addEventListener('click', () => {
    store.addDataset(`sample-${Date.now()}`, sampleRecords());
  });

  btnReset?.addEventListener('click', () => {
    store.hardReset();
  });
}

function setProcessorStatus(message: string, isError = false) {
  const status = document.getElementById('processor-status');
  if (!status) return;
  status.textContent = message;
  (status as HTMLElement).style.color = isError ? '#b91c1c' : '#0f766e';
}

function inferProcessorFormat(fileName: string, selectedFormat: string, sourceType: string): 'csv' | 'json' {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.json') || sourceType === 'json' || selectedFormat === 'json') {
    return 'json';
  }
  return 'csv';
}

function describeProcessorSource(sourceType: string): string {
  if (sourceType === 'google_forms') return 'Google Forms';
  if (sourceType === 'ms_forms') return 'MS Forms';
  if (sourceType === 'generic') return 'CSV generico';
  if (sourceType === 'json') return 'JSON';
  return 'Auto';
}

function describeDelimiter(delimiter: 'auto' | ',' | ';' | '\t' | '|'): string {
  if (delimiter === ',') return 'coma';
  if (delimiter === ';') return 'punto y coma';
  if (delimiter === '\t') return 'tab';
  if (delimiter === '|') return 'barra';
  return 'auto';
}

async function readSelectedFile(fileInput: HTMLInputElement): Promise<string> {
  const file = fileInput.files?.[0];
  if (!file) return '';
  return await file.text();
}

function selectedValues(select: HTMLSelectElement | null): string[] {
  if (!select) return [];
  return Array.from(select.selectedOptions).map((o) => o.value).filter(Boolean);
}

function isPaletteId(value: string): value is 'blue_orange' | 'red_green' | 'purple_yellow' | 'spectral' | 'viridis' | 'warm' | 'cool' | 'earth' {
  return value === 'blue_orange'
    || value === 'red_green'
    || value === 'purple_yellow'
    || value === 'spectral'
    || value === 'viridis'
    || value === 'warm'
    || value === 'cool'
    || value === 'earth';
}

function trimValues(records: DatasetRecord[]): DatasetRecord[] {
  return records.map((row) => {
    const out: DatasetRecord = {};
    Object.entries(row).forEach(([k, v]) => {
      if (typeof v === 'string') {
        const t = v.trim();
        out[k] = t === '' ? null : t;
      } else {
        out[k] = v;
      }
    });
    return out;
  });
}

function removeNullRows(records: DatasetRecord[]): DatasetRecord[] {
  return records.filter((row) => Object.values(row).every((v) => v !== null && v !== ''));
}

function fillMissing(records: DatasetRecord[], fillValue: string): DatasetRecord[] {
  return records.map((row) => {
    const out: DatasetRecord = {};
    Object.entries(row).forEach(([k, v]) => {
      if (v === null || v === '') {
        out[k] = fillValue;
      } else {
        out[k] = v;
      }
    });
    return out;
  });
}
function removeDuplicates(records: DatasetRecord[]): DatasetRecord[] {
  const seen = new Set<string>();
  return records.filter((row) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function convertLikertText(records: DatasetRecord[], columns: string[]): DatasetRecord[] {
  const map: Record<string, number> = {
    'strongly disagree': 1,
    'disagree': 2,
    'neutral': 3,
    'agree': 4,
    'strongly agree': 5,
    'muy en desacuerdo': 1,
    'en desacuerdo': 2,
    'de acuerdo': 4,
    'muy de acuerdo': 5
  };

  return records.map((row) => {
    const out: DatasetRecord = { ...row };
    columns.forEach((col) => {
      const raw = row[col];
      if (typeof raw !== 'string') return;
      const key = raw.trim().toLowerCase();
      if (key in map) out[col] = map[key];
    });
    return out;
  });
}

function normalizeScale(records: DatasetRecord[], columns: string[], minTarget: number, maxTarget: number): DatasetRecord[] {
  return records.map((row) => {
    const out: DatasetRecord = { ...row };
    columns.forEach((col) => {
      const raw = row[col];
      const n = typeof raw === 'string' ? Number(raw.trim()) : Number(raw);
      if (!Number.isFinite(n)) return;

      const values = records
        .map((r) => (typeof r[col] === 'string' ? Number((r[col] as string).trim()) : Number(r[col])))
        .filter((v) => Number.isFinite(v)) as number[];

      const min = Math.min(...values);
      const max = Math.max(...values);
      if (max === min) return;

      const normalized = minTarget + ((n - min) / (max - min)) * (maxTarget - minTarget);
      out[col] = Number(normalized.toFixed(3));
    });
    return out;
  });
}

function calculateAverage(records: DatasetRecord[], columns: string[], outCol: string): DatasetRecord[] {
  if (!outCol.trim()) return records;
  return records.map((row) => {
    const nums = columns
      .map((col) => {
        const raw = row[col];
        return typeof raw === 'string' ? Number(raw.trim()) : Number(raw);
      })
      .filter((v) => Number.isFinite(v));

    const out: DatasetRecord = { ...row };
    out[outCol] = nums.length ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(3)) : null;
    return out;
  });
}

function toCSV(records: DatasetRecord[]): string {
  if (!records.length) return '';
  const headers = Object.keys(records[0]);
  const escape = (value: unknown) => {
    const str = value === null || value === undefined ? '' : String(value);
    if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const lines = [headers.join(',')];
  records.forEach((row) => {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  });
  return lines.join('\n');
}

function cloneRecords(records: DatasetRecord[]): DatasetRecord[] {
  return records.map((row) => ({ ...row }));
}

function bindProcessorActions() {
  const datasetNameInput = document.getElementById('processor-dataset-name') as HTMLInputElement | null;
  const sourceTypeSelect = document.getElementById('processor-source-type') as HTMLSelectElement | null;
  const formatSelect = document.getElementById('processor-format') as HTMLSelectElement | null;
  const delimiterSelect = document.getElementById('processor-delimiter') as HTMLSelectElement | null;
  const fileInput = document.getElementById('processor-file') as HTMLInputElement | null;
  const textInput = document.getElementById('processor-input') as HTMLTextAreaElement | null;
  const importBtn = document.getElementById('processor-import-btn') as HTMLButtonElement | null;
  const clearBtn = document.getElementById('processor-clear-btn') as HTMLButtonElement | null;
  const trimBtn = document.getElementById('processor-trim-btn') as HTMLButtonElement | null;
  const removeNullsBtn = document.getElementById('processor-remove-nulls-btn') as HTMLButtonElement | null;
  const removeDupBtn = document.getElementById('processor-remove-dup-btn') as HTMLButtonElement | null;
  const fillBtn = document.getElementById('processor-fill-btn') as HTMLButtonElement | null;
  const fillInput = document.getElementById('processor-fill-value') as HTMLInputElement | null;

  const textColsSelect = document.getElementById('processor-text-cols') as HTMLSelectElement | null;
  const textLikertBtn = document.getElementById('processor-text-likert-btn') as HTMLButtonElement | null;
  const normColsSelect = document.getElementById('processor-normalize-cols') as HTMLSelectElement | null;
  const normMinInput = document.getElementById('processor-normalize-min') as HTMLInputElement | null;
  const normMaxInput = document.getElementById('processor-normalize-max') as HTMLInputElement | null;
  const normBtn = document.getElementById('processor-normalize-btn') as HTMLButtonElement | null;
  const avgColsSelect = document.getElementById('processor-avg-cols') as HTMLSelectElement | null;
  const avgNameInput = document.getElementById('processor-avg-name') as HTMLInputElement | null;
  const avgBtn = document.getElementById('processor-avg-btn') as HTMLButtonElement | null;

  const storageNameInput = document.getElementById('processor-storage-name') as HTMLInputElement | null;
  const storageSaveBtn = document.getElementById('processor-storage-save-btn') as HTMLButtonElement | null;
  const storageSelect = document.getElementById('processor-storage-select') as HTMLSelectElement | null;
  const storageLoadBtn = document.getElementById('processor-storage-load-btn') as HTMLButtonElement | null;
  const storageDeleteBtn = document.getElementById('processor-storage-delete-btn') as HTMLButtonElement | null;
  const exportCsvBtn = document.getElementById('processor-export-csv-btn') as HTMLButtonElement | null;
  const exportJsonBtn = document.getElementById('processor-export-json-btn') as HTMLButtonElement | null;
  const previewRowsInput = document.getElementById('processor-preview-rows') as HTMLInputElement | null;
  const viewTableBtn = document.getElementById('processor-view-table') as HTMLButtonElement | null;
  const viewJsonBtn = document.getElementById('processor-view-json') as HTMLButtonElement | null;

  sourceTypeSelect?.addEventListener('change', () => {
    const value = sourceTypeSelect.value;
    if (value === 'auto' || value === 'google_forms' || value === 'ms_forms' || value === 'generic' || value === 'json') {
      store.updateConfigSection('processor', { sourceType: value });
      if (value === 'json' && formatSelect) {
        formatSelect.value = 'json';
      }
    }
  });

  formatSelect?.addEventListener('change', () => {
    if (!delimiterSelect) return;
    if (formatSelect.value === 'json') {
      delimiterSelect.disabled = true;
      return;
    }
    delimiterSelect.disabled = false;
  });

  delimiterSelect?.addEventListener('change', () => {
    const value = delimiterSelect.value as 'auto' | ',' | ';' | '\t' | '|';
    if (value === 'auto' || value === ',' || value === ';' || value === '\t' || value === '|') {
      store.updateConfigSection('processor', { csvDelimiterMode: value });
    }
  });

  if (formatSelect && delimiterSelect && formatSelect.value === 'json') {
    delimiterSelect.disabled = true;
  }

  importBtn?.addEventListener('click', async () => {
    if (!datasetNameInput || !formatSelect || !delimiterSelect || !fileInput || !textInput) return;

    try {
      const datasetName = datasetNameInput.value.trim() || `dataset-${Date.now()}`;
      const inlineText = textInput.value.trim();
      const fileText = await readSelectedFile(fileInput);
      const fileName = fileInput.files?.[0]?.name ?? '';
      const raw = inlineText || fileText;

      if (!raw) {
        setProcessorStatus('No hay contenido para importar.', true);
        return;
      }

      const selectedSourceType = sourceTypeSelect?.value ?? store.getState().config.processor.sourceType;
      const format = inferProcessorFormat(fileName, formatSelect.value, selectedSourceType);
      let records;

      if (format === 'json') {
        records = parseJSON(raw);
      } else {
        let mode = delimiterSelect.value as 'auto' | ',' | ';' | '\t' | '|';
        const lowerFileName = fileName.toLowerCase();
        if (mode === 'auto' && (lowerFileName.endsWith('.tsv') || lowerFileName.endsWith('.txt'))) {
          mode = '\t';
        }
        records = parseCSV(raw, mode);
      }

      const id = store.addDataset(datasetName, records);
      store.updateConfigSection('global', { activeDatasetId: id });
      setProcessorStatus(
        `Dataset "${datasetName}" importado con ${records.length} filas. Fuente: ${describeProcessorSource(selectedSourceType)}. Formato: ${format.toUpperCase()}${format === 'csv' ? ` (${describeDelimiter(delimiterSelect.value as 'auto' | ',' | ';' | '\t' | '|')})` : ''}.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido al importar.';
      setProcessorStatus(message, true);
    }
  });

  clearBtn?.addEventListener('click', () => {
    if (datasetNameInput) datasetNameInput.value = '';
    if (textInput) textInput.value = '';
    if (fileInput) fileInput.value = '';
    if (sourceTypeSelect) sourceTypeSelect.value = store.getState().config.processor.sourceType;
    if (delimiterSelect) {
      delimiterSelect.value = store.getState().config.processor.csvDelimiterMode;
      delimiterSelect.disabled = formatSelect?.value === 'json';
    }
    setProcessorStatus('Formulario limpio.');
  });

  trimBtn?.addEventListener('click', () => {
    const dataset = getActiveDataset();
    if (!dataset) return setProcessorStatus('No hay dataset activo.', true);
    const cleaned = trimValues(dataset.records);
    store.updateDatasetRecords(dataset.id, cleaned);
    setProcessorStatus('Trim aplicado al dataset activo.');
  });

  removeNullsBtn?.addEventListener('click', () => {
    const dataset = getActiveDataset();
    if (!dataset) return setProcessorStatus('No hay dataset activo.', true);
    const cleaned = removeNullRows(dataset.records);
    store.updateDatasetRecords(dataset.id, cleaned);
    setProcessorStatus(`Filas con null removidas. ${dataset.records.length} -> ${cleaned.length}`);
  });

  removeDupBtn?.addEventListener('click', () => {
    const dataset = getActiveDataset();
    if (!dataset) return setProcessorStatus('No hay dataset activo.', true);
    const cleaned = removeDuplicates(dataset.records);
    store.updateDatasetRecords(dataset.id, cleaned);
    setProcessorStatus(`Duplicados removidos. ${dataset.records.length} -> ${cleaned.length}`);
  });

  textLikertBtn?.addEventListener('click', () => {
    const dataset = getActiveDataset();
    if (!dataset) return setProcessorStatus('No hay dataset activo.', true);
    const cols = selectedValues(textColsSelect);
    if (!cols.length) return setProcessorStatus('Selecciona columnas para conversión Likert.', true);
    const transformed = convertLikertText(dataset.records, cols);
    store.updateDatasetRecords(dataset.id, transformed);
    setProcessorStatus('Conversión texto Likert aplicada.');
  });

  normBtn?.addEventListener('click', () => {
    const dataset = getActiveDataset();
    if (!dataset) return setProcessorStatus('No hay dataset activo.', true);
    const cols = selectedValues(normColsSelect);
    if (!cols.length) return setProcessorStatus('Selecciona columnas para normalizar.', true);
    const min = Number(normMinInput?.value ?? 1);
    const max = Number(normMaxInput?.value ?? 5);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
      return setProcessorStatus('Rango inválido para normalización.', true);
    }
    const transformed = normalizeScale(dataset.records, cols, min, max);
    store.updateDatasetRecords(dataset.id, transformed);
    setProcessorStatus(`Normalización aplicada (${min}-${max}).`);
  });

  avgBtn?.addEventListener('click', () => {
    const dataset = getActiveDataset();
    if (!dataset) return setProcessorStatus('No hay dataset activo.', true);
    const cols = selectedValues(avgColsSelect);
    if (!cols.length) return setProcessorStatus('Selecciona columnas para promedio.', true);
    const outName = avgNameInput?.value?.trim() || 'avg_score';
    const transformed = calculateAverage(dataset.records, cols, outName);
    store.updateDatasetRecords(dataset.id, transformed);
    setProcessorStatus(`Promedio calculado en columna '${outName}'.`);
  });

  storageSaveBtn?.addEventListener('click', () => {
    const dataset = getActiveDataset();
    if (!dataset) return setProcessorStatus('No hay dataset activo para guardar.', true);

    const savedName = storageNameInput?.value.trim() || `${dataset.name}-copy`;
    const currentDatasetId = dataset.id;
    const savedDatasetId = store.addDataset(savedName, cloneRecords(dataset.records));

    if (!store.getState().config.processor.storageAutoActivateOnSave) {
      store.setActiveDataset(currentDatasetId);
    }

    if (storageNameInput) {
      storageNameInput.value = `${savedName}-copy`;
    }

    const wasActivated = store.getState().activeDatasetId === savedDatasetId;
    setProcessorStatus(`Dataset guardado en storage como "${savedName}"${wasActivated ? ' y activado.' : '.'}`);
  });

  storageLoadBtn?.addEventListener('click', () => {
    if (!storageSelect?.value) return setProcessorStatus('Selecciona un dataset.', true);
    store.setActiveDataset(storageSelect.value);
    setProcessorStatus('Dataset activado desde storage.');
  });

  storageDeleteBtn?.addEventListener('click', () => {
    if (!storageSelect?.value) return setProcessorStatus('Selecciona un dataset.', true);
    store.deleteDataset(storageSelect.value);
    setProcessorStatus('Dataset eliminado de storage.');
  });

  document.querySelectorAll<HTMLElement>('[data-storage-activate]').forEach((button) => {
    button.addEventListener('click', () => {
      const datasetId = button.dataset.storageActivate;
      if (!datasetId) return;
      store.setActiveDataset(datasetId);
      setProcessorStatus('Dataset activado desde storage.');
    });
  });

  document.querySelectorAll<HTMLElement>('[data-storage-delete]').forEach((button) => {
    button.addEventListener('click', () => {
      const datasetId = button.dataset.storageDelete;
      if (!datasetId) return;
      store.deleteDataset(datasetId);
      setProcessorStatus('Dataset eliminado de storage.');
    });
  });

  exportCsvBtn?.addEventListener('click', () => {
    const dataset = getActiveDataset();
    if (!dataset) return setProcessorStatus('No hay dataset activo.', true);
    const csv = toCSV(dataset.records);
    downloadContent(csv, `${dataset.name}.csv`, 'text/csv;charset=utf-8');
    setProcessorStatus('CSV exportado.');
  });

  exportJsonBtn?.addEventListener('click', () => {
    const dataset = getActiveDataset();
    if (!dataset) return setProcessorStatus('No hay dataset activo.', true);
    const json = JSON.stringify(dataset.records, null, 2);
    downloadContent(json, `${dataset.name}.json`, 'application/json;charset=utf-8');
    setProcessorStatus('JSON exportado.');
  });

  viewTableBtn?.addEventListener('click', () => {
    store.setProcessorView('table');
  });

  viewJsonBtn?.addEventListener('click', () => {
    store.setProcessorView('json');
  });

  previewRowsInput?.addEventListener('change', () => {
    const value = Number(previewRowsInput.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('processor', { previewRows: Math.max(1, Math.min(200, Math.round(value))) });
  });
}

function drawLikertIfNeeded() {
  const state = store.getState();
  if (state.activeModule !== 'likert') return;
  const canvas = document.getElementById('likert-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const dataset = state.config.likert.analysisMode === 'comparison'
    ? getLikertComparisonDataset()
    : getActiveDataset();
  renderLikertCanvas(canvas, dataset, {
    chartType: state.config.likert.chartType,
    decimalPlaces: state.config.likert.decimalPlaces,
    showLegend: state.config.likert.showLegend,
    showValues: state.config.likert.showValues,
    scalePoints: state.config.likert.scalePoints,
    scaleLabels: state.config.likert.scalePresetId !== 'custom'
      ? (getLikertPresetLabels(state.config.likert.scalePresetId, state.language) ?? state.config.likert.scaleLabels)
      : state.config.likert.scaleLabels,
    scaleStart: state.config.likert.scaleStart,
    valueMode: state.config.likert.valueMode,
    itemOrder: state.config.likert.itemOrder,
    paletteId: state.config.sharedChart.paletteId,
    selectedItems: state.config.likert.selectedItems,
    showTitle: state.config.sharedChart.showTitle,
    chartTitle: state.config.sharedChart.chartTitle,
    fontSizeTitle: state.config.likert.fontSizeTitle,
    fontSizeValues: state.config.likert.fontSizeValues,
    watermark: state.config.likert.watermark,
    legendPosition: state.config.likert.legendPosition,
    fontFamily: state.config.sharedChart.fontFamily,
    fontSizeLabels: state.config.sharedChart.labelFontSize,
    fontSizeLegend: state.config.likert.fontSizeLegend,
    labelMaxLines: state.config.likert.labelMaxLines,
    chartWidth: state.config.sharedChart.chartWidth,
    marginTop: state.config.sharedChart.marginTop,
    marginBottom: state.config.sharedChart.marginBottom,
    marginLeft: state.config.sharedChart.marginLeft,
    marginRight: state.config.sharedChart.marginRight,
    backgroundColor: state.config.sharedChart.canvasBackground,
    transparentBackground: state.config.sharedChart.canvasTransparent,
    showGrid: state.config.sharedChart.showGrid,
    gridDashed: state.config.sharedChart.gridDashed,
    gridVertical: state.config.sharedChart.gridVertical,
    gridHorizontal: state.config.sharedChart.gridHorizontal,
    showGridBorder: state.config.sharedChart.showGridBorder,
    gridColor: state.config.sharedChart.gridColor,
    gridWidth: state.config.sharedChart.lineWidth,
    axisColor: state.config.sharedChart.axisColor,
    axisWidth: state.config.sharedChart.axisWidth,
    showAxisLabels: state.config.sharedChart.showAxisLabels,
    neutralIndex: state.config.likertChartType.diverging.neutralIndex,
    centerLineColor: state.config.likertChartType.diverging.centerLineColor,
    centerLineWidth: state.config.likertChartType.diverging.centerLineWidth,
    barHeight: state.config.likertChartType.stacked.barHeight,
    barSpacing: state.config.likertChartType.stacked.barSpacing,
    showBarBorders: state.config.likertChartType.stacked.showBarBorders,
    barBorderColor: state.config.likertChartType.stacked.barBorderColor,
    barBorderWidth: state.config.likertChartType.stacked.barBorderWidth
  });
}

function bindLikertActions() {
  const showLegend = document.getElementById('likert-show-legend') as HTMLInputElement | null;
  const showValues = document.getElementById('likert-show-values') as HTMLInputElement | null;
  const decimals = document.getElementById('likert-decimals') as HTMLInputElement | null;
  const sharedPalette = document.getElementById('shared-palette') as HTMLSelectElement | null;
  const scalePreset = document.getElementById('likert-scale-preset') as HTMLSelectElement | null;
  const scalePoints = document.getElementById('likert-scale-points') as HTMLInputElement | null;
  const scaleStart = document.getElementById('likert-scale-start') as HTMLInputElement | null;
  const scaleLabels = document.getElementById('likert-scale-labels') as HTMLTextAreaElement | null;
  const analysisMode = document.getElementById('likert-analysis-mode') as HTMLSelectElement | null;
  const chartType = document.getElementById('likert-chart-type') as HTMLSelectElement | null;
  const comparisonPre = document.getElementById('likert-comparison-pre') as HTMLSelectElement | null;
  const comparisonPost = document.getElementById('likert-comparison-post') as HTMLSelectElement | null;
  const neutralIndex = document.getElementById('likert-neutral-index') as HTMLInputElement | null;
  const valueMode = document.getElementById('likert-value-mode') as HTMLSelectElement | null;
  const itemOrder = document.getElementById('likert-item-order') as HTMLSelectElement | null;
  const selectedItems = document.getElementById('likert-selected-items') as HTMLSelectElement | null;
  const chartTitle = document.getElementById('shared-chart-title') as HTMLInputElement | null;
  const showTitle = document.getElementById('shared-show-title') as HTMLInputElement | null;
  const watermark = document.getElementById('likert-watermark') as HTMLInputElement | null;
  const fontTitle = document.getElementById('likert-font-title') as HTMLInputElement | null;
  const fontValues = document.getElementById('likert-font-values') as HTMLInputElement | null;
  const exportFormat = document.getElementById('likert-export-format') as HTMLSelectElement | null;
  const exportScale = document.getElementById('likert-export-scale') as HTMLSelectElement | null;
  const selectAllItemsBtn = document.getElementById('likert-select-all-items') as HTMLButtonElement | null;
  const deselectAllItemsBtn = document.getElementById('likert-deselect-all-items') as HTMLButtonElement | null;
  const gridDashed = document.getElementById('likert-grid-dashed') as HTMLInputElement | null;
  const gridVertical = document.getElementById('likert-grid-vertical') as HTMLInputElement | null;
  const gridHorizontal = document.getElementById('likert-grid-horizontal') as HTMLInputElement | null;
  const showGridBorder = document.getElementById('likert-show-grid-border') as HTMLInputElement | null;
  const legendPosition = document.getElementById('likert-legend-position') as HTMLSelectElement | null;
  const showLegendStyle = document.getElementById('likert-show-legend-style') as HTMLInputElement | null;
  const bgColor = document.getElementById('likert-bg-color') as HTMLInputElement | null;
  const transparentBg = document.getElementById('likert-transparent-bg') as HTMLInputElement | null;
  const gridColor = document.getElementById('likert-grid-color') as HTMLInputElement | null;
  const axisColor = document.getElementById('likert-axis-color') as HTMLInputElement | null;
  const centerLineColor = document.getElementById('likert-center-line-color') as HTMLInputElement | null;
  const fontFamily = document.getElementById('likert-font-family') as HTMLSelectElement | null;
  const fontLabels = document.getElementById('likert-font-labels') as HTMLInputElement | null;
  const fontLegend = document.getElementById('likert-font-legend') as HTMLInputElement | null;
  const labelMaxLines = document.getElementById('likert-label-max-lines') as HTMLInputElement | null;
  const barHeight = document.getElementById('likert-bar-height') as HTMLInputElement | null;
  const barSpacing = document.getElementById('likert-bar-spacing') as HTMLInputElement | null;
  const showBarBorders = document.getElementById('likert-show-bar-borders') as HTMLInputElement | null;
  const barBorderWidth = document.getElementById('likert-bar-border-width') as HTMLInputElement | null;
  const barBorderColor = document.getElementById('likert-bar-border-color') as HTMLInputElement | null;
  const showGrid = document.getElementById('likert-show-grid') as HTMLInputElement | null;
  const gridWidth = document.getElementById('likert-grid-width') as HTMLInputElement | null;
  const showAxisLabels = document.getElementById('likert-show-axis-labels') as HTMLInputElement | null;
  const axisWidth = document.getElementById('likert-axis-width') as HTMLInputElement | null;
  const centerLineWidth = document.getElementById('likert-center-line-width') as HTMLInputElement | null;
  const marginTop = document.getElementById('likert-margin-top') as HTMLInputElement | null;
  const marginBottom = document.getElementById('likert-margin-bottom') as HTMLInputElement | null;
  const marginLeft = document.getElementById('likert-margin-left') as HTMLInputElement | null;
  const marginRight = document.getElementById('likert-margin-right') as HTMLInputElement | null;
  const chartWidth = document.getElementById('likert-chart-width') as HTMLInputElement | null;

  const likertStyleTabs = document.querySelectorAll<HTMLButtonElement>('[data-likert-layout-tab]');
  likertStyleTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.likertLayoutTab;
      if (!target) return;
      if (
        target === 'layout-colors'
        || target === 'layout-typography'
        || target === 'layout-bars'
        || target === 'layout-legend'
        || target === 'layout-axes-grid'
        || target === 'layout-canvas'
      ) {
        store.setLikertStyleTab(target);
      }
    });
  });

  showLegend?.addEventListener('change', () => {
    store.updateConfigSection('likert', { showLegend: showLegend.checked });
  });

  showValues?.addEventListener('change', () => {
    store.updateConfigSection('likert', { showValues: showValues.checked });
  });

  decimals?.addEventListener('change', () => {
    const value = Number(decimals.value);
    if (!Number.isFinite(value)) return;
    const bounded = Math.max(0, Math.min(3, value));
    store.updateConfigSection('likert', { decimalPlaces: bounded });
  });

  scalePreset?.addEventListener('change', () => {
    if (scalePreset.value === 'custom') {
      store.updateConfigSection('likert', { scalePresetId: 'custom' });
      return;
    }
    const preset = getLikertPreset(scalePreset.value);
    if (!preset) return;
    store.updateConfigSection('likert', {
      scalePresetId: preset.id,
      scalePoints: preset.points,
      scaleStart: preset.start,
      scaleLabels: preset.labels[store.getState().language],
      selectedItems: []
    });
    store.updateConfigSection('likertChartType', {
      diverging: {
        ...store.getState().config.likertChartType.diverging,
        neutralIndex: Math.ceil(preset.points / 2)
      }
    });
  });

  scalePoints?.addEventListener('change', () => {
    const value = Number(scalePoints.value);
    if (!Number.isFinite(value)) return;
    const bounded = Math.max(2, Math.min(10, Math.round(value)));
    const labels = Array.from({ length: bounded }, (_, index) => String(store.getState().config.likert.scaleStart + index));
    store.updateConfigSection('likert', { scalePresetId: 'custom', scalePoints: bounded, scaleLabels: labels });
  });

  scaleStart?.addEventListener('change', () => {
    const value = Number(scaleStart.value);
    if (!Number.isFinite(value)) return;
    const bounded = Math.max(0, Math.min(10, Math.round(value)));
    const labels = Array.from({ length: store.getState().config.likert.scalePoints }, (_, index) => String(bounded + index));
    store.updateConfigSection('likert', { scalePresetId: 'custom', scaleStart: bounded, scaleLabels: labels });
  });

  scaleLabels?.addEventListener('change', () => {
    const labels = scaleLabels.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!labels.length) return;
    store.updateConfigSection('likert', {
      scalePresetId: 'custom',
      scaleLabels: labels,
      scalePoints: labels.length
    });
  });

  analysisMode?.addEventListener('change', () => {
    const value = analysisMode.value;
    if (value === 'standard' || value === 'comparison') {
      store.updateConfigSection('likert', { analysisMode: value, selectedItems: [] });
    }
  });

  chartType?.addEventListener('change', () => {
    const value = chartType.value;
    if (value === 'stacked' || value === 'diverging' || value === 'split' || value === 'distribution') {
      store.updateConfigSection('likert', { chartType: value });
    }
  });

  neutralIndex?.addEventListener('change', () => {
    const value = Number(neutralIndex.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('likertChartType', {
      diverging: {
        ...store.getState().config.likertChartType.diverging,
        neutralIndex: Math.max(1, Math.min(store.getState().config.likert.scalePoints, Math.round(value)))
      }
    });
  });

  comparisonPre?.addEventListener('change', () => {
    store.updateConfigSection('likert', { comparisonPreDatasetId: comparisonPre.value || null, selectedItems: [] });
  });

  comparisonPost?.addEventListener('change', () => {
    store.updateConfigSection('likert', { comparisonPostDatasetId: comparisonPost.value || null, selectedItems: [] });
  });

  valueMode?.addEventListener('change', () => {
    if (valueMode.value === 'percentage' || valueMode.value === 'count') {
      store.updateConfigSection('likert', { valueMode: valueMode.value });
    }
  });

  itemOrder?.addEventListener('change', () => {
    if (['original', 'mean_desc', 'mean_asc', 'label_asc'].includes(itemOrder.value)) {
      store.updateConfigSection('likert', { itemOrder: itemOrder.value as 'original' | 'mean_desc' | 'mean_asc' | 'label_asc' });
    }
  });

  sharedPalette?.addEventListener('change', () => {
    const value = sharedPalette.value;
    if (isPaletteId(value)) {
      store.updateConfigSection('sharedChart', { paletteId: value });
    }
  });

  selectedItems?.addEventListener('change', () => {
    const selected = Array.from(selectedItems.selectedOptions).map((o) => o.value);
    store.updateConfigSection('likert', { selectedItems: selected });
  });

  selectAllItemsBtn?.addEventListener('click', () => {
    if (!selectedItems) return;
    Array.from(selectedItems.options).forEach((opt) => { opt.selected = true; });
    const selected = Array.from(selectedItems.selectedOptions).map((o) => o.value);
    store.updateConfigSection('likert', { selectedItems: selected });
  });

  deselectAllItemsBtn?.addEventListener('click', () => {
    if (!selectedItems) return;
    Array.from(selectedItems.options).forEach((opt) => { opt.selected = false; });
    store.updateConfigSection('likert', { selectedItems: [] });
  });

  chartTitle?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { chartTitle: chartTitle.value.trim() });
  });

  showTitle?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { showTitle: showTitle.checked });
  });

  watermark?.addEventListener('change', () => {
    store.updateConfigSection('likert', { watermark: watermark.value.trim() });
  });

  fontTitle?.addEventListener('change', () => {
    const value = Number(fontTitle.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('likert', { fontSizeTitle: Math.max(10, Math.min(42, Math.round(value))) });
  });

  fontValues?.addEventListener('change', () => {
    const value = Number(fontValues.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('likert', { fontSizeValues: Math.max(8, Math.min(24, Math.round(value))) });
  });

  fontFamily?.addEventListener('change', () => {
    const value = fontFamily.value;
    if (value === 'Segoe UI, sans-serif' || value === 'Arial, sans-serif' || value === 'Verdana, sans-serif' || value === 'Georgia, serif') {
      store.updateConfigSection('sharedChart', { fontFamily: value });
    }
  });

  fontLabels?.addEventListener('change', () => {
    const value = Number(fontLabels.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { labelFontSize: Math.max(8, Math.min(32, Math.round(value))) });
  });

  fontLegend?.addEventListener('change', () => {
    const value = Number(fontLegend.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('likert', { fontSizeLegend: Math.max(8, Math.min(32, Math.round(value))) });
  });

  labelMaxLines?.addEventListener('change', () => {
    const value = Number(labelMaxLines.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('likert', { labelMaxLines: Math.max(1, Math.min(3, Math.round(value))) });
  });

  legendPosition?.addEventListener('change', () => {
    if (legendPosition.value === 'right' || legendPosition.value === 'bottom' || legendPosition.value === 'top' || legendPosition.value === 'left') {
      store.updateConfigSection('likert', { legendPosition: legendPosition.value });
    }
  });

  showLegendStyle?.addEventListener('change', () => {
    store.updateConfigSection('likert', { showLegend: showLegendStyle.checked });
  });

  bgColor?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { canvasBackground: bgColor.value });
  });

  transparentBg?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { canvasTransparent: transparentBg.checked });
  });

  gridColor?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { gridColor: gridColor.value });
  });

  axisColor?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { axisColor: axisColor.value });
  });

  centerLineColor?.addEventListener('change', () => {
    store.updateConfigSection('likertChartType', {
      diverging: {
        ...store.getState().config.likertChartType.diverging,
        centerLineColor: centerLineColor.value
      }
    });
  });

  gridDashed?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { gridDashed: gridDashed.checked });
  });

  gridVertical?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', {
      gridVertical: gridVertical.checked,
      showGrid: gridVertical.checked || store.getState().config.sharedChart.showGrid
    });
  });

  gridHorizontal?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', {
      gridHorizontal: gridHorizontal.checked,
      showGrid: gridHorizontal.checked || store.getState().config.sharedChart.showGrid
    });
  });

  showGridBorder?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { showGridBorder: showGridBorder.checked });
  });

  barHeight?.addEventListener('change', () => {
    const value = Number(barHeight.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('likertChartType', {
      stacked: {
        ...store.getState().config.likertChartType.stacked,
        barHeight: Math.max(20, Math.min(100, Math.round(value)))
      }
    });
  });

  barSpacing?.addEventListener('change', () => {
    const value = Number(barSpacing.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('likertChartType', {
      stacked: {
        ...store.getState().config.likertChartType.stacked,
        barSpacing: Math.max(0, Math.min(50, Math.round(value)))
      }
    });
  });

  showBarBorders?.addEventListener('change', () => {
    store.updateConfigSection('likertChartType', {
      stacked: {
        ...store.getState().config.likertChartType.stacked,
        showBarBorders: showBarBorders.checked
      }
    });
  });

  barBorderWidth?.addEventListener('change', () => {
    const value = Number(barBorderWidth.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('likertChartType', {
      stacked: {
        ...store.getState().config.likertChartType.stacked,
        barBorderWidth: Math.max(1, Math.min(5, Math.round(value)))
      }
    });
  });

  barBorderColor?.addEventListener('change', () => {
    store.updateConfigSection('likertChartType', {
      stacked: {
        ...store.getState().config.likertChartType.stacked,
        barBorderColor: barBorderColor.value
      }
    });
  });

  showGrid?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { showGrid: showGrid.checked });
  });

  gridWidth?.addEventListener('change', () => {
    const value = Number(gridWidth.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { lineWidth: Math.max(1, Math.min(5, Math.round(value))) });
  });

  showAxisLabels?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { showAxisLabels: showAxisLabels.checked });
  });

  axisWidth?.addEventListener('change', () => {
    const value = Number(axisWidth.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { axisWidth: Math.max(1, Math.min(5, Math.round(value))) });
  });

  centerLineWidth?.addEventListener('change', () => {
    const value = Number(centerLineWidth.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('likertChartType', {
      diverging: {
        ...store.getState().config.likertChartType.diverging,
        centerLineWidth: Math.max(1, Math.min(6, Math.round(value)))
      }
    });
  });

  marginTop?.addEventListener('change', () => {
    const value = Number(marginTop.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { marginTop: Math.max(20, Math.min(240, Math.round(value))) });
  });

  marginBottom?.addEventListener('change', () => {
    const value = Number(marginBottom.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { marginBottom: Math.max(20, Math.min(260, Math.round(value))) });
  });

  marginLeft?.addEventListener('change', () => {
    const value = Number(marginLeft.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { marginLeft: Math.max(80, Math.min(480, Math.round(value))) });
  });

  marginRight?.addEventListener('change', () => {
    const value = Number(marginRight.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { marginRight: Math.max(20, Math.min(320, Math.round(value))) });
  });

  chartWidth?.addEventListener('change', () => {
    const value = Number(chartWidth.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { chartWidth: Math.max(700, Math.min(2200, Math.round(value))) });
  });

  bindChartStageControls({
    stageId: 'likert-stage',
    zoomInButtonId: 'likert-zoom-in',
    zoomOutButtonId: 'likert-zoom-out',
    zoomResetButtonId: 'likert-zoom-reset',
    fullscreenButtonId: 'likert-fullscreen',
    getZoom: () => store.getState().config.likert.zoomLevel,
    setZoom: (zoom) => store.updateConfigSection('likert', { zoomLevel: zoom })
  });

  bindChartExportControls({
    canvasId: 'likert-canvas',
    triggerButtonId: 'likert-export-png-btn',
    filenamePrefix: 'likert',
    formatSelectId: 'likert-export-format',
    scaleSelectId: 'likert-export-scale',
    getFallbackFormat: () => store.getState().config.sharedExport.format,
    getFallbackScale: () => store.getState().config.sharedExport.scale,
    setFormat: (format) => store.updateConfigSection('sharedExport', { format }),
    setScale: (scale) => store.updateConfigSection('sharedExport', { scale })
  });

  drawLikertIfNeeded();
}

function getFirstNumericColumnName(dataset: ReturnType<typeof getActiveDataset>): string {
  if (!dataset?.records?.length) return '';
  const cols = Object.keys(dataset.records[0]);
  for (const col of cols) {
    for (const row of dataset.records) {
      const raw = row[col];
      const n = typeof raw === 'string' ? Number(raw.trim()) : Number(raw);
      if (Number.isFinite(n)) {
        return col;
      }
    }
  }
  return '';
}

function drawDistributionIfNeeded() {
  const state = store.getState();
  if (state.activeModule !== 'distribution') return;
  const canvas = document.getElementById('distribution-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const dataset = getActiveDataset();
  const fallbackNumeric = getFirstNumericColumnName(dataset);
  const activeChartType = state.config.distribution.chartType;
  const violinCfg = activeChartType === 'boxviolin'
    ? state.config.distributionChartType.boxviolin
    : state.config.distributionChartType.violin;
  const numericColumn = state.config.distribution.numericColumns[0] || fallbackNumeric;
  const groups = groupDistributionData(
    dataset,
    numericColumn,
    state.config.distribution.categoryColumn || '',
    state.config.distribution.groupOrder,
    state.config.distribution.topNGroups,
    state.config.distributionChartType.boxplot.whiskerMultiplier
  );
  const overallStats = summarizeOverall(groups);
  const hypothesisResult = state.config.distribution.showHypothesisPanel
    ? compareDistributionGroups(groups, state.config.distribution.hypothesisMode)
    : null;

  renderDistributionCanvas(canvas, dataset, {
    chartType: state.config.distribution.chartType,
    paletteId: state.config.sharedChart.paletteId,
    numericColumn,
    categoryColumn: state.config.distribution.categoryColumn || '',
    chartWidth: state.config.sharedChart.chartWidth,
    chartMinHeight: state.config.sharedChart.chartMinHeight,
    marginTop: state.config.sharedChart.marginTop,
    marginRight: state.config.sharedChart.marginRight,
    marginLeft: state.config.sharedChart.marginLeft,
    marginBottom: state.config.sharedChart.marginBottom,
    fontFamily: state.config.sharedChart.fontFamily,
    fontSizeLabels: state.config.sharedChart.labelFontSize,
    backgroundColor: state.config.sharedChart.canvasBackground,
    transparentBackground: state.config.sharedChart.canvasTransparent,
    showGrid: state.config.sharedChart.showGrid,
    gridDashed: state.config.sharedChart.gridDashed,
    gridVertical: state.config.sharedChart.gridVertical,
    gridHorizontal: state.config.sharedChart.gridHorizontal,
    showGridBorder: state.config.sharedChart.showGridBorder,
    gridColor: state.config.sharedChart.gridColor,
    gridWidth: state.config.sharedChart.lineWidth,
    axisColor: state.config.sharedChart.axisColor,
    axisWidth: state.config.sharedChart.axisWidth,
    showAxisLabels: state.config.sharedChart.showAxisLabels,
    labelMaxLines: state.config.distribution.labelMaxLines,
    showOutliers: state.config.distribution.showOutliers,
    topNGroups: state.config.distribution.topNGroups,
    groupOrder: state.config.distribution.groupOrder,
    orientation: state.config.distribution.orientation,
    groupThickness: state.config.distribution.groupThickness,
    groupGap: state.config.distribution.groupGap,
    whiskerMultiplier: state.config.distributionChartType.boxplot.whiskerMultiplier,
    showSampleSizeLabel: state.config.distribution.showSampleSizeLabel,
    showJitter: state.config.distribution.showJitter,
    jitterSize: state.config.distribution.jitterSize,
    jitterAlpha: state.config.distribution.jitterAlpha,
    outlierSize: state.config.distribution.outlierSize,
    outlierColor: state.config.distribution.outlierColor,
    showGroupMarker: state.config.distribution.showGroupMarker,
    groupMetric: state.config.distribution.groupMetric,
    groupMarkerStyle: state.config.distribution.groupMarkerStyle,
    groupMarkerColor: state.config.distribution.groupMarkerColor,
    groupMarkerSize: state.config.distribution.groupMarkerSize,
    violinBandwidthFactor: violinCfg.kdeBandwidthFactor,
    violinSteps: violinCfg.kdeSteps,
    violinOpacity: violinCfg.violinOpacity,
    raincloudOffset: state.config.distributionChartType.raincloud.cloudOffset,
    raincloudBoxHeightRatio: state.config.distributionChartType.raincloud.boxHeightRatio,
    errorMetric: state.config.distributionChartType.errorbar.errorMetric,
    errorCiLevel: state.config.distributionChartType.errorbar.errorCiLevel,
    showMeanLine: state.config.sharedAnnotations.showMeanLine,
    meanLineColor: state.config.sharedAnnotations.meanLineColor,
    meanLineWidth: state.config.sharedAnnotations.meanLineWidth,
    meanLineDash: state.config.sharedAnnotations.meanLineDash,
    meanLineGap: state.config.sharedAnnotations.meanLineGap,
    showMeanLabel: state.config.sharedAnnotations.showMeanLabel,
    showStatsPanel: state.config.sharedAnnotations.showStatsPanel,
    statsFields: state.config.sharedAnnotations.statsFields,
    statsPosition: state.config.sharedAnnotations.statsPosition,
    annotationText: state.config.sharedAnnotations.annotationText,
    annotationX: state.config.sharedAnnotations.annotationX,
    annotationY: state.config.sharedAnnotations.annotationY,
    annotationColor: state.config.sharedAnnotations.annotationColor,
    annotationSize: state.config.sharedAnnotations.annotationSize,
    showHypothesisPanel: state.config.distribution.showHypothesisPanel,
    hypothesisResult,
    overallStats
  });
}

function bindDistributionActions() {
  const chartType = document.getElementById('dist-chart-type') as HTMLSelectElement | null;
  const showOutliers = document.getElementById('dist-show-outliers') as HTMLInputElement | null;
  const showJitter = document.getElementById('dist-show-jitter') as HTMLInputElement | null;
  const showSampleSize = document.getElementById('dist-show-sample-size') as HTMLInputElement | null;
  const topN = document.getElementById('dist-top-n') as HTMLInputElement | null;
  const groupOrder = document.getElementById('dist-group-order') as HTMLSelectElement | null;
  const orientation = document.getElementById('dist-orientation') as HTMLSelectElement | null;
  const hypothesisMode = document.getElementById('dist-hypothesis-mode') as HTMLSelectElement | null;
  const numericColumn = document.getElementById('dist-numeric-column') as HTMLSelectElement | null;
  const categoryColumn = document.getElementById('dist-category-column') as HTMLSelectElement | null;
  const sharedPalette = document.getElementById('dist-shared-palette') as HTMLSelectElement | null;
  const bgColor = document.getElementById('dist-bg-color') as HTMLInputElement | null;
  const transparentBg = document.getElementById('dist-transparent-bg') as HTMLInputElement | null;
  const gridColor = document.getElementById('dist-grid-color') as HTMLInputElement | null;
  const axisColor = document.getElementById('dist-axis-color') as HTMLInputElement | null;
  const showGrid = document.getElementById('dist-show-grid') as HTMLInputElement | null;
  const gridDashed = document.getElementById('dist-grid-dashed') as HTMLInputElement | null;
  const gridVertical = document.getElementById('dist-grid-vertical') as HTMLInputElement | null;
  const gridHorizontal = document.getElementById('dist-grid-horizontal') as HTMLInputElement | null;
  const showGridBorder = document.getElementById('dist-show-grid-border') as HTMLInputElement | null;
  const gridWidth = document.getElementById('dist-grid-width') as HTMLInputElement | null;
  const showAxisLabels = document.getElementById('dist-show-axis-labels') as HTMLInputElement | null;
  const axisWidth = document.getElementById('dist-axis-width') as HTMLInputElement | null;
  const fontFamily = document.getElementById('dist-font-family') as HTMLSelectElement | null;
  const fontLabels = document.getElementById('dist-font-labels') as HTMLInputElement | null;
  const labelMaxLines = document.getElementById('dist-label-max-lines') as HTMLInputElement | null;
  const chartWidth = document.getElementById('dist-chart-width') as HTMLInputElement | null;
  const chartMinHeight = document.getElementById('dist-chart-min-height') as HTMLInputElement | null;
  const marginTop = document.getElementById('dist-margin-top') as HTMLInputElement | null;
  const marginRight = document.getElementById('dist-margin-right') as HTMLInputElement | null;
  const marginBottom = document.getElementById('dist-margin-bottom') as HTMLInputElement | null;
  const marginLeft = document.getElementById('dist-margin-left') as HTMLInputElement | null;
  const groupThickness = document.getElementById('dist-group-thickness') as HTMLInputElement | null;
  const groupGap = document.getElementById('dist-group-gap') as HTMLInputElement | null;
  const whiskerMult = document.getElementById('dist-whisker-mult') as HTMLInputElement | null;
  const kdeBandwidth = document.getElementById('dist-kde-bandwidth') as HTMLInputElement | null;
  const kdeSteps = document.getElementById('dist-kde-steps') as HTMLInputElement | null;
  const violinOpacity = document.getElementById('dist-violin-opacity') as HTMLInputElement | null;
  const raincloudOffset = document.getElementById('dist-raincloud-offset') as HTMLInputElement | null;
  const raincloudBoxRatio = document.getElementById('dist-raincloud-box-ratio') as HTMLInputElement | null;
  const distributionStyleTabs = document.querySelectorAll<HTMLButtonElement>('[data-distribution-layout-tab]');
  const errorMetric = document.getElementById('dist-error-metric') as HTMLSelectElement | null;
  const errorCiLevel = document.getElementById('dist-error-ci-level') as HTMLInputElement | null;
  const outlierColor = document.getElementById('dist-outlier-color') as HTMLInputElement | null;
  const outlierSize = document.getElementById('dist-outlier-size') as HTMLInputElement | null;
  const jitterSize = document.getElementById('dist-jitter-size') as HTMLInputElement | null;
  const jitterAlpha = document.getElementById('dist-jitter-alpha') as HTMLInputElement | null;
  const showMarker = document.getElementById('dist-show-marker') as HTMLInputElement | null;
  const groupMetric = document.getElementById('dist-group-metric') as HTMLSelectElement | null;
  const markerStyle = document.getElementById('dist-marker-style') as HTMLSelectElement | null;
  const markerColor = document.getElementById('dist-marker-color') as HTMLInputElement | null;
  const markerSize = document.getElementById('dist-marker-size') as HTMLInputElement | null;
  const showHypothesisPanel = document.getElementById('dist-show-hypothesis-panel') as HTMLInputElement | null;
  const showMeanLine = document.getElementById('dist-show-mean-line') as HTMLInputElement | null;
  const meanLineColor = document.getElementById('dist-mean-line-color') as HTMLInputElement | null;
  const meanLineWidth = document.getElementById('dist-mean-line-width') as HTMLInputElement | null;
  const meanLineDash = document.getElementById('dist-mean-line-dash') as HTMLInputElement | null;
  const meanLineGap = document.getElementById('dist-mean-line-gap') as HTMLInputElement | null;
  const showMeanLabel = document.getElementById('dist-show-mean-label') as HTMLInputElement | null;
  const showStatsPanel = document.getElementById('dist-show-stats-panel') as HTMLInputElement | null;
  const statsPosition = document.getElementById('dist-stats-position') as HTMLSelectElement | null;
  const statsShowN = document.getElementById('dist-stats-show-n') as HTMLInputElement | null;
  const statsShowMean = document.getElementById('dist-stats-show-mean') as HTMLInputElement | null;
  const statsShowMedian = document.getElementById('dist-stats-show-median') as HTMLInputElement | null;
  const statsShowSd = document.getElementById('dist-stats-show-sd') as HTMLInputElement | null;
  const statsShowIqr = document.getElementById('dist-stats-show-iqr') as HTMLInputElement | null;
  const annotationText = document.getElementById('dist-annotation-text') as HTMLInputElement | null;
  const annotationX = document.getElementById('dist-annotation-x') as HTMLInputElement | null;
  const annotationY = document.getElementById('dist-annotation-y') as HTMLInputElement | null;
  const annotationColor = document.getElementById('dist-annotation-color') as HTMLInputElement | null;
  const annotationSize = document.getElementById('dist-annotation-size') as HTMLInputElement | null;
  const exportFormat = document.getElementById('dist-export-format') as HTMLSelectElement | null;
  const exportScale = document.getElementById('dist-export-scale') as HTMLSelectElement | null;

  distributionStyleTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.distributionLayoutTab;
      if (!target) return;
      if (
        target === 'layout-colors'
        || target === 'layout-typography'
        || target === 'layout-marks'
        || target === 'layout-annotations'
        || target === 'layout-axes-grid'
        || target === 'layout-canvas'
      ) {
        store.setDistributionStyleTab(target);
      }
    });
  });

  if (numericColumn && numericColumn.value && store.getState().config.distribution.numericColumns.length === 0) {
    store.updateConfigSection('distribution', { numericColumns: [numericColumn.value] });
  }

  chartType?.addEventListener('change', () => {
    const value = chartType.value;
    if (value === 'boxplot' || value === 'violin' || value === 'boxviolin' || value === 'raincloud' || value === 'errorbar') {
      store.updateConfigSection('distribution', { chartType: value });
    }
  });

  showOutliers?.addEventListener('change', () => {
    store.updateConfigSection('distribution', { showOutliers: showOutliers.checked });
  });

  showJitter?.addEventListener('change', () => {
    store.updateConfigSection('distribution', { showJitter: showJitter.checked });
  });

  showSampleSize?.addEventListener('change', () => {
    store.updateConfigSection('distribution', { showSampleSizeLabel: showSampleSize.checked });
  });

  topN?.addEventListener('change', () => {
    const value = Number(topN.value);
    if (!Number.isFinite(value)) return;
    const bounded = Math.max(1, Math.min(100, Math.round(value)));
    store.updateConfigSection('distribution', { topNGroups: bounded });
  });

  groupOrder?.addEventListener('change', () => {
    const value = groupOrder.value;
    if (value === 'original' || value === 'alphabetical' || value === 'median_desc' || value === 'median_asc') {
      store.updateConfigSection('distribution', { groupOrder: value });
    }
  });

  orientation?.addEventListener('change', () => {
    if (orientation.value === 'horizontal' || orientation.value === 'vertical') {
      store.updateConfigSection('distribution', { orientation: orientation.value });
    }
  });

  hypothesisMode?.addEventListener('change', () => {
    const value = hypothesisMode.value;
    if (value === 'auto' || value === 'parametric' || value === 'nonparametric') {
      store.updateConfigSection('distribution', { hypothesisMode: value });
    }
  });

  showHypothesisPanel?.addEventListener('change', () => {
    store.updateConfigSection('distribution', { showHypothesisPanel: showHypothesisPanel.checked });
  });

  numericColumn?.addEventListener('change', () => {
    store.updateConfigSection('distribution', { numericColumns: numericColumn.value ? [numericColumn.value] : [] });
  });

  categoryColumn?.addEventListener('change', () => {
    store.updateConfigSection('distribution', { categoryColumn: categoryColumn.value || null });
  });

  sharedPalette?.addEventListener('change', () => {
    const value = sharedPalette.value;
    if (isPaletteId(value)) {
      store.updateConfigSection('sharedChart', { paletteId: value });
    }
  });

  bgColor?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { canvasBackground: bgColor.value });
  });

  transparentBg?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { canvasTransparent: transparentBg.checked });
  });

  gridColor?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { gridColor: gridColor.value });
  });

  axisColor?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { axisColor: axisColor.value });
  });

  showGrid?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { showGrid: showGrid.checked });
  });

  gridDashed?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { gridDashed: gridDashed.checked });
  });

  gridVertical?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', {
      gridVertical: gridVertical.checked,
      showGrid: gridVertical.checked || store.getState().config.sharedChart.showGrid
    });
  });

  gridHorizontal?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', {
      gridHorizontal: gridHorizontal.checked,
      showGrid: gridHorizontal.checked || store.getState().config.sharedChart.showGrid
    });
  });

  showGridBorder?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { showGridBorder: showGridBorder.checked });
  });

  gridWidth?.addEventListener('change', () => {
    const value = Number(gridWidth.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { lineWidth: Math.max(1, Math.min(5, Math.round(value))) });
  });

  showAxisLabels?.addEventListener('change', () => {
    store.updateConfigSection('sharedChart', { showAxisLabels: showAxisLabels.checked });
  });

  axisWidth?.addEventListener('change', () => {
    const value = Number(axisWidth.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { axisWidth: Math.max(1, Math.min(5, Math.round(value))) });
  });

  fontFamily?.addEventListener('change', () => {
    const value = fontFamily.value;
    if (value === 'Segoe UI, sans-serif' || value === 'Arial, sans-serif' || value === 'Verdana, sans-serif' || value === 'Georgia, serif') {
      store.updateConfigSection('sharedChart', { fontFamily: value });
    }
  });

  fontLabels?.addEventListener('change', () => {
    const value = Number(fontLabels.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { labelFontSize: Math.max(8, Math.min(28, Math.round(value))) });
  });

  labelMaxLines?.addEventListener('change', () => {
    const value = Number(labelMaxLines.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('distribution', { labelMaxLines: Math.max(1, Math.min(4, Math.round(value))) });
  });

  chartWidth?.addEventListener('change', () => {
    const value = Number(chartWidth.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { chartWidth: Math.max(700, Math.min(2200, Math.round(value))) });
  });

  chartMinHeight?.addEventListener('change', () => {
    const value = Number(chartMinHeight.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { chartMinHeight: Math.max(320, Math.min(2400, Math.round(value))) });
  });

  marginTop?.addEventListener('change', () => {
    const value = Number(marginTop.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { marginTop: Math.max(20, Math.min(240, Math.round(value))) });
  });

  marginRight?.addEventListener('change', () => {
    const value = Number(marginRight.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { marginRight: Math.max(20, Math.min(260, Math.round(value))) });
  });

  marginBottom?.addEventListener('change', () => {
    const value = Number(marginBottom.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { marginBottom: Math.max(20, Math.min(260, Math.round(value))) });
  });

  marginLeft?.addEventListener('change', () => {
    const value = Number(marginLeft.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedChart', { marginLeft: Math.max(120, Math.min(480, Math.round(value))) });
  });

  groupThickness?.addEventListener('change', () => {
    const value = Number(groupThickness.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('distribution', { groupThickness: Math.max(16, Math.min(80, Math.round(value))) });
  });

  groupGap?.addEventListener('change', () => {
    const value = Number(groupGap.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('distribution', { groupGap: Math.max(4, Math.min(80, Math.round(value))) });
  });

  whiskerMult?.addEventListener('change', () => {
    const value = Number(whiskerMult.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('distributionChartType', {
      boxplot: {
        ...store.getState().config.distributionChartType.boxplot,
        whiskerMultiplier: Math.max(0.5, Math.min(5, Number(value.toFixed(1))))
      }
    });
  });

  kdeBandwidth?.addEventListener('change', () => {
    const value = Number(kdeBandwidth.value);
    if (!Number.isFinite(value)) return;
    const chartTypeKey = store.getState().config.distribution.chartType === 'boxviolin' ? 'boxviolin' : 'violin';
    const current = store.getState().config.distributionChartType[chartTypeKey];
    store.updateConfigSection('distributionChartType', {
      [chartTypeKey]: {
        ...current,
        kdeBandwidthFactor: Math.max(0.2, Math.min(4, Number(value.toFixed(1))))
      }
    });
  });

  kdeSteps?.addEventListener('change', () => {
    const value = Number(kdeSteps.value);
    if (!Number.isFinite(value)) return;
    const chartTypeKey = store.getState().config.distribution.chartType === 'boxviolin' ? 'boxviolin' : 'violin';
    const current = store.getState().config.distributionChartType[chartTypeKey];
    store.updateConfigSection('distributionChartType', {
      [chartTypeKey]: {
        ...current,
        kdeSteps: Math.max(30, Math.min(260, Math.round(value)))
      }
    });
  });

  violinOpacity?.addEventListener('change', () => {
    const value = Number(violinOpacity.value);
    if (!Number.isFinite(value)) return;
    const chartTypeKey = store.getState().config.distribution.chartType === 'boxviolin' ? 'boxviolin' : 'violin';
    const current = store.getState().config.distributionChartType[chartTypeKey];
    store.updateConfigSection('distributionChartType', {
      [chartTypeKey]: {
        ...current,
        violinOpacity: Math.max(0.1, Math.min(1, Number(value.toFixed(2))))
      }
    });
  });

  raincloudOffset?.addEventListener('change', () => {
    const value = Number(raincloudOffset.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('distributionChartType', {
      raincloud: {
        ...store.getState().config.distributionChartType.raincloud,
        cloudOffset: Math.max(2, Math.min(30, Math.round(value)))
      }
    });
  });

  raincloudBoxRatio?.addEventListener('change', () => {
    const value = Number(raincloudBoxRatio.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('distributionChartType', {
      raincloud: {
        ...store.getState().config.distributionChartType.raincloud,
        boxHeightRatio: Math.max(0.2, Math.min(0.8, Number(value.toFixed(2))))
      }
    });
  });

  errorMetric?.addEventListener('change', () => {
    const value = errorMetric.value;
    if (value === 'sd' || value === 'se' || value === 'ci95' || value === 'minmax') {
      store.updateConfigSection('distributionChartType', {
        errorbar: {
          ...store.getState().config.distributionChartType.errorbar,
          errorMetric: value
        }
      });
    }
  });

  errorCiLevel?.addEventListener('change', () => {
    const value = Number(errorCiLevel.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('distributionChartType', {
      errorbar: {
        ...store.getState().config.distributionChartType.errorbar,
        errorCiLevel: Math.max(80, Math.min(99, Math.round(value)))
      }
    });
  });

  outlierColor?.addEventListener('change', () => {
    store.updateConfigSection('distribution', { outlierColor: outlierColor.value });
  });

  outlierSize?.addEventListener('change', () => {
    const value = Number(outlierSize.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('distribution', { outlierSize: Math.max(1, Math.min(12, Number(value.toFixed(1)))) });
  });

  jitterSize?.addEventListener('change', () => {
    const value = Number(jitterSize.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('distribution', { jitterSize: Math.max(0.6, Math.min(10, Number(value.toFixed(1)))) });
  });

  jitterAlpha?.addEventListener('change', () => {
    const value = Number(jitterAlpha.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('distribution', { jitterAlpha: Math.max(0.05, Math.min(1, Number(value.toFixed(2)))) });
  });

  showMarker?.addEventListener('change', () => {
    store.updateConfigSection('distribution', { showGroupMarker: showMarker.checked });
  });

  groupMetric?.addEventListener('change', () => {
    const value = groupMetric.value;
    if (value === 'median' || value === 'mean') {
      store.updateConfigSection('distribution', { groupMetric: value });
    }
  });

  markerStyle?.addEventListener('change', () => {
    const value = markerStyle.value;
    if (value === 'point' || value === 'square' || value === 'line') {
      store.updateConfigSection('distribution', { groupMarkerStyle: value });
    }
  });

  markerColor?.addEventListener('change', () => {
    store.updateConfigSection('distribution', { groupMarkerColor: markerColor.value });
  });

  markerSize?.addEventListener('change', () => {
    const value = Number(markerSize.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('distribution', { groupMarkerSize: Math.max(2, Math.min(18, Number(value.toFixed(1)))) });
  });

  showMeanLine?.addEventListener('change', () => {
    store.updateConfigSection('sharedAnnotations', { showMeanLine: showMeanLine.checked });
  });

  meanLineColor?.addEventListener('change', () => {
    store.updateConfigSection('sharedAnnotations', { meanLineColor: meanLineColor.value });
  });

  meanLineWidth?.addEventListener('change', () => {
    const value = Number(meanLineWidth.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedAnnotations', { meanLineWidth: Math.max(1, Math.min(8, Number(value.toFixed(1)))) });
  });

  meanLineDash?.addEventListener('change', () => {
    const value = Number(meanLineDash.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedAnnotations', { meanLineDash: Math.max(2, Math.min(40, Math.round(value))) });
  });

  meanLineGap?.addEventListener('change', () => {
    const value = Number(meanLineGap.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedAnnotations', { meanLineGap: Math.max(2, Math.min(40, Math.round(value))) });
  });

  showMeanLabel?.addEventListener('change', () => {
    store.updateConfigSection('sharedAnnotations', { showMeanLabel: showMeanLabel.checked });
  });

  showStatsPanel?.addEventListener('change', () => {
    store.updateConfigSection('sharedAnnotations', { showStatsPanel: showStatsPanel.checked });
  });

  statsPosition?.addEventListener('change', () => {
    const value = statsPosition.value;
    if (value === 'top_left' || value === 'top_right' || value === 'bottom_left' || value === 'bottom_right') {
      store.updateConfigSection('sharedAnnotations', { statsPosition: value });
    }
  });

  const updateStatsFields = () => {
    store.updateConfigSection('sharedAnnotations', {
      statsFields: {
        n: statsShowN?.checked !== false,
        mean: statsShowMean?.checked !== false,
        median: statsShowMedian?.checked !== false,
        sd: statsShowSd?.checked !== false,
        iqr: statsShowIqr?.checked !== false
      }
    });
  };

  statsShowN?.addEventListener('change', updateStatsFields);
  statsShowMean?.addEventListener('change', updateStatsFields);
  statsShowMedian?.addEventListener('change', updateStatsFields);
  statsShowSd?.addEventListener('change', updateStatsFields);
  statsShowIqr?.addEventListener('change', updateStatsFields);

  annotationText?.addEventListener('change', () => {
    store.updateConfigSection('sharedAnnotations', { annotationText: annotationText.value.trim() });
  });

  annotationX?.addEventListener('change', () => {
    const value = Number(annotationX.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedAnnotations', { annotationX: Math.max(0, Math.min(100, Math.round(value))) });
  });

  annotationY?.addEventListener('change', () => {
    const value = Number(annotationY.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedAnnotations', { annotationY: Math.max(0, Math.min(100, Math.round(value))) });
  });

  annotationColor?.addEventListener('change', () => {
    store.updateConfigSection('sharedAnnotations', { annotationColor: annotationColor.value });
  });

  annotationSize?.addEventListener('change', () => {
    const value = Number(annotationSize.value);
    if (!Number.isFinite(value)) return;
    store.updateConfigSection('sharedAnnotations', { annotationSize: Math.max(10, Math.min(40, Math.round(value))) });
  });

  bindChartExportControls({
    canvasId: 'distribution-canvas',
    triggerButtonId: 'dist-export-btn',
    toolbarExportButtonId: 'dist-export',
    filenamePrefix: 'distribution',
    formatSelectId: 'dist-export-format',
    scaleSelectId: 'dist-export-scale',
    getFallbackFormat: () => store.getState().config.sharedExport.format,
    getFallbackScale: () => store.getState().config.sharedExport.scale,
    setFormat: (format) => store.updateConfigSection('sharedExport', { format }),
    setScale: (scale) => store.updateConfigSection('sharedExport', { scale })
  });

  bindChartStageControls({
    stageId: 'distribution-stage',
    zoomInButtonId: 'dist-zoom-in',
    zoomOutButtonId: 'dist-zoom-out',
    zoomResetButtonId: 'dist-zoom-reset',
    fullscreenButtonId: 'dist-fullscreen',
    getZoom: () => store.getState().config.distribution.zoomLevel,
    setZoom: (zoom) => store.updateConfigSection('distribution', { zoomLevel: zoom }),
    setFullscreenEnabled: (enabled) => store.updateConfigSection('distribution', { fullscreenEnabled: enabled })
  });

  drawDistributionIfNeeded();
}

function bindModulePanelNavigation() {
  const { activeModule } = store.getState();
  const buttons = document.querySelectorAll<HTMLButtonElement>('.workspace-rail [data-module-panel]');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const panel = button.dataset.modulePanel;
      if (!panel) return;
      store.setModulePanel(activeModule, panel);
    });
  });
}

function bindModuleActions() {
  const { activeModule } = store.getState();
  bindModulePanelNavigation();

  if (activeModule === 'processor') {
    bindProcessorActions();
    return;
  }

  if (activeModule === 'likert') {
    bindLikertActions();
    return;
  }

  if (activeModule === 'distribution') {
    bindDistributionActions();
  }
}

function renderApp() {
  renderShell();
  initRouter();
  bindShellActions();
  renderActiveModule();
  bindModuleActions();
}

store.subscribe(() => {
  renderApp();
});

eventBus.on('app:init', () => {
  renderApp();
});

eventBus.emit('app:init', {});



















