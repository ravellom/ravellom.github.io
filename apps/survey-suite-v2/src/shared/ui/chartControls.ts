import { exportCanvasPDF, exportCanvasPNG, exportCanvasSVG } from '../export/canvas';

type ExportFormat = 'png' | 'svg' | 'pdf';
type ExportScale = 1 | 2 | 3 | 4;

type ChartExportOptions = {
  canvasId: string;
  triggerButtonId: string;
  filenamePrefix: string;
  formatSelectId?: string;
  scaleSelectId?: string;
  toolbarExportButtonId?: string;
  getFallbackFormat: () => ExportFormat;
  getFallbackScale: () => ExportScale;
  setFormat: (format: ExportFormat) => void;
  setScale: (scale: ExportScale) => void;
};

type ChartStageOptions = {
  stageId: string;
  zoomInButtonId: string;
  zoomOutButtonId: string;
  zoomResetButtonId: string;
  fullscreenButtonId: string;
  getZoom: () => number;
  setZoom: (zoom: number) => void;
  setFullscreenEnabled?: (enabled: boolean) => void;
};

function isExportFormat(value: string): value is ExportFormat {
  return value === 'png' || value === 'svg' || value === 'pdf';
}

function isExportScale(value: number): value is ExportScale {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export function bindChartExportControls({
  canvasId,
  triggerButtonId,
  filenamePrefix,
  formatSelectId,
  scaleSelectId,
  toolbarExportButtonId,
  getFallbackFormat,
  getFallbackScale,
  setFormat,
  setScale
}: ChartExportOptions): void {
  const triggerButton = document.getElementById(triggerButtonId) as HTMLButtonElement | null;
  const toolbarButton = toolbarExportButtonId
    ? (document.getElementById(toolbarExportButtonId) as HTMLButtonElement | null)
    : null;
  const formatSelect = formatSelectId
    ? (document.getElementById(formatSelectId) as HTMLSelectElement | null)
    : null;
  const scaleSelect = scaleSelectId
    ? (document.getElementById(scaleSelectId) as HTMLSelectElement | null)
    : null;

  formatSelect?.addEventListener('change', () => {
    if (isExportFormat(formatSelect.value)) {
      setFormat(formatSelect.value);
    }
  });

  scaleSelect?.addEventListener('change', () => {
    const value = Number(scaleSelect.value);
    if (isExportScale(value)) {
      setScale(value);
    }
  });

  triggerButton?.addEventListener('click', () => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return;

    const formatValue = formatSelect?.value ?? getFallbackFormat();
    const scaleValue = Number(scaleSelect?.value ?? getFallbackScale());
    const format = isExportFormat(formatValue) ? formatValue : getFallbackFormat();
    const scale = isExportScale(scaleValue) ? scaleValue : getFallbackScale();
    const stamp = Date.now();

    if (format === 'svg') {
      exportCanvasSVG(canvas, `${filenamePrefix}-${stamp}.svg`, scale);
      return;
    }
    if (format === 'pdf') {
      exportCanvasPDF(canvas, `${filenamePrefix}-${stamp}.pdf`, scale);
      return;
    }
    exportCanvasPNG(canvas, `${filenamePrefix}-${stamp}.png`, scale);
  });

  toolbarButton?.addEventListener('click', () => {
    triggerButton?.click();
  });
}

export function bindChartStageControls({
  stageId,
  zoomInButtonId,
  zoomOutButtonId,
  zoomResetButtonId,
  fullscreenButtonId,
  getZoom,
  setZoom,
  setFullscreenEnabled
}: ChartStageOptions): void {
  const zoomInButton = document.getElementById(zoomInButtonId) as HTMLButtonElement | null;
  const zoomOutButton = document.getElementById(zoomOutButtonId) as HTMLButtonElement | null;
  const zoomResetButton = document.getElementById(zoomResetButtonId) as HTMLButtonElement | null;
  const fullscreenButton = document.getElementById(fullscreenButtonId) as HTMLButtonElement | null;

  zoomInButton?.addEventListener('click', () => {
    const current = getZoom();
    setZoom(Math.min(2.4, Number((current + 0.1).toFixed(2))));
  });

  zoomOutButton?.addEventListener('click', () => {
    const current = getZoom();
    setZoom(Math.max(0.5, Number((current - 0.1).toFixed(2))));
  });

  zoomResetButton?.addEventListener('click', () => {
    setZoom(1);
  });

  fullscreenButton?.addEventListener('click', async () => {
    const stage = document.getElementById(stageId);
    if (!stage) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setFullscreenEnabled?.(false);
      return;
    }

    await stage.requestFullscreen();
    setFullscreenEnabled?.(true);
  });
}

