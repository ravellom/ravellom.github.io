import { t } from '../i18n';
import type { Lang } from '../types/state';

type TypographyControlsOptions = {
  lang: Lang;
  fontFamilyId: string;
  fontLabelsId: string;
  labelMaxLinesId: string;
  fontFamily: string;
  labelFontSize: number;
  labelMaxLines: number;
  labelFontMax?: number;
  labelMaxLinesMax?: number;
  extraControls?: string;
};

type CanvasControlsOptions = {
  lang: Lang;
  marginTopId: string;
  marginRightId: string;
  marginBottomId: string;
  marginLeftId: string;
  chartWidthId: string;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  chartWidth: number;
  includeChartMinHeight?: boolean;
  chartMinHeightId?: string;
  chartMinHeight?: number;
  extraControls?: string;
};

type ColorControlsOptions = {
  lang: Lang;
  paletteIdId: string;
  bgColorId: string;
  transparentBgId: string;
  gridColorId: string;
  axisColorId: string;
  paletteId: 'blue_orange' | 'red_green' | 'purple_yellow' | 'spectral' | 'viridis' | 'warm' | 'cool' | 'earth';
  canvasBackground: string;
  canvasTransparent: boolean;
  gridColor: string;
  axisColor: string;
  extraControls?: string;
};

type AxesGridControlsOptions = {
  lang: Lang;
  showGridId: string;
  gridDashedId: string;
  gridVerticalId: string;
  gridHorizontalId: string;
  showGridBorderId: string;
  gridWidthId: string;
  showAxisLabelsId: string;
  axisWidthId: string;
  showGrid: boolean;
  gridDashed: boolean;
  gridVertical: boolean;
  gridHorizontal: boolean;
  showGridBorder: boolean;
  gridWidth: number;
  showAxisLabels: boolean;
  axisWidth: number;
  extraControls?: string;
};

export function renderCommonTypographyControls({
  lang,
  fontFamilyId,
  fontLabelsId,
  labelMaxLinesId,
  fontFamily,
  labelFontSize,
  labelMaxLines,
  labelFontMax = 32,
  labelMaxLinesMax = 4,
  extraControls = ''
}: TypographyControlsOptions): string {
  return `
    <label>
      ${t(lang, 'fontFamily')}
      <select id="${fontFamilyId}">
        <option value="Segoe UI, sans-serif" ${fontFamily === 'Segoe UI, sans-serif' ? 'selected' : ''}>Segoe UI</option>
        <option value="Arial, sans-serif" ${fontFamily === 'Arial, sans-serif' ? 'selected' : ''}>Arial</option>
        <option value="Verdana, sans-serif" ${fontFamily === 'Verdana, sans-serif' ? 'selected' : ''}>Verdana</option>
        <option value="Georgia, serif" ${fontFamily === 'Georgia, serif' ? 'selected' : ''}>Georgia</option>
      </select>
    </label>
    <label>
      ${t(lang, 'labelSize')}
      <input id="${fontLabelsId}" type="number" min="8" max="${labelFontMax}" value="${labelFontSize}">
    </label>
    <label>
      ${t(lang, 'labelMaxLines')}
      <input id="${labelMaxLinesId}" type="number" min="1" max="${labelMaxLinesMax}" value="${labelMaxLines}">
    </label>
    ${extraControls}
  `.trim();
}

export function renderCommonCanvasControls({
  lang,
  marginTopId,
  marginRightId,
  marginBottomId,
  marginLeftId,
  chartWidthId,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  chartWidth,
  includeChartMinHeight = false,
  chartMinHeightId = '',
  chartMinHeight = 0,
  extraControls = ''
}: CanvasControlsOptions): string {
  return `
    <label>
      ${t(lang, 'marginTop')}
      <input id="${marginTopId}" type="number" min="20" max="240" value="${marginTop}">
    </label>
    <label>
      ${t(lang, 'marginBottom')}
      <input id="${marginBottomId}" type="number" min="20" max="260" value="${marginBottom}">
    </label>
    <label>
      ${t(lang, 'marginLeft')}
      <input id="${marginLeftId}" type="number" min="80" max="480" value="${marginLeft}">
    </label>
    <label>
      ${t(lang, 'marginRight')}
      <input id="${marginRightId}" type="number" min="20" max="320" value="${marginRight}">
    </label>
    <label>
      ${t(lang, 'chartWidth')}
      <input id="${chartWidthId}" type="number" min="700" max="2200" value="${chartWidth}">
    </label>
    ${includeChartMinHeight ? `
      <label>
        ${t(lang, 'chartMinHeight')}
        <input id="${chartMinHeightId}" type="number" min="320" max="2400" value="${chartMinHeight}">
      </label>
    ` : ''}
    ${extraControls}
  `.trim();
}

export function renderCommonColorControls({
  lang,
  paletteIdId,
  bgColorId,
  transparentBgId,
  gridColorId,
  axisColorId,
  paletteId,
  canvasBackground,
  canvasTransparent,
  gridColor,
  axisColor,
  extraControls = ''
}: ColorControlsOptions): string {
  return `
    <label>
      ${t(lang, 'sharedPalette')}
      <select id="${paletteIdId}">
        <option value="blue_orange" ${paletteId === 'blue_orange' ? 'selected' : ''}>Blue/Orange</option>
        <option value="red_green" ${paletteId === 'red_green' ? 'selected' : ''}>Red/Green</option>
        <option value="purple_yellow" ${paletteId === 'purple_yellow' ? 'selected' : ''}>Purple/Yellow</option>
        <option value="spectral" ${paletteId === 'spectral' ? 'selected' : ''}>Spectral</option>
        <option value="viridis" ${paletteId === 'viridis' ? 'selected' : ''}>Viridis</option>
        <option value="cool" ${paletteId === 'cool' ? 'selected' : ''}>Cool</option>
        <option value="warm" ${paletteId === 'warm' ? 'selected' : ''}>Warm</option>
        <option value="earth" ${paletteId === 'earth' ? 'selected' : ''}>Earth</option>
      </select>
    </label>
    <label>
      ${t(lang, 'background')}
      <input id="${bgColorId}" type="color" value="${canvasBackground}">
    </label>
    <label class="config-check">
      <input id="${transparentBgId}" type="checkbox" ${canvasTransparent ? 'checked' : ''}>
      <span>${t(lang, 'transparentBackground')}</span>
    </label>
    <label>
      ${t(lang, 'gridColor')}
      <input id="${gridColorId}" type="color" value="${gridColor}">
    </label>
    <label>
      ${t(lang, 'axisColor')}
      <input id="${axisColorId}" type="color" value="${axisColor}">
    </label>
    ${extraControls}
  `.trim();
}

export function renderCommonAxesGridControls({
  lang,
  showGridId,
  gridDashedId,
  gridVerticalId,
  gridHorizontalId,
  showGridBorderId,
  gridWidthId,
  showAxisLabelsId,
  axisWidthId,
  showGrid,
  gridDashed,
  gridVertical,
  gridHorizontal,
  showGridBorder,
  gridWidth,
  showAxisLabels,
  axisWidth,
  extraControls = ''
}: AxesGridControlsOptions): string {
  return `
    <label class="config-check">
      <input id="${showGridId}" type="checkbox" ${showGrid ? 'checked' : ''}>
      <span>${t(lang, 'showGrid')}</span>
    </label>
    <label class="config-check">
      <input id="${gridDashedId}" type="checkbox" ${gridDashed ? 'checked' : ''}>
      <span>${t(lang, 'gridDashed')}</span>
    </label>
    <label class="config-check">
      <input id="${gridVerticalId}" type="checkbox" ${gridVertical ? 'checked' : ''}>
      <span>${t(lang, 'gridVertical')}</span>
    </label>
    <label class="config-check">
      <input id="${gridHorizontalId}" type="checkbox" ${gridHorizontal ? 'checked' : ''}>
      <span>${t(lang, 'gridHorizontal')}</span>
    </label>
    <label class="config-check">
      <input id="${showGridBorderId}" type="checkbox" ${showGridBorder ? 'checked' : ''}>
      <span>${t(lang, 'showGridBorder')}</span>
    </label>
    <label>
      ${t(lang, 'gridWidth')}
      <input id="${gridWidthId}" type="number" min="1" max="5" value="${gridWidth}">
    </label>
    <label class="config-check">
      <input id="${showAxisLabelsId}" type="checkbox" ${showAxisLabels ? 'checked' : ''}>
      <span>${t(lang, 'showAxisLabels')}</span>
    </label>
    <label>
      ${t(lang, 'axisWidth')}
      <input id="${axisWidthId}" type="number" min="1" max="5" value="${axisWidth}">
    </label>
    ${extraControls}
  `.trim();
}
