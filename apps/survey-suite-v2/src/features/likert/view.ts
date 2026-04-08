import type { SuiteState } from '../../shared/types/state';
import { LIKERT_PRESETS, getLikertPreset, getLikertPresetLabels } from './presets';
import { renderChartStage } from '../../shared/ui/chartStage';
import { renderExportPanel } from '../../shared/ui/exportPanel';
import {
  renderCommonAxesGridControls,
  renderCommonCanvasControls,
  renderCommonColorControls,
  renderCommonTypographyControls
} from '../../shared/ui/styleControls';

function detectLikertColumns(dataset: SuiteState['datasets'][string] | null): string[] {
  if (!dataset?.records?.length) return [];
  const headers = Object.keys(dataset.records[0]);
  return headers.filter((col) => {
    let valid = 0;
    dataset.records.forEach((row) => {
      const raw = row[col];
      const n = typeof raw === 'string' ? Number(raw.trim()) : Number(raw);
      if (Number.isFinite(n)) valid += 1;
    });
    return valid > 0;
  });
}

function detectComparisonLikertColumns(state: SuiteState): string[] {
  const preId = state.config.likert.comparisonPreDatasetId;
  const postId = state.config.likert.comparisonPostDatasetId;
  if (!preId || !postId) return [];

  const pre = state.datasets[preId];
  const post = state.datasets[postId];
  if (!pre?.records?.length || !post?.records?.length) return [];

  const preHeaders = Object.keys(pre.records[0]);
  const postHeaders = new Set(Object.keys(post.records[0]));
  return preHeaders
    .filter((header) => postHeaders.has(header))
    .flatMap((header) => [`${header} [Pre]`, `${header} [Post]`]);
}

export function renderLikert(root: HTMLElement, state: SuiteState): void {
  const dataset = state.activeDatasetId ? state.datasets[state.activeDatasetId] : null;
  const cfg = state.config;
  const panel = state.ui.likert.panel;
  const styleTab = state.ui.likert.styleTab;
  const columns = cfg.likert.analysisMode === 'comparison'
    ? detectComparisonLikertColumns(state)
    : detectLikertColumns(dataset);
  const datasetOptions = Object.values(state.datasets)
    .map((entry) => `<option value="${entry.id}">${entry.name}</option>`)
    .join('');
  const activePreset = getLikertPreset(cfg.likert.scalePresetId);
  const scaleLabels = activePreset
    ? (getLikertPresetLabels(activePreset.id, state.language) ?? cfg.likert.scaleLabels)
    : cfg.likert.scaleLabels;

  root.innerHTML = `
    <section class="workspace-layout">
      <aside class="workspace-rail">
        <h4>WORKSPACE</h4>
        <button data-module-panel="scale" class="${panel === 'scale' ? 'active' : ''}"><i class="ph ph-scales"></i><span>Scale</span></button>
        <button data-module-panel="chart" class="${panel === 'chart' ? 'active' : ''}"><i class="ph ph-chart-line-up"></i><span>Chart</span></button>
        <button data-module-panel="style" class="${panel === 'style' ? 'active' : ''}"><i class="ph ph-palette"></i><span>Style</span></button>
        <button data-module-panel="export" class="${panel === 'export' ? 'active' : ''}"><i class="ph ph-download-simple"></i><span>Export</span></button>
      </aside>

      <aside class="workspace-config-panel">
        <h3 style="margin:0;">Likert - ${panel}</h3>

        ${panel === 'scale' ? `
          <div class="config-block">
            <label>
              Preset de escala
              <select id="likert-scale-preset">
                ${LIKERT_PRESETS.map((preset) => `
                  <option value="${preset.id}" ${cfg.likert.scalePresetId === preset.id ? 'selected' : ''}>${preset.label[state.language]}</option>
                `).join('')}
                <option value="custom" ${!activePreset ? 'selected' : ''}>Custom</option>
              </select>
            </label>
            <label>
              Puntos de escala
              <input id="likert-scale-points" type="number" min="2" max="10" value="${cfg.likert.scalePoints}">
            </label>
            <label>
              Inicio escala
              <input id="likert-scale-start" type="number" min="0" max="10" value="${cfg.likert.scaleStart}">
            </label>
            <label>
              Labels de escala
              <textarea id="likert-scale-labels" rows="6" placeholder="Una etiqueta por linea">${scaleLabels.join('\n')}</textarea>
            </label>
            <label>
              Decimales
              <input id="likert-decimals" type="number" min="0" max="3" value="${cfg.likert.decimalPlaces}">
            </label>
          </div>
        ` : ''}

        ${panel === 'chart' ? `
          <div class="config-block">
            <p style="margin:0; color:#5a6475; font-size:0.9rem;">
              La v2 ya recupera los tipos base de la v1 y una primera capa de comparacion usando datasets guardados.
            </p>
            <label>
              Modo analisis
              <select id="likert-analysis-mode">
                <option value="standard" ${cfg.likert.analysisMode === 'standard' ? 'selected' : ''}>Standard</option>
                <option value="comparison" ${cfg.likert.analysisMode === 'comparison' ? 'selected' : ''}>Comparacion Pre/Post</option>
              </select>
            </label>
            ${cfg.likert.analysisMode === 'comparison' ? `
              <label>
                Dataset pre
                <select id="likert-comparison-pre">
                  <option value="">(select)</option>
                  ${datasetOptions.replace(`value="${cfg.likert.comparisonPreDatasetId ?? ''}"`, `value="${cfg.likert.comparisonPreDatasetId ?? ''}" selected`)}
                </select>
              </label>
              <label>
                Dataset post
                <select id="likert-comparison-post">
                  <option value="">(select)</option>
                  ${datasetOptions.replace(`value="${cfg.likert.comparisonPostDatasetId ?? ''}"`, `value="${cfg.likert.comparisonPostDatasetId ?? ''}" selected`)}
                </select>
              </label>
            ` : ''}
            <label>
              Tipo de grafico
              <select id="likert-chart-type">
                <option value="stacked" ${cfg.likert.chartType === 'stacked' ? 'selected' : ''}>Stacked</option>
                <option value="diverging" ${cfg.likert.chartType === 'diverging' ? 'selected' : ''}>Diverging</option>
                <option value="split" ${cfg.likert.chartType === 'split' ? 'selected' : ''}>Split</option>
                <option value="distribution" ${cfg.likert.chartType === 'distribution' ? 'selected' : ''}>Distribution</option>
              </select>
            </label>
            ${(cfg.likert.chartType === 'diverging' || cfg.likert.chartType === 'split') ? `
              <label>
                Indice neutral
                <input id="likert-neutral-index" type="number" min="1" max="${cfg.likert.scalePoints}" value="${cfg.likertChartType.diverging.neutralIndex}">
              </label>
            ` : ''}
            <label>
              Modo de valor
              <select id="likert-value-mode">
                <option value="percentage" ${cfg.likert.valueMode === 'percentage' ? 'selected' : ''}>Percentage</option>
                <option value="count" ${cfg.likert.valueMode === 'count' ? 'selected' : ''}>Count</option>
              </select>
            </label>
            <label>
              Orden de items
              <select id="likert-item-order">
                <option value="original" ${cfg.likert.itemOrder === 'original' ? 'selected' : ''}>Original</option>
                <option value="mean_desc" ${cfg.likert.itemOrder === 'mean_desc' ? 'selected' : ''}>Mean desc</option>
                <option value="mean_asc" ${cfg.likert.itemOrder === 'mean_asc' ? 'selected' : ''}>Mean asc</option>
                <option value="label_asc" ${cfg.likert.itemOrder === 'label_asc' ? 'selected' : ''}>Label asc</option>
              </select>
            </label>
            <label class="config-check">
              <input id="likert-show-values" type="checkbox" ${cfg.likert.showValues ? 'checked' : ''}>
              <span>Mostrar valores</span>
            </label>
            <label class="config-check">
              <input id="likert-show-legend" type="checkbox" ${cfg.likert.showLegend ? 'checked' : ''}>
              <span>Mostrar leyenda</span>
            </label>
            <label>
              Items seleccionados (vacio = todos)
              <div style="display:flex; gap:8px; margin:4px 0; flex-wrap:wrap;">
                <button id="likert-select-all-items" type="button">Select all</button>
                <button id="likert-deselect-all-items" type="button">Deselect all</button>
              </div>
              <select id="likert-selected-items" multiple size="8">
                ${columns.map((col) => `<option value="${col}" ${cfg.likert.selectedItems.includes(col) ? 'selected' : ''}>${col}</option>`).join('')}
              </select>
            </label>
          </div>
        ` : ''}

        ${panel === 'style' ? `
          <div class="layout-subnav" role="tablist" aria-label="Style groups">
            <button type="button" class="layout-tab ${styleTab === 'layout-colors' ? 'active' : ''}" data-likert-layout-tab="layout-colors">Colors</button>
            <button type="button" class="layout-tab ${styleTab === 'layout-typography' ? 'active' : ''}" data-likert-layout-tab="layout-typography">Typography</button>
            <button type="button" class="layout-tab ${styleTab === 'layout-bars' ? 'active' : ''}" data-likert-layout-tab="layout-bars">Bars</button>
            <button type="button" class="layout-tab ${styleTab === 'layout-legend' ? 'active' : ''}" data-likert-layout-tab="layout-legend">Legend</button>
            <button type="button" class="layout-tab ${styleTab === 'layout-axes-grid' ? 'active' : ''}" data-likert-layout-tab="layout-axes-grid">Axes & Grid</button>
            <button type="button" class="layout-tab ${styleTab === 'layout-canvas' ? 'active' : ''}" data-likert-layout-tab="layout-canvas">Canvas</button>
          </div>

          <div class="layout-section ${styleTab === 'layout-colors' ? 'active' : ''}" id="layout-colors">
            <div class="config-block">
              ${renderCommonColorControls({
                lang: state.language,
                paletteIdId: 'shared-palette',
                bgColorId: 'likert-bg-color',
                transparentBgId: 'likert-transparent-bg',
                gridColorId: 'likert-grid-color',
                axisColorId: 'likert-axis-color',
                paletteId: cfg.sharedChart.paletteId,
                canvasBackground: cfg.sharedChart.canvasBackground,
                canvasTransparent: cfg.sharedChart.canvasTransparent,
                gridColor: cfg.sharedChart.gridColor,
                axisColor: cfg.sharedChart.axisColor,
                extraControls: `
                  <label>
                    Color borde barras
                    <input id="likert-bar-border-color" type="color" value="${cfg.likertChartType.stacked.barBorderColor}">
                  </label>
                `
              })}
            </div>
          </div>

          <div class="layout-section ${styleTab === 'layout-typography' ? 'active' : ''}" id="layout-typography">
            <div class="config-block">
              ${renderCommonTypographyControls({
                lang: state.language,
                fontFamilyId: 'likert-font-family',
                fontLabelsId: 'likert-font-labels',
                labelMaxLinesId: 'likert-label-max-lines',
                fontFamily: cfg.sharedChart.fontFamily,
                labelFontSize: cfg.sharedChart.labelFontSize,
                labelMaxLines: cfg.likert.labelMaxLines,
                labelMaxLinesMax: 3,
                extraControls: `
                  <label>
                    Tamano valores
                    <input id="likert-font-values" type="number" min="8" max="32" value="${cfg.likert.fontSizeValues}">
                  </label>
                  <label>
                    Tamano leyenda
                    <input id="likert-font-legend" type="number" min="8" max="32" value="${cfg.likert.fontSizeLegend}">
                  </label>
                  <label>
                    Tamano titulo
                    <input id="likert-font-title" type="number" min="12" max="48" value="${cfg.likert.fontSizeTitle}">
                  </label>
                `
              })}
            </div>
          </div>

          <div class="layout-section ${styleTab === 'layout-bars' ? 'active' : ''}" id="layout-bars">
            <div class="config-block">
              <label>
                Alto barras
                <input id="likert-bar-height" type="number" min="20" max="100" value="${cfg.likertChartType.stacked.barHeight}">
              </label>
              <label>
                Espaciado barras
                <input id="likert-bar-spacing" type="number" min="0" max="50" value="${cfg.likertChartType.stacked.barSpacing}">
              </label>
              <label class="config-check">
                <input id="likert-show-bar-borders" type="checkbox" ${cfg.likertChartType.stacked.showBarBorders ? 'checked' : ''}>
                <span>Mostrar bordes</span>
              </label>
              <label>
                Grosor bordes
                <input id="likert-bar-border-width" type="number" min="1" max="5" value="${cfg.likertChartType.stacked.barBorderWidth}">
              </label>
            </div>
          </div>

          <div class="layout-section ${styleTab === 'layout-legend' ? 'active' : ''}" id="layout-legend">
            <div class="config-block">
              <label class="config-check">
                <input id="likert-show-legend-style" type="checkbox" ${cfg.likert.showLegend ? 'checked' : ''}>
                <span>Mostrar leyenda</span>
              </label>
              <label>
                Posicion leyenda
                <select id="likert-legend-position">
                  <option value="top" ${cfg.likert.legendPosition === 'top' ? 'selected' : ''}>Top</option>
                  <option value="left" ${cfg.likert.legendPosition === 'left' ? 'selected' : ''}>Left</option>
                  <option value="right" ${cfg.likert.legendPosition === 'right' ? 'selected' : ''}>Right</option>
                  <option value="bottom" ${cfg.likert.legendPosition === 'bottom' ? 'selected' : ''}>Bottom</option>
                </select>
              </label>
            </div>
          </div>

          <div class="layout-section ${styleTab === 'layout-axes-grid' ? 'active' : ''}" id="layout-axes-grid">
            <div class="config-block">
              ${renderCommonAxesGridControls({
                lang: state.language,
                showGridId: 'likert-show-grid',
                gridDashedId: 'likert-grid-dashed',
                gridVerticalId: 'likert-grid-vertical',
                gridHorizontalId: 'likert-grid-horizontal',
                showGridBorderId: 'likert-show-grid-border',
                gridWidthId: 'likert-grid-width',
                showAxisLabelsId: 'likert-show-axis-labels',
                axisWidthId: 'likert-axis-width',
                showGrid: cfg.sharedChart.showGrid,
                gridDashed: cfg.sharedChart.gridDashed,
                gridVertical: cfg.sharedChart.gridVertical,
                gridHorizontal: cfg.sharedChart.gridHorizontal,
                showGridBorder: cfg.sharedChart.showGridBorder,
                gridWidth: cfg.sharedChart.lineWidth,
                showAxisLabels: cfg.sharedChart.showAxisLabels,
                axisWidth: cfg.sharedChart.axisWidth
              })}
              ${(cfg.likert.chartType === 'diverging' || cfg.likert.chartType === 'split') ? `
                <label>
                  Color linea central
                  <input id="likert-center-line-color" type="color" value="${cfg.likertChartType.diverging.centerLineColor}">
                </label>
                <label>
                  Grosor linea central
                  <input id="likert-center-line-width" type="number" min="1" max="6" value="${cfg.likertChartType.diverging.centerLineWidth}">
                </label>
              ` : ''}
            </div>
          </div>

          <div class="layout-section ${styleTab === 'layout-canvas' ? 'active' : ''}" id="layout-canvas">
            <div class="config-block">
              ${renderCommonCanvasControls({
                lang: state.language,
                marginTopId: 'likert-margin-top',
                marginRightId: 'likert-margin-right',
                marginBottomId: 'likert-margin-bottom',
                marginLeftId: 'likert-margin-left',
                chartWidthId: 'likert-chart-width',
                marginTop: cfg.sharedChart.marginTop,
                marginRight: cfg.sharedChart.marginRight,
                marginBottom: cfg.sharedChart.marginBottom,
                marginLeft: cfg.sharedChart.marginLeft,
                chartWidth: cfg.sharedChart.chartWidth,
                extraControls: `
                  <label>
                    Titulo
                    <input id="shared-chart-title" type="text" value="${cfg.sharedChart.chartTitle}">
                  </label>
                  <label class="config-check">
                    <input id="shared-show-title" type="checkbox" ${cfg.sharedChart.showTitle ? 'checked' : ''}>
                    <span>Mostrar titulo</span>
                  </label>
                  <label>
                    Watermark
                    <input id="likert-watermark" type="text" value="${cfg.likert.watermark}">
                  </label>
                `
              })}
            </div>
          </div>
        ` : ''}

        ${panel === 'export' ? `
          ${renderExportPanel({
            lang: state.language,
            formatSelectId: 'likert-export-format',
            scaleSelectId: 'likert-export-scale',
            buttonId: 'likert-export-png-btn',
            format: cfg.sharedExport.format,
            scale: cfg.sharedExport.scale
          })}
        ` : ''}
      </aside>

      ${renderChartStage({
        lang: state.language,
        moduleId: 'likert',
        stageId: 'likert-stage',
        canvasId: 'likert-canvas',
        datasetName: dataset?.name,
        zoomLevel: cfg.likert.zoomLevel
      })}
    </section>
  `;
}
