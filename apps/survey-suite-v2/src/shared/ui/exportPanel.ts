import { t } from '../i18n';
import type { Lang } from '../types/state';

type ExportPanelOptions = {
  lang: Lang;
  formatSelectId: string;
  scaleSelectId: string;
  buttonId: string;
  format: 'png' | 'svg' | 'pdf';
  scale: 1 | 2 | 3 | 4;
  buttonLabel?: string;
};

export function renderExportPanel({
  lang,
  formatSelectId,
  scaleSelectId,
  buttonId,
  format,
  scale,
  buttonLabel = 'Export'
}: ExportPanelOptions): string {
  return `
    <div class="config-block">
      <label>
        ${t(lang, 'format')}
        <select id="${formatSelectId}">
          <option value="png" ${format === 'png' ? 'selected' : ''}>PNG</option>
          <option value="svg" ${format === 'svg' ? 'selected' : ''}>SVG</option>
          <option value="pdf" ${format === 'pdf' ? 'selected' : ''}>PDF</option>
        </select>
      </label>
      <label>
        ${t(lang, 'scale')}
        <select id="${scaleSelectId}">
          <option value="1" ${scale === 1 ? 'selected' : ''}>1x</option>
          <option value="2" ${scale === 2 ? 'selected' : ''}>2x</option>
          <option value="3" ${scale === 3 ? 'selected' : ''}>3x</option>
          <option value="4" ${scale === 4 ? 'selected' : ''}>4x</option>
        </select>
      </label>
      <button id="${buttonId}" type="button"><i class="ph ph-file-arrow-down"></i> ${buttonLabel}</button>
    </div>
  `.trim();
}
