import type { SuiteState } from '../../shared/types/state';
import { renderChartStage } from '../../shared/ui/chartStage';
import { renderExportPanel } from '../../shared/ui/exportPanel';
import {
  renderCommonAxesGridControls,
  renderCommonCanvasControls,
  renderCommonColorControls,
  renderCommonTypographyControls
} from '../../shared/ui/styleControls';
import { compareDistributionGroups, groupDistributionData, summarizeOverall } from './analysis';

function getColumns(dataset: SuiteState['datasets'][string] | null): string[] {
  if (!dataset?.records?.length) return [];
  return Object.keys(dataset.records[0]);
}

function detectNumericColumns(dataset: SuiteState['datasets'][string] | null): string[] {
  if (!dataset?.records?.length) return [];
  const cols = Object.keys(dataset.records[0]);
  return cols.filter((col) => {
    let valid = 0;
    dataset.records.forEach((row) => {
      const raw = row[col];
      const n = typeof raw === 'string' ? Number(raw.trim()) : Number(raw);
      if (Number.isFinite(n)) valid += 1;
    });
    return valid > 0;
  });
}

export function renderDistribution(root: HTMLElement, state: SuiteState): void {
  const dataset = state.activeDatasetId ? state.datasets[state.activeDatasetId] : null;
  const cfg = state.config;
  const panel = state.ui.distribution.panel;
  const styleTab = state.ui.distribution.styleTab;
  const copy = state.language === 'en'
    ? {
      workspace: 'WORKSPACE',
      data: 'Data',
      chart: 'Chart',
      style: 'Style',
      export: 'Export',
      moduleTitle: 'Distribution',
      numericVariable: 'Numeric variable',
      categoryVariable: 'Category variable (optional)',
      none: '(none)',
      chartType: 'Chart type',
      groupOrder: 'Group order',
      topNGroups: 'Top N groups',
      orientation: 'Orientation',
      hypothesisMode: 'Hypothesis mode',
      showOutliers: 'Show outliers',
      showJitter: 'Show jitter',
      showSampleSize: 'Show N per group',
      showHypothesis: 'Show hypothesis test',
      horizontal: 'Horizontal',
      vertical: 'Vertical',
      original: 'Original',
      alphabetical: 'Alphabetical',
      medianDesc: 'Median desc',
      medianAsc: 'Median asc',
      parametric: 'Parametric',
      nonparametric: 'Non-parametric',
      groupThickness: 'Group thickness',
      groupGap: 'Group gap',
      whiskerMultiplier: 'Whisker multiplier (IQR)',
      outlierColor: 'Outlier color',
      outlierSize: 'Outlier size',
      jitterSize: 'Jitter size',
      jitterAlpha: 'Jitter opacity',
      showMarker: 'Show group marker',
      markerMetric: 'Marker metric',
      markerStyle: 'Marker style',
      markerColor: 'Marker color',
      markerSize: 'Marker size',
      annotations: 'Annotations',
      showMeanLine: 'Show overall mean line',
      meanLineColor: 'Mean line color',
      meanLineWidth: 'Mean line width',
      meanLineDash: 'Mean line dash',
      meanLineGap: 'Mean line gap',
      showMeanLabel: 'Show mean label',
      showStatsPanel: 'Show stats panel',
      statsPosition: 'Stats position',
      annotationText: 'Annotation text',
      annotationX: 'Annotation X (%)',
      annotationY: 'Annotation Y (%)',
      annotationColor: 'Annotation color',
      annotationSize: 'Annotation size',
      analysis: 'Analysis',
      noSummary: 'Not enough data to summarize the current selection.',
      noHypothesis: 'Not enough groups with data to run the selected test.',
      enableAnalysis: 'Enable stats panel or hypothesis test to see additional analysis, like in v1.'
    }
    : {
      workspace: 'WORKSPACE',
      data: 'Data',
      chart: 'Chart',
      style: 'Style',
      export: 'Export',
      moduleTitle: 'Distribution',
      numericVariable: 'Variable numerica',
      categoryVariable: 'Variable categoria (opcional)',
      none: '(none)',
      chartType: 'Tipo grafico',
      groupOrder: 'Orden de grupos',
      topNGroups: 'Top N grupos',
      orientation: 'Orientacion',
      hypothesisMode: 'Modo hipotesis',
      showOutliers: 'Mostrar outliers',
      showJitter: 'Mostrar jitter',
      showSampleSize: 'Mostrar N por grupo',
      showHypothesis: 'Mostrar prueba de hipotesis',
      horizontal: 'Horizontal',
      vertical: 'Vertical',
      original: 'Original',
      alphabetical: 'Alfabetico',
      medianDesc: 'Mediana desc',
      medianAsc: 'Mediana asc',
      parametric: 'Parametrico',
      nonparametric: 'No parametrico',
      groupThickness: 'Grosor de grupo',
      groupGap: 'Separacion grupos',
      whiskerMultiplier: 'Multiplicador whisker (IQR)',
      outlierColor: 'Color outlier',
      outlierSize: 'Tamano outlier',
      jitterSize: 'Tamano jitter',
      jitterAlpha: 'Opacidad jitter',
      showMarker: 'Mostrar marcador de grupo',
      markerMetric: 'Metrica marcador',
      markerStyle: 'Estilo marcador',
      markerColor: 'Color marcador',
      markerSize: 'Tamano marcador',
      annotations: 'Annotations',
      showMeanLine: 'Mostrar linea de media global',
      meanLineColor: 'Color linea media',
      meanLineWidth: 'Grosor linea media',
      meanLineDash: 'Dash linea media',
      meanLineGap: 'Gap linea media',
      showMeanLabel: 'Mostrar etiqueta media',
      showStatsPanel: 'Mostrar panel de stats',
      statsPosition: 'Posicion stats',
      annotationText: 'Texto anotacion',
      annotationX: 'X anotacion (%)',
      annotationY: 'Y anotacion (%)',
      annotationColor: 'Color anotacion',
      annotationSize: 'Tamano anotacion',
      analysis: 'Analysis',
      noSummary: 'No hay suficientes datos para resumir estadisticamente la seleccion actual.',
      noHypothesis: 'No hay suficientes grupos con datos para ejecutar la prueba seleccionada.',
      enableAnalysis: 'Activa panel de stats o prueba de hipotesis para ver analisis adicionales, igual que en la v1.'
    };
  const allCols = getColumns(dataset);
  const numericCols = detectNumericColumns(dataset);
  const numeric = cfg.distribution.numericColumns[0] || numericCols[0] || '';
  const category = cfg.distribution.categoryColumn || '';
  const distGroups = groupDistributionData(
    dataset,
    numeric,
    category,
    cfg.distribution.groupOrder,
    cfg.distribution.topNGroups,
    cfg.distributionChartType.boxplot.whiskerMultiplier
  );
  const statsRows = distGroups.map((group) => ({
    label: group.label,
    n: group.summary.n,
    mean: group.summary.mean,
    median: group.summary.median,
    sd: group.summary.sd,
    iqr: group.summary.iqr
  }));
  const overallStats = summarizeOverall(distGroups);
  const hypothesisResult = cfg.distribution.showHypothesisPanel
    ? compareDistributionGroups(distGroups, cfg.distribution.hypothesisMode)
    : null;

  root.innerHTML = `
    <section class="workspace-layout">
      <aside class="workspace-rail">
        <h4>${copy.workspace}</h4>
        <button data-module-panel="data" class="${panel === 'data' ? 'active' : ''}"><i class="ph ph-folder-simple"></i><span>${copy.data}</span></button>
        <button data-module-panel="chart" class="${panel === 'chart' ? 'active' : ''}"><i class="ph ph-chart-line"></i><span>${copy.chart}</span></button>
        <button data-module-panel="style" class="${panel === 'style' ? 'active' : ''}"><i class="ph ph-palette"></i><span>${copy.style}</span></button>
        <button data-module-panel="export" class="${panel === 'export' ? 'active' : ''}"><i class="ph ph-download-simple"></i><span>${copy.export}</span></button>
      </aside>

      <aside class="workspace-config-panel">
        <h3 style="margin:0;">${copy.moduleTitle} - ${panel}</h3>

        ${panel === 'data' ? `
          <div class="config-block">
            <label>
              ${copy.numericVariable}
              <select id="dist-numeric-column">
                ${numericCols.map((c) => `<option value="${c}" ${c === numeric ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </label>

            <label>
              ${copy.categoryVariable}
              <select id="dist-category-column">
                <option value="">${copy.none}</option>
                ${allCols.map((c) => `<option value="${c}" ${c === category ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </label>
          </div>
        ` : ''}

        ${panel === 'chart' ? `
          <div class="config-block">
            <label>
              ${copy.chartType}
              <select id="dist-chart-type">
                <option value="boxplot" ${cfg.distribution.chartType === 'boxplot' ? 'selected' : ''}>Boxplot</option>
                <option value="violin" ${cfg.distribution.chartType === 'violin' ? 'selected' : ''}>Violin</option>
                <option value="boxviolin" ${cfg.distribution.chartType === 'boxviolin' ? 'selected' : ''}>Box + Violin</option>
                <option value="raincloud" ${cfg.distribution.chartType === 'raincloud' ? 'selected' : ''}>Raincloud</option>
                <option value="errorbar" ${cfg.distribution.chartType === 'errorbar' ? 'selected' : ''}>Error Bar</option>
              </select>
            </label>
            <label>
              ${copy.groupOrder}
              <select id="dist-group-order">
                <option value="original" ${cfg.distribution.groupOrder === 'original' ? 'selected' : ''}>${copy.original}</option>
                <option value="alphabetical" ${cfg.distribution.groupOrder === 'alphabetical' ? 'selected' : ''}>${copy.alphabetical}</option>
                <option value="median_desc" ${cfg.distribution.groupOrder === 'median_desc' ? 'selected' : ''}>${copy.medianDesc}</option>
                <option value="median_asc" ${cfg.distribution.groupOrder === 'median_asc' ? 'selected' : ''}>${copy.medianAsc}</option>
              </select>
            </label>

            <label>
              ${copy.topNGroups}
              <input id="dist-top-n" type="number" min="1" max="100" value="${cfg.distribution.topNGroups}">
            </label>

            <label>
              ${copy.orientation}
              <select id="dist-orientation">
                <option value="horizontal" ${cfg.distribution.orientation === 'horizontal' ? 'selected' : ''}>${copy.horizontal}</option>
                <option value="vertical" ${cfg.distribution.orientation === 'vertical' ? 'selected' : ''}>${copy.vertical}</option>
              </select>
            </label>

            <label>
              ${copy.hypothesisMode}
              <select id="dist-hypothesis-mode">
                <option value="auto" ${cfg.distribution.hypothesisMode === 'auto' ? 'selected' : ''}>Auto</option>
                <option value="parametric" ${cfg.distribution.hypothesisMode === 'parametric' ? 'selected' : ''}>${copy.parametric}</option>
                <option value="nonparametric" ${cfg.distribution.hypothesisMode === 'nonparametric' ? 'selected' : ''}>${copy.nonparametric}</option>
              </select>
            </label>

            <label class="config-check">
              <input id="dist-show-outliers" type="checkbox" ${cfg.distribution.showOutliers ? 'checked' : ''}>
              <span>${copy.showOutliers}</span>
            </label>

            <label class="config-check">
              <input id="dist-show-jitter" type="checkbox" ${cfg.distribution.showJitter ? 'checked' : ''}>
              <span>${copy.showJitter}</span>
            </label>

            <label class="config-check">
              <input id="dist-show-sample-size" type="checkbox" ${cfg.distribution.showSampleSizeLabel ? 'checked' : ''}>
              <span>${copy.showSampleSize}</span>
            </label>

            <label class="config-check">
              <input id="dist-show-hypothesis-panel" type="checkbox" ${cfg.distribution.showHypothesisPanel ? 'checked' : ''}>
              <span>${copy.showHypothesis}</span>
            </label>
          </div>
        ` : ''}

        ${panel === 'style' ? `
          <div class="layout-subnav" role="tablist" aria-label="Distribution style groups">
            <button type="button" class="layout-tab ${styleTab === 'layout-colors' ? 'active' : ''}" data-distribution-layout-tab="layout-colors">Colors</button>
            <button type="button" class="layout-tab ${styleTab === 'layout-typography' ? 'active' : ''}" data-distribution-layout-tab="layout-typography">Typography</button>
            <button type="button" class="layout-tab ${styleTab === 'layout-marks' ? 'active' : ''}" data-distribution-layout-tab="layout-marks">Marks</button>
            <button type="button" class="layout-tab ${styleTab === 'layout-annotations' ? 'active' : ''}" data-distribution-layout-tab="layout-annotations">Analysis</button>
            <button type="button" class="layout-tab ${styleTab === 'layout-axes-grid' ? 'active' : ''}" data-distribution-layout-tab="layout-axes-grid">Axes & Grid</button>
            <button type="button" class="layout-tab ${styleTab === 'layout-canvas' ? 'active' : ''}" data-distribution-layout-tab="layout-canvas">Canvas</button>
          </div>

          <div class="layout-section ${styleTab === 'layout-colors' ? 'active' : ''}" id="dist-layout-colors">
            <div class="config-block">
              ${renderCommonColorControls({
                lang: state.language,
                paletteIdId: 'dist-shared-palette',
                bgColorId: 'dist-bg-color',
                transparentBgId: 'dist-transparent-bg',
                gridColorId: 'dist-grid-color',
                axisColorId: 'dist-axis-color',
                paletteId: cfg.sharedChart.paletteId,
                canvasBackground: cfg.sharedChart.canvasBackground,
                canvasTransparent: cfg.sharedChart.canvasTransparent,
                gridColor: cfg.sharedChart.gridColor,
                axisColor: cfg.sharedChart.axisColor
              })}
            </div>
          </div>

          <div class="layout-section ${styleTab === 'layout-typography' ? 'active' : ''}" id="dist-layout-typography">
            <div class="config-block">
              ${renderCommonTypographyControls({
                lang: state.language,
                fontFamilyId: 'dist-font-family',
                fontLabelsId: 'dist-font-labels',
                labelMaxLinesId: 'dist-label-max-lines',
                fontFamily: cfg.sharedChart.fontFamily,
                labelFontSize: cfg.sharedChart.labelFontSize,
                labelMaxLines: cfg.distribution.labelMaxLines,
                labelFontMax: 28,
                labelMaxLinesMax: 4
              })}
            </div>
          </div>

          <div class="layout-section ${styleTab === 'layout-marks' ? 'active' : ''}" id="dist-layout-marks">
            <div class="config-block">
              <label>
                ${copy.groupThickness}
                <input id="dist-group-thickness" type="number" min="16" max="80" value="${cfg.distribution.groupThickness}">
              </label>
              <label>
                ${copy.groupGap}
                <input id="dist-group-gap" type="number" min="4" max="80" value="${cfg.distribution.groupGap}">
              </label>
              <label>
                ${copy.whiskerMultiplier}
                <input id="dist-whisker-mult" type="number" min="0.5" max="5" step="0.1" value="${cfg.distributionChartType.boxplot.whiskerMultiplier}">
              </label>
              ${(cfg.distribution.chartType === 'violin' || cfg.distribution.chartType === 'boxviolin') ? `
                <label>
                  Bandwidth KDE
                  <input
                    id="dist-kde-bandwidth"
                    type="number"
                    min="0.2"
                    max="4"
                    step="0.1"
                    value="${cfg.distribution.chartType === 'boxviolin'
                      ? cfg.distributionChartType.boxviolin.kdeBandwidthFactor
                      : cfg.distributionChartType.violin.kdeBandwidthFactor}"
                  >
                </label>
                <label>
                  Pasos KDE
                  <input
                    id="dist-kde-steps"
                    type="number"
                    min="30"
                    max="260"
                    step="5"
                    value="${cfg.distribution.chartType === 'boxviolin'
                      ? cfg.distributionChartType.boxviolin.kdeSteps
                      : cfg.distributionChartType.violin.kdeSteps}"
                  >
                </label>
                <label>
                  Opacidad violin
                  <input
                    id="dist-violin-opacity"
                    type="number"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value="${cfg.distribution.chartType === 'boxviolin'
                      ? cfg.distributionChartType.boxviolin.violinOpacity
                      : cfg.distributionChartType.violin.violinOpacity}"
                  >
                </label>
              ` : ''}
              ${cfg.distribution.chartType === 'raincloud' ? `
                <label>
                  Cloud offset
                  <input id="dist-raincloud-offset" type="number" min="2" max="30" step="1" value="${cfg.distributionChartType.raincloud.cloudOffset}">
                </label>
                <label>
                  Ratio caja
                  <input id="dist-raincloud-box-ratio" type="number" min="0.2" max="0.8" step="0.05" value="${cfg.distributionChartType.raincloud.boxHeightRatio}">
                </label>
              ` : ''}
              ${cfg.distribution.chartType === 'errorbar' ? `
                <label>
                  Metrica error
                  <select id="dist-error-metric">
                    <option value="sd" ${cfg.distributionChartType.errorbar.errorMetric === 'sd' ? 'selected' : ''}>SD</option>
                    <option value="se" ${cfg.distributionChartType.errorbar.errorMetric === 'se' ? 'selected' : ''}>SE</option>
                    <option value="ci95" ${cfg.distributionChartType.errorbar.errorMetric === 'ci95' ? 'selected' : ''}>CI 95</option>
                    <option value="minmax" ${cfg.distributionChartType.errorbar.errorMetric === 'minmax' ? 'selected' : ''}>Min/Max</option>
                  </select>
                </label>
                <label>
                  Nivel CI
                  <input id="dist-error-ci-level" type="number" min="80" max="99" step="1" value="${cfg.distributionChartType.errorbar.errorCiLevel}">
                </label>
              ` : ''}
              <label>
                ${copy.outlierColor}
                <input id="dist-outlier-color" type="color" value="${cfg.distribution.outlierColor}">
              </label>
              <label>
                ${copy.outlierSize}
                <input id="dist-outlier-size" type="number" min="1" max="12" step="0.2" value="${cfg.distribution.outlierSize}">
              </label>
              <label>
                ${copy.jitterSize}
                <input id="dist-jitter-size" type="number" min="0.6" max="10" step="0.2" value="${cfg.distribution.jitterSize}">
              </label>
              <label>
                ${copy.jitterAlpha}
                <input id="dist-jitter-alpha" type="number" min="0.05" max="1" step="0.05" value="${cfg.distribution.jitterAlpha}">
              </label>
              <label class="config-check">
                <input id="dist-show-marker" type="checkbox" ${cfg.distribution.showGroupMarker ? 'checked' : ''}>
                <span>${copy.showMarker}</span>
              </label>
              <label>
                ${copy.markerMetric}
                <select id="dist-group-metric">
                  <option value="median" ${cfg.distribution.groupMetric === 'median' ? 'selected' : ''}>Mediana</option>
                  <option value="mean" ${cfg.distribution.groupMetric === 'mean' ? 'selected' : ''}>Media</option>
                </select>
              </label>
              <label>
                ${copy.markerStyle}
                <select id="dist-marker-style">
                  <option value="point" ${cfg.distribution.groupMarkerStyle === 'point' ? 'selected' : ''}>Punto</option>
                  <option value="square" ${cfg.distribution.groupMarkerStyle === 'square' ? 'selected' : ''}>Cuadrado</option>
                  <option value="line" ${cfg.distribution.groupMarkerStyle === 'line' ? 'selected' : ''}>Linea</option>
                </select>
              </label>
              <label>
                ${copy.markerColor}
                <input id="dist-marker-color" type="color" value="${cfg.distribution.groupMarkerColor}">
              </label>
              <label>
                ${copy.markerSize}
                <input id="dist-marker-size" type="number" min="2" max="18" step="0.5" value="${cfg.distribution.groupMarkerSize}">
              </label>
            </div>
          </div>

          <div class="layout-section ${styleTab === 'layout-annotations' ? 'active' : ''}" id="dist-layout-annotations">
            <div class="config-block">
              <div class="config-subgroup">
                <h4 style="margin:8px 0 4px;">${copy.annotations}</h4>
              </div>
              <label class="config-check">
                <input id="dist-show-mean-line" type="checkbox" ${cfg.sharedAnnotations.showMeanLine ? 'checked' : ''}>
                <span>${copy.showMeanLine}</span>
              </label>
              <label>
                ${copy.meanLineColor}
                <input id="dist-mean-line-color" type="color" value="${cfg.sharedAnnotations.meanLineColor}">
              </label>
              <label>
                ${copy.meanLineWidth}
                <input id="dist-mean-line-width" type="number" min="1" max="8" step="0.2" value="${cfg.sharedAnnotations.meanLineWidth}">
              </label>
              <label>
                ${copy.meanLineDash}
                <input id="dist-mean-line-dash" type="number" min="2" max="40" step="1" value="${cfg.sharedAnnotations.meanLineDash}">
              </label>
              <label>
                ${copy.meanLineGap}
                <input id="dist-mean-line-gap" type="number" min="2" max="40" step="1" value="${cfg.sharedAnnotations.meanLineGap}">
              </label>
              <label class="config-check">
                <input id="dist-show-mean-label" type="checkbox" ${cfg.sharedAnnotations.showMeanLabel ? 'checked' : ''}>
                <span>${copy.showMeanLabel}</span>
              </label>
              <label class="config-check">
                <input id="dist-show-stats-panel" type="checkbox" ${cfg.sharedAnnotations.showStatsPanel ? 'checked' : ''}>
                <span>${copy.showStatsPanel}</span>
              </label>
              <label>
                ${copy.statsPosition}
                <select id="dist-stats-position">
                  <option value="top_left" ${cfg.sharedAnnotations.statsPosition === 'top_left' ? 'selected' : ''}>Top left</option>
                  <option value="top_right" ${cfg.sharedAnnotations.statsPosition === 'top_right' ? 'selected' : ''}>Top right</option>
                  <option value="bottom_left" ${cfg.sharedAnnotations.statsPosition === 'bottom_left' ? 'selected' : ''}>Bottom left</option>
                  <option value="bottom_right" ${cfg.sharedAnnotations.statsPosition === 'bottom_right' ? 'selected' : ''}>Bottom right</option>
                </select>
              </label>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:8px 12px;">
                <label class="config-check"><input id="dist-stats-show-n" type="checkbox" ${cfg.sharedAnnotations.statsFields.n ? 'checked' : ''}><span>N</span></label>
                <label class="config-check"><input id="dist-stats-show-mean" type="checkbox" ${cfg.sharedAnnotations.statsFields.mean ? 'checked' : ''}><span>Mean</span></label>
                <label class="config-check"><input id="dist-stats-show-median" type="checkbox" ${cfg.sharedAnnotations.statsFields.median ? 'checked' : ''}><span>Median</span></label>
                <label class="config-check"><input id="dist-stats-show-sd" type="checkbox" ${cfg.sharedAnnotations.statsFields.sd ? 'checked' : ''}><span>SD</span></label>
                <label class="config-check"><input id="dist-stats-show-iqr" type="checkbox" ${cfg.sharedAnnotations.statsFields.iqr ? 'checked' : ''}><span>IQR</span></label>
              </div>
              <label>
                ${copy.annotationText}
                <input id="dist-annotation-text" type="text" value="${cfg.sharedAnnotations.annotationText}">
              </label>
              <label>
                ${copy.annotationX}
                <input id="dist-annotation-x" type="number" min="0" max="100" step="1" value="${cfg.sharedAnnotations.annotationX}">
              </label>
              <label>
                ${copy.annotationY}
                <input id="dist-annotation-y" type="number" min="0" max="100" step="1" value="${cfg.sharedAnnotations.annotationY}">
              </label>
              <label>
                ${copy.annotationColor}
                <input id="dist-annotation-color" type="color" value="${cfg.sharedAnnotations.annotationColor}">
              </label>
              <label>
                ${copy.annotationSize}
                <input id="dist-annotation-size" type="number" min="10" max="40" step="1" value="${cfg.sharedAnnotations.annotationSize}">
              </label>
            </div>
          </div>

          <div class="layout-section ${styleTab === 'layout-axes-grid' ? 'active' : ''}" id="dist-layout-axes-grid">
            <div class="config-block">
              ${renderCommonAxesGridControls({
                lang: state.language,
                showGridId: 'dist-show-grid',
                gridDashedId: 'dist-grid-dashed',
                gridVerticalId: 'dist-grid-vertical',
                gridHorizontalId: 'dist-grid-horizontal',
                showGridBorderId: 'dist-show-grid-border',
                gridWidthId: 'dist-grid-width',
                showAxisLabelsId: 'dist-show-axis-labels',
                axisWidthId: 'dist-axis-width',
                showGrid: cfg.sharedChart.showGrid,
                gridDashed: cfg.sharedChart.gridDashed,
                gridVertical: cfg.sharedChart.gridVertical,
                gridHorizontal: cfg.sharedChart.gridHorizontal,
                showGridBorder: cfg.sharedChart.showGridBorder,
                gridWidth: cfg.sharedChart.lineWidth,
                showAxisLabels: cfg.sharedChart.showAxisLabels,
                axisWidth: cfg.sharedChart.axisWidth
              })}
            </div>
          </div>

          <div class="layout-section ${styleTab === 'layout-canvas' ? 'active' : ''}" id="dist-layout-canvas">
            <div class="config-block">
              ${renderCommonCanvasControls({
                lang: state.language,
                marginTopId: 'dist-margin-top',
                marginRightId: 'dist-margin-right',
                marginBottomId: 'dist-margin-bottom',
                marginLeftId: 'dist-margin-left',
                chartWidthId: 'dist-chart-width',
                marginTop: cfg.sharedChart.marginTop,
                marginRight: cfg.sharedChart.marginRight,
                marginBottom: cfg.sharedChart.marginBottom,
                marginLeft: cfg.sharedChart.marginLeft,
                chartWidth: cfg.sharedChart.chartWidth,
                includeChartMinHeight: true,
                chartMinHeightId: 'dist-chart-min-height',
                chartMinHeight: cfg.sharedChart.chartMinHeight
              })}
            </div>
          </div>
        ` : ''}

        ${panel === 'export' ? `
          ${renderExportPanel({
            lang: state.language,
            formatSelectId: 'dist-export-format',
            scaleSelectId: 'dist-export-scale',
            buttonId: 'dist-export-btn',
            format: cfg.sharedExport.format,
            scale: cfg.sharedExport.scale
          })}
        ` : ''}
      </aside>

      <section class="distribution-main-column">
        ${renderChartStage({
          lang: state.language,
          moduleId: 'dist',
          stageId: 'distribution-stage',
          canvasId: 'distribution-canvas',
          datasetName: dataset?.name,
          zoomLevel: cfg.distribution.zoomLevel,
          includeExportButton: true
        })}

        <section class="workspace-canvas-area distribution-analysis-area" style="padding-top:0;">
          <div class="workspace-canvas-header">
            <h2>${copy.analysis}</h2>
          </div>
          <div class="chart-stage distribution-analysis-stage">
            ${cfg.sharedAnnotations.showStatsPanel && statsRows.length ? `
              <div class="distribution-analysis-grid">
                ${statsRows.map((row) => `
                  <div class="distribution-analysis-card">
                    <div class="distribution-analysis-card-title">${row.label}</div>
                    <div class="distribution-analysis-metrics">
                      <div><strong>N</strong><br>${row.n}</div>
                      <div><strong>Mean</strong><br>${row.mean.toFixed(2)}</div>
                      <div><strong>Median</strong><br>${row.median.toFixed(2)}</div>
                      <div><strong>SD</strong><br>${row.sd.toFixed(2)}</div>
                      <div><strong>IQR</strong><br>${row.iqr.toFixed(2)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${cfg.sharedAnnotations.showStatsPanel && Number.isFinite(overallStats.n) && overallStats.n > 0 ? `
              <div class="distribution-analysis-card distribution-analysis-card-overall">
                <div class="distribution-analysis-card-title">Overall</div>
                <div class="distribution-analysis-metrics">
                  <div><strong>N</strong><br>${overallStats.n}</div>
                  <div><strong>Mean</strong><br>${overallStats.mean.toFixed(2)}</div>
                  <div><strong>Median</strong><br>${overallStats.median.toFixed(2)}</div>
                  <div><strong>SD</strong><br>${overallStats.sd.toFixed(2)}</div>
                  <div><strong>IQR</strong><br>${overallStats.iqr.toFixed(2)}</div>
                </div>
              </div>
            ` : ''}
            ${cfg.distribution.showHypothesisPanel ? `
              <div class="distribution-analysis-card">
                <div class="distribution-analysis-card-title">Hypothesis test</div>
                ${hypothesisResult ? `
                  <div class="distribution-analysis-metrics distribution-analysis-metrics-wide">
                    <div><strong>Test</strong><br>${hypothesisResult.test}</div>
                    <div><strong>${hypothesisResult.statLabel}</strong><br>${hypothesisResult.stat.toFixed(3)}</div>
                    ${Number.isFinite(hypothesisResult.df ?? NaN) ? `<div><strong>df</strong><br>${(hypothesisResult.df as number).toFixed(1)}</div>` : ''}
                    ${Number.isFinite(hypothesisResult.df1 ?? NaN) && Number.isFinite(hypothesisResult.df2 ?? NaN)
                      ? `<div><strong>df</strong><br>${(hypothesisResult.df1 as number).toFixed(0)}, ${(hypothesisResult.df2 as number).toFixed(0)}</div>`
                      : ''}
                    <div><strong>p</strong><br>${hypothesisResult.p < 0.001 ? '&lt; 0.001' : hypothesisResult.p.toFixed(4)}</div>
                    <div><strong>${hypothesisResult.effectLabel}</strong><br>${hypothesisResult.effect.toFixed(3)}</div>
                  </div>
                ` : `
                  <p style="margin:0; color:#64748b;">${copy.noHypothesis}</p>
                `}
              </div>
            ` : ''}
            ${!cfg.sharedAnnotations.showStatsPanel && !cfg.distribution.showHypothesisPanel ? `
              <p style="margin:0; color:#64748b;">${copy.enableAnalysis}</p>
            ` : ''}
          </div>
        </section>
      </section>
    </section>
  `;
}
