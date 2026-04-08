import { t } from '../i18n';
import type { Lang } from '../types/state';

type ToolbarAction = 'zoom-in' | 'zoom-out' | 'zoom-reset' | 'fullscreen' | 'export';

type ChartStageOptions = {
  lang: Lang;
  moduleId: string;
  stageId: string;
  canvasId: string;
  datasetName?: string | null;
  zoomLevel: number;
  includeExportButton?: boolean;
};

function toolbarButton(action: ToolbarAction, moduleId: string, lang: Lang): string {
  const icons: Record<ToolbarAction, string> = {
    'zoom-in': 'ph ph-magnifying-glass-plus',
    'zoom-out': 'ph ph-magnifying-glass-minus',
    'zoom-reset': 'ph ph-arrow-counter-clockwise',
    fullscreen: 'ph ph-arrows-out-simple',
    export: 'ph ph-download-simple'
  };

  const labels: Record<ToolbarAction, string> = {
    'zoom-in': 'Zoom in',
    'zoom-out': 'Zoom out',
    'zoom-reset': 'Reset',
    fullscreen: 'Fullscreen',
    export: t(lang, 'export')
  };

  return `<button id="${moduleId}-${action}" class="chart-toolbar-button" type="button" title="${labels[action]}" aria-label="${labels[action]}"><i class="${icons[action]}"></i></button>`;
}

export function renderChartStage({
  lang,
  moduleId,
  stageId,
  canvasId,
  datasetName,
  zoomLevel,
  includeExportButton = false
}: ChartStageOptions): string {
  const toolbar = [
    toolbarButton('zoom-in', moduleId, lang),
    toolbarButton('zoom-out', moduleId, lang),
    toolbarButton('zoom-reset', moduleId, lang),
    toolbarButton('fullscreen', moduleId, lang),
    includeExportButton ? toolbarButton('export', moduleId, lang) : ''
  ].join('');

  return `
    <section class="workspace-canvas-area">
      <div class="workspace-canvas-header">
        <h2>${t(lang, 'visualization')}</h2>
        <div class="chart-toolbar">${toolbar}</div>
      </div>

      <div class="chart-stage" id="${stageId}">
        <p style="margin-top:0;">${t(lang, 'activeDataset')}: <strong>${datasetName ?? t(lang, 'noDataset')}</strong></p>
        <p style="margin-top:0; color:#5a6475;">${t(lang, 'zoom')}: ${(zoomLevel * 100).toFixed(0)}%</p>
        <canvas
          id="${canvasId}"
          style="width:100%; max-width:100%; display:block; transform:scale(${zoomLevel}); transform-origin: top left;"
        ></canvas>
      </div>
    </section>
  `.trim();
}
