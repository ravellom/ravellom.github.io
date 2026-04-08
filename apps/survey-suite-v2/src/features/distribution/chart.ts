import type { Dataset } from '../../shared/types/state';

type DistChartType = 'boxplot' | 'violin' | 'boxviolin' | 'raincloud' | 'errorbar';
type PaletteId = 'blue_orange' | 'red_green' | 'purple_yellow' | 'spectral' | 'viridis' | 'warm' | 'cool' | 'earth';

interface DistCfg {
  chartType: DistChartType;
  paletteId?: PaletteId;
  numericColumn: string;
  categoryColumn: string;
  chartWidth: number;
  chartMinHeight: number;
  marginTop: number;
  marginRight: number;
  marginLeft: number;
  marginBottom: number;
  fontFamily: string;
  fontSizeLabels: number;
  backgroundColor: string;
  transparentBackground: boolean;
  showGrid: boolean;
  gridDashed: boolean;
  gridVertical: boolean;
  gridHorizontal: boolean;
  showGridBorder: boolean;
  gridColor: string;
  gridWidth: number;
  axisColor: string;
  axisWidth: number;
  showAxisLabels: boolean;
  labelMaxLines: number;
  showOutliers: boolean;
  topNGroups: number;
  groupOrder: 'original' | 'alphabetical' | 'median_desc' | 'median_asc';
  orientation: 'horizontal' | 'vertical';
  groupThickness: number;
  groupGap: number;
  whiskerMultiplier: number;
  showSampleSizeLabel: boolean;
  showJitter: boolean;
  jitterSize: number;
  jitterAlpha: number;
  outlierSize: number;
  outlierColor: string;
  showGroupMarker: boolean;
  groupMetric: 'median' | 'mean';
  groupMarkerStyle: 'point' | 'square' | 'line';
  groupMarkerColor: string;
  groupMarkerSize: number;
  violinBandwidthFactor?: number;
  violinSteps?: number;
  violinOpacity?: number;
  raincloudOffset?: number;
  raincloudBoxHeightRatio?: number;
  errorMetric?: 'sd' | 'se' | 'ci95' | 'minmax';
  errorCiLevel?: number;
  showMeanLine: boolean;
  meanLineColor: string;
  meanLineWidth: number;
  meanLineDash: number;
  meanLineGap: number;
  showMeanLabel: boolean;
  showStatsPanel: boolean;
  statsFields: {
    n: boolean;
    mean: boolean;
    median: boolean;
    sd: boolean;
    iqr: boolean;
  };
  statsPosition: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  annotationText: string;
  annotationX: number;
  annotationY: number;
  annotationColor: string;
  annotationSize: number;
  showHypothesisPanel: boolean;
  hypothesisResult?: {
    test: 'welch_t' | 'mann_whitney' | 'anova' | 'kruskal_wallis';
    statLabel: string;
    stat: number;
    df?: number;
    df1?: number;
    df2?: number;
    p: number;
    effectLabel: string;
    effect: number;
  } | null;
  overallStats?: {
    n: number;
    mean: number;
    median: number;
    sd: number;
    iqr: number;
  } | null;
}

interface SummaryStats {
  min: number;
  q1: number;
  median: number;
  mean: number;
  q3: number;
  max: number;
  outliers: number[];
  n: number;
}

interface GroupEntry {
  label: string;
  values: number[];
  summary: SummaryStats;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const parsed = Number.parseInt(value, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255
  };
}

function mixColor(a: string, b: string, amount: number): string {
  const left = hexToRgb(a);
  const right = hexToRgb(b);
  const mix = clamp(amount, 0, 1, 0.5);
  const toHex = (value: number) => Math.round(value).toString(16).padStart(2, '0');
  return `#${toHex(left.r + (right.r - left.r) * mix)}${toHex(left.g + (right.g - left.g) * mix)}${toHex(left.b + (right.b - left.b) * mix)}`;
}

function getPalette(id: PaletteId | undefined, count: number): string[] {
  const schemes: Record<PaletteId, string[]> = {
    blue_orange: ['#d73027', '#f46d43', '#fdae61', '#fee090', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'],
    red_green: ['#d7191c', '#fdae61', '#ffffbf', '#a6d96a', '#1a9641'],
    purple_yellow: ['#7b3294', '#c2a5cf', '#f7f7f7', '#a6dba0', '#008837'],
    spectral: ['#d53e4f', '#fc8d59', '#fee08b', '#e6f598', '#99d594', '#3288bd'],
    viridis: ['#440154', '#31688e', '#35b779', '#fde724'],
    warm: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#8c2d04'],
    cool: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594'],
    earth: ['#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#c7eae5', '#80cdc1', '#35978f', '#01665e']
  };
  const base = schemes[id ?? 'blue_orange'] ?? schemes.blue_orange;
  if (count <= base.length) return base.slice(0, Math.max(1, count));
  return Array.from({ length: count }, (_, index) => base[index % base.length]);
}

function getGroupColors(cfg: DistCfg, index: number, total: number) {
  const palette = getPalette(cfg.paletteId, Math.max(3, total));
  const base = palette[index % palette.length];
  return {
    fill: mixColor(base, '#ffffff', 0.35),
    fillSoft: mixColor(base, '#ffffff', 0.55),
    stroke: mixColor(base, '#0f172a', 0.22),
    accent: mixColor(base, '#0f172a', 0.12)
  };
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function drawStatsBox(
  ctx: CanvasRenderingContext2D,
  cfg: DistCfg,
  chartLeft: number,
  chartRight: number,
  chartTop: number,
  chartBottom: number
): void {
  if (!cfg.showStatsPanel || !cfg.overallStats || !Number.isFinite(cfg.overallStats.n) || cfg.overallStats.n <= 0) return;

  const fields = cfg.statsFields || {};
  const lines: string[] = [];
  if (fields.n !== false) lines.push(`n = ${cfg.overallStats.n}`);
  if (fields.mean !== false && Number.isFinite(cfg.overallStats.mean)) lines.push(`mean = ${cfg.overallStats.mean.toFixed(3)}`);
  if (fields.median !== false && Number.isFinite(cfg.overallStats.median)) lines.push(`median = ${cfg.overallStats.median.toFixed(3)}`);
  if (fields.sd !== false && Number.isFinite(cfg.overallStats.sd)) lines.push(`sd = ${cfg.overallStats.sd.toFixed(3)}`);
  if (fields.iqr !== false && Number.isFinite(cfg.overallStats.iqr)) lines.push(`iqr = ${cfg.overallStats.iqr.toFixed(3)}`);
  if (!lines.length) return;

  const pad = 8;
  const lineHeight = Math.max(14, cfg.fontSizeLabels + 2);
  ctx.save();
  ctx.font = `${cfg.fontSizeLabels}px ${cfg.fontFamily}`;
  const textWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const boxWidth = textWidth + pad * 2;
  const boxHeight = lines.length * lineHeight + pad * 2;
  const offset = 10;
  let x = chartRight - boxWidth - offset;
  let y = chartTop + offset;

  if (cfg.statsPosition === 'top_left') {
    x = chartLeft + offset;
  } else if (cfg.statsPosition === 'bottom_left') {
    x = chartLeft + offset;
    y = chartBottom - boxHeight - offset;
  } else if (cfg.statsPosition === 'bottom_right') {
    y = chartBottom - boxHeight - offset;
  }

  x = clamp(x, chartLeft, chartRight - boxWidth, chartLeft + offset);
  y = clamp(y, chartTop, chartBottom - boxHeight, chartTop + offset);

  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, boxWidth, boxHeight);
  ctx.strokeRect(x, y, boxWidth, boxHeight);

  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  lines.forEach((line, index) => {
    ctx.fillText(line, x + pad, y + pad + index * lineHeight);
  });
  ctx.restore();
}

function drawHypothesisBox(
  ctx: CanvasRenderingContext2D,
  cfg: DistCfg,
  chartLeft: number,
  chartRight: number,
  chartTop: number,
  chartBottom: number
): void {
  if (!cfg.showHypothesisPanel || !cfg.hypothesisResult) return;
  const testNameMap: Record<string, string> = {
    welch_t: 'Welch t-test',
    mann_whitney: 'Mann-Whitney U',
    anova: 'ANOVA',
    kruskal_wallis: 'Kruskal-Wallis'
  };
  const h = cfg.hypothesisResult;
  const lines: string[] = [];
  if (h.test) lines.push(`test = ${testNameMap[h.test] || h.test}`);
  if (h.statLabel && Number.isFinite(h.stat)) lines.push(`${h.statLabel} = ${h.stat.toFixed(3)}`);
  if (Number.isFinite(h.df ?? NaN) && !Number.isFinite(h.df1 ?? NaN)) lines.push(`df = ${(h.df as number).toFixed(1)}`);
  if (Number.isFinite(h.df1 ?? NaN) && Number.isFinite(h.df2 ?? NaN)) lines.push(`df = ${(h.df1 as number).toFixed(0)}, ${(h.df2 as number).toFixed(0)}`);
  if (Number.isFinite(h.p)) lines.push(`p = ${h.p < 0.001 ? '< 0.001' : h.p.toFixed(4)}`);
  if (h.effectLabel && Number.isFinite(h.effect)) lines.push(`${h.effectLabel} = ${h.effect.toFixed(3)}`);
  if (!lines.length) return;

  const pad = 8;
  const lineHeight = Math.max(14, cfg.fontSizeLabels + 2);
  ctx.save();
  ctx.font = `${cfg.fontSizeLabels}px ${cfg.fontFamily}`;
  const textWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const boxWidth = textWidth + pad * 2;
  const boxHeight = lines.length * lineHeight + pad * 2;
  const offset = 10;
  let x = chartLeft + offset;
  let y = chartTop + offset;
  if (cfg.statsPosition === 'top_left') {
    x = chartRight - boxWidth - offset;
  } else if (cfg.statsPosition === 'bottom_left') {
    x = chartRight - boxWidth - offset;
    y = chartBottom - boxHeight - offset;
  } else if (cfg.statsPosition === 'bottom_right') {
    y = chartBottom - boxHeight - offset;
  }

  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, boxWidth, boxHeight);
  ctx.strokeRect(x, y, boxWidth, boxHeight);
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  lines.forEach((line, index) => {
    ctx.fillText(line, x + pad, y + pad + index * lineHeight);
  });
  ctx.restore();
}

function drawCustomAnnotation(
  ctx: CanvasRenderingContext2D,
  cfg: DistCfg,
  chartLeft: number,
  chartRight: number,
  chartTop: number,
  chartBottom: number
): void {
  const text = String(cfg.annotationText || '').trim();
  if (!text) return;
  const xPct = clamp(cfg.annotationX, 0, 100, 80);
  const yPct = clamp(cfg.annotationY, 0, 100, 12);
  const x = chartLeft + ((chartRight - chartLeft) * xPct) / 100;
  const y = chartTop + ((chartBottom - chartTop) * yPct) / 100;
  ctx.save();
  ctx.fillStyle = cfg.annotationColor || '#111827';
  ctx.font = `${Math.round(clamp(cfg.annotationSize, 10, 40, 13))}px ${cfg.fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawMeanLine(
  ctx: CanvasRenderingContext2D,
  cfg: DistCfg,
  meanValue: number,
  chartLeft: number,
  chartRight: number,
  chartTop: number,
  chartBottom: number,
  scaleX: (value: number) => number,
  scaleY: (value: number) => number
): void {
  if (!cfg.showMeanLine || !Number.isFinite(meanValue)) return;
  const dash = clamp(cfg.meanLineDash, 2, 40, 8);
  const gap = clamp(cfg.meanLineGap, 2, 40, 6);
  const lineWidth = clamp(cfg.meanLineWidth, 1, 8, 1.6);
  const color = cfg.meanLineColor || '#0f172a';

  ctx.save();
  ctx.setLineDash([dash, gap]);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  if (cfg.orientation === 'vertical') {
    const y = scaleY(meanValue);
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();
    if (cfg.showMeanLabel) {
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = `${cfg.fontSizeLabels}px ${cfg.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`mean = ${meanValue.toFixed(3)}`, chartLeft + 6, y - 4);
    }
    ctx.restore();
    return;
  }

  const x = scaleX(meanValue);
  ctx.moveTo(x, chartTop);
  ctx.lineTo(x, chartBottom);
  ctx.stroke();
  if (cfg.showMeanLabel) {
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.font = `${cfg.fontSizeLabels}px ${cfg.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`mean = ${meanValue.toFixed(3)}`, x + 6, chartTop + 6);
  }
  ctx.restore();
}

function drawGridAndAxes(
  ctx: CanvasRenderingContext2D,
  chartLeft: number,
  chartRight: number,
  chartTop: number,
  chartBottom: number,
  minV: number,
  maxV: number,
  cfg: DistCfg
): void {
  if (!cfg.showGrid && !cfg.showGridBorder && !cfg.showAxisLabels) return;

  const steps = 5;
  ctx.save();

  if (cfg.showGrid) {
    ctx.strokeStyle = cfg.gridColor;
    ctx.lineWidth = Math.max(1, cfg.gridWidth);
    ctx.setLineDash(cfg.gridDashed ? [4, 4] : []);

    for (let i = 0; i <= steps; i += 1) {
      const ratio = i / steps;
      const x = chartLeft + (chartRight - chartLeft) * ratio;
      const y = chartBottom - (chartBottom - chartTop) * ratio;

      if (cfg.gridVertical) {
        ctx.beginPath();
        ctx.moveTo(x, chartTop);
        ctx.lineTo(x, chartBottom);
        ctx.stroke();
      }
      if (cfg.gridHorizontal) {
        ctx.beginPath();
        ctx.moveTo(chartLeft, y);
        ctx.lineTo(chartRight, y);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
  }

  if (cfg.showGridBorder) {
    ctx.strokeStyle = cfg.axisColor;
    ctx.lineWidth = Math.max(1, cfg.axisWidth);
    ctx.strokeRect(chartLeft, chartTop, chartRight - chartLeft, chartBottom - chartTop);
  }

  if (cfg.showAxisLabels) {
    ctx.fillStyle = cfg.axisColor;
    ctx.font = `${Math.max(10, cfg.fontSizeLabels - 1)}px ${cfg.fontFamily}`;
    ctx.textAlign = 'center';
    for (let i = 0; i <= steps; i += 1) {
      const ratio = i / steps;
      const value = minV + (maxV - minV) * ratio;
      const x = chartLeft + (chartRight - chartLeft) * ratio;
      ctx.fillText(value.toFixed(1), x, chartBottom + 18);
    }
    ctx.textAlign = 'start';
  }

  ctx.restore();
}

function ellipsizeToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (!text) return '';
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = '...';
  let trimmed = text.trim();
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}${ellipsis}`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1).trimEnd();
  }
  return `${trimmed}${ellipsis}`;
}

function wrapLabel(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const safeMaxLines = Math.max(1, maxLines);
  const clean = String(text ?? '').trim();
  if (!clean) return [''];

  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      return;
    }
    if (current) {
      lines.push(current);
      current = word;
      return;
    }
    lines.push(ellipsizeToWidth(ctx, word, maxWidth));
    current = '';
  });

  if (current) lines.push(current);
  if (lines.length <= safeMaxLines) return lines;

  const visible = lines.slice(0, safeMaxLines);
  visible[safeMaxLines - 1] = ellipsizeToWidth(ctx, visible[safeMaxLines - 1], maxWidth);
  return visible;
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function summarize(values: number[], whiskerMultiplier: number): SummaryStats {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const med = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const iqr = q3 - q1;
  const lf = q1 - whiskerMultiplier * iqr;
  const uf = q3 + whiskerMultiplier * iqr;
  const inliers = sorted.filter((v) => v >= lf && v <= uf);
  const outliers = sorted.filter((v) => v < lf || v > uf);
  return {
    min: inliers[0] ?? sorted[0],
    q1,
    median: med,
    mean,
    q3,
    max: inliers[inliers.length - 1] ?? sorted[sorted.length - 1],
    outliers,
    n: sorted.length
  };
}

function computeError(values: number[], summary: SummaryStats, mode: DistCfg['errorMetric'], ciLevel = 95) {
  const n = summary.n;
  const mean = summary.mean;
  const sd = values.length > 1
    ? Math.sqrt(values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1))
    : 0;
  const se = n > 0 ? sd / Math.sqrt(n) : 0;
  const z = ciLevel >= 99 ? 2.576 : 1.96;
  if (mode === 'se') return { lower: mean - se, upper: mean + se, mean };
  if (mode === 'ci95') return { lower: mean - z * se, upper: mean + z * se, mean };
  if (mode === 'minmax') return { lower: summary.min, upper: summary.max, mean };
  return { lower: mean - sd, upper: mean + sd, mean };
}

function orderedEntries(groups: Array<[string, number[]]>, groupOrder: DistCfg['groupOrder'], topN: number, whiskerMultiplier: number): Array<[string, number[]]> {
  const entries = groups.filter(([, vals]) => vals.length > 1);
  if (groupOrder === 'alphabetical') entries.sort((a, b) => a[0].localeCompare(b[0]));
  if (groupOrder === 'median_desc') entries.sort((a, b) => summarize(b[1], whiskerMultiplier).median - summarize(a[1], whiskerMultiplier).median);
  if (groupOrder === 'median_asc') entries.sort((a, b) => summarize(a[1], whiskerMultiplier).median - summarize(b[1], whiskerMultiplier).median);
  return entries.slice(0, Math.max(1, topN));
}

function silvermanBandwidth(values: number[], range: number): number {
  const n = values.length;
  if (n < 2) return Math.max(range / 25, 0.1);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / Math.max(1, n - 1);
  const sigma = Math.sqrt(variance);
  if (!Number.isFinite(sigma) || sigma <= 0) return Math.max(range / 25, 0.1);
  return 1.06 * sigma * Math.pow(n, -0.2);
}

function kdeEstimate(values: number[], domain: number[], bandwidth: number): Array<[number, number]> {
  const inv = 1 / (values.length * bandwidth * Math.sqrt(2 * Math.PI));
  return domain.map((x) => {
    let sum = 0;
    values.forEach((value) => {
      const z = (x - value) / bandwidth;
      sum += Math.exp(-0.5 * z * z);
    });
    return [x, inv * sum];
  });
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  metric: number,
  xOf: (v: number) => number,
  yOf: (v: number) => number,
  cfg: DistCfg
): void {
  ctx.strokeStyle = cfg.groupMarkerColor;
  ctx.fillStyle = cfg.groupMarkerColor;
  ctx.lineWidth = 1.6;
  if (cfg.orientation === 'horizontal') {
    const mx = xOf(metric);
    if (cfg.groupMarkerStyle === 'line') {
      ctx.beginPath();
      ctx.moveTo(mx, y - cfg.groupMarkerSize);
      ctx.lineTo(mx, y + cfg.groupMarkerSize);
      ctx.stroke();
      return;
    }
    if (cfg.groupMarkerStyle === 'square') {
      const s = cfg.groupMarkerSize;
      ctx.fillRect(mx - s / 2, y - s / 2, s, s);
      return;
    }
    ctx.beginPath();
    ctx.arc(mx, y, cfg.groupMarkerSize / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const my = yOf(metric);
  if (cfg.groupMarkerStyle === 'line') {
    ctx.beginPath();
    ctx.moveTo(x - cfg.groupMarkerSize, my);
    ctx.lineTo(x + cfg.groupMarkerSize, my);
    ctx.stroke();
    return;
  }
  if (cfg.groupMarkerStyle === 'square') {
    const s = cfg.groupMarkerSize;
    ctx.fillRect(x - s / 2, my - s / 2, s, s);
    return;
  }
  ctx.beginPath();
  ctx.arc(x, my, cfg.groupMarkerSize / 2, 0, Math.PI * 2);
  ctx.fill();
}

function buildGroups(dataset: Dataset | null, cfg: DistCfg): GroupEntry[] {
  const groups = new Map<string, number[]>();
  if (dataset) {
    dataset.records.forEach((row) => {
      const raw = row[cfg.numericColumn];
      const n = typeof raw === 'string' ? Number(raw.trim()) : Number(raw);
      if (!Number.isFinite(n)) return;
      const g = cfg.categoryColumn ? String(row[cfg.categoryColumn] ?? '(empty)').trim() || '(empty)' : cfg.numericColumn;
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)?.push(n);
    });
  }

  return orderedEntries(Array.from(groups.entries()), cfg.groupOrder, cfg.topNGroups, Math.max(0.5, cfg.whiskerMultiplier))
    .map(([label, values]) => ({ label, values, summary: summarize(values, Math.max(0.5, cfg.whiskerMultiplier)) }));
}

function drawHorizontalLabels(
  ctx: CanvasRenderingContext2D,
  groups: GroupEntry[],
  rowBlockHeight: number,
  gap: number,
  marginLeft: number,
  marginTop: number,
  labelFontSize: number,
  labelLineHeight: number,
  cfg: DistCfg
): Map<string, { y: number; boxTop: number; lines: string[] }> {
  const horizontalLabelWidth = Math.max(96, marginLeft - 28);
  const map = new Map<string, { y: number; boxTop: number; lines: string[] }>();
  groups.forEach((group, idx) => {
    const y = marginTop + idx * (rowBlockHeight + gap);
    const lines = wrapLabel(ctx, group.label, horizontalLabelWidth, cfg.labelMaxLines);
    const labelBlockHeight = lines.length * labelLineHeight;
    const rowCenter = y + rowBlockHeight / 2;
    const labelStartY = rowCenter - labelBlockHeight / 2 + labelFontSize * 0.85;
    ctx.fillStyle = '#334155';
    ctx.font = `${labelFontSize}px ${cfg.fontFamily}`;
    lines.forEach((line, lineIdx) => ctx.fillText(line, 12, labelStartY + lineIdx * labelLineHeight));
    if (cfg.showSampleSizeLabel) {
      ctx.fillStyle = '#64748b';
      ctx.fillText(`n=${group.summary.n}`, 12, labelStartY + labelBlockHeight + labelLineHeight * 0.85);
    }
    const boxTop = y + (rowBlockHeight - cfg.groupThickness) / 2;
    map.set(group.label, { y: rowCenter, boxTop, lines });
  });
  return map;
}

export function renderDistributionCanvas(canvas: HTMLCanvasElement, dataset: Dataset | null, cfg: DistCfg): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = Math.max(760, cfg.chartWidth);
  const margin = {
    top: Math.max(24, cfg.marginTop),
    right: Math.max(24, cfg.marginRight),
    bottom: Math.max(48, cfg.marginBottom),
    left: Math.max(160, cfg.marginLeft)
  };
  const labelFontSize = Math.max(10, cfg.fontSizeLabels);
  const labelLineHeight = Math.round(labelFontSize * 1.2);
  ctx.font = `${labelFontSize}px ${cfg.fontFamily}`;

  const groups = buildGroups(dataset, cfg);
  const maxHorizontalLines = Math.max(
    1,
    ...groups.map((group) => wrapLabel(ctx, group.label, Math.max(96, margin.left - 28), cfg.labelMaxLines).length)
  );
  const rowH = Math.max(16, cfg.groupThickness);
  const gap = Math.max(4, cfg.groupGap);
  const sampleLabelExtra = cfg.showSampleSizeLabel ? labelLineHeight : 0;
  const rowBlockHeight = Math.max(rowH, maxHorizontalLines * labelLineHeight + sampleLabelExtra);
  const height = Math.max(cfg.chartMinHeight, margin.top + margin.bottom + groups.length * rowBlockHeight + Math.max(0, groups.length - 1) * gap);

  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  if (!cfg.transparentBackground) {
    ctx.fillStyle = cfg.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = '#0f172a';
  ctx.font = `600 16px ${cfg.fontFamily}`;
  ctx.fillText(`Distribution (${cfg.chartType})`, 16, 22);

  if (!groups.length) {
    ctx.fillStyle = '#64748b';
    ctx.font = `13px ${cfg.fontFamily}`;
    ctx.fillText('No hay suficientes datos numericos para renderizar.', 16, 52);
    return;
  }

  const allValues = groups.flatMap((group) => group.values);
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const safeRange = maxV - minV || 1;
  const overallMean = cfg.overallStats?.mean ?? (allValues.reduce((acc, item) => acc + item, 0) / allValues.length);
  const chartLeft = margin.left;
  const chartRight = width - margin.right;
  const chartTop = margin.top;
  const chartBottom = height - margin.bottom;
  const chartWidth = chartRight - chartLeft;
  drawGridAndAxes(ctx, chartLeft, chartRight, chartTop, chartBottom, minV, maxV, cfg);

  if (cfg.orientation === 'horizontal') {
    const xOf = (value: number) => chartLeft + ((value - minV) / safeRange) * chartWidth;
    const layoutMap = drawHorizontalLabels(ctx, groups, rowBlockHeight, gap, margin.left, margin.top, labelFontSize, labelLineHeight, cfg);

    groups.forEach((group, idx) => {
      const layout = layoutMap.get(group.label);
      if (!layout) return;
      const yMid = layout.y;
      const boxTop = layout.boxTop;
      renderHorizontalGroup(ctx, group, xOf, yMid, boxTop, rowH, cfg, idx, groups.length);
    });
    drawMeanLine(ctx, cfg, overallMean, chartLeft, chartRight, chartTop, chartBottom, xOf, () => chartBottom);
    drawStatsBox(ctx, cfg, chartLeft, chartRight, chartTop, chartBottom);
    drawHypothesisBox(ctx, cfg, chartLeft, chartRight, chartTop, chartBottom);
    drawCustomAnnotation(ctx, cfg, chartLeft, chartRight, chartTop, chartBottom);
    return;
  }

  renderVerticalFallback(ctx, groups, width, height, margin, labelFontSize, labelLineHeight, rowH, cfg, minV, safeRange);
  const yOf = (value: number) => chartTop + (chartBottom - chartTop) - ((value - minV) / safeRange) * (chartBottom - chartTop);
  drawMeanLine(ctx, cfg, overallMean, chartLeft, chartRight, chartTop, chartBottom, () => chartLeft, yOf);
  drawStatsBox(ctx, cfg, chartLeft, chartRight, chartTop, chartBottom);
  drawHypothesisBox(ctx, cfg, chartLeft, chartRight, chartTop, chartBottom);
  drawCustomAnnotation(ctx, cfg, chartLeft, chartRight, chartTop, chartBottom);
}

function renderHorizontalGroup(
  ctx: CanvasRenderingContext2D,
  group: GroupEntry,
  xOf: (value: number) => number,
  yMid: number,
  boxTop: number,
  rowH: number,
  cfg: DistCfg,
  groupIndex: number,
  groupCount: number
): void {
  const s = group.summary;
  const colors = getGroupColors(cfg, groupIndex, groupCount);
  const xMin = xOf(s.min);
  const xQ1 = xOf(s.q1);
  const xMed = xOf(s.median);
  const xQ3 = xOf(s.q3);
  const xMax = xOf(s.max);

  if (cfg.chartType === 'violin' || cfg.chartType === 'boxviolin' || cfg.chartType === 'raincloud') {
    const steps = Math.max(40, cfg.violinSteps ?? 70);
    const bandwidth = silvermanBandwidth(group.values, s.max - s.min || 1) * Math.max(0.4, cfg.violinBandwidthFactor ?? 1);
    const domain = Array.from({ length: steps }, (_, idx) => s.min + ((s.max - s.min || 1) * idx) / Math.max(1, steps - 1));
    const density = kdeEstimate(group.values, domain, bandwidth);
    const maxDensity = Math.max(...density.map((item) => item[1]), 0.0001);
    const halfWidth = Math.max(8, rowH / 2 - 2);
    const offset = cfg.chartType === 'raincloud' ? Math.max(4, cfg.raincloudOffset ?? 6) : 0;
    const centerY = cfg.chartType === 'raincloud' ? yMid - halfWidth * 0.55 - offset : yMid;
    const topPath = density.map(([value, dens]) => ({ x: xOf(value), y: centerY - (dens / maxDensity) * halfWidth }));
    const bottomPath = density.slice().reverse().map(([value, dens]) => ({ x: xOf(value), y: centerY + (dens / maxDensity) * halfWidth }));
    ctx.beginPath();
    ctx.moveTo(topPath[0].x, topPath[0].y);
    topPath.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    bottomPath.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.fillStyle = colors.fill;
    ctx.globalAlpha = Math.min(0.9, Math.max(0.15, cfg.violinOpacity ?? 0.55));
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  if (cfg.chartType === 'boxplot' || cfg.chartType === 'boxviolin' || cfg.chartType === 'raincloud') {
    const localRowH = cfg.chartType === 'raincloud' ? Math.max(10, rowH * Math.max(0.2, Math.min(0.8, cfg.raincloudBoxHeightRatio ?? 0.35))) : rowH;
    const localBoxTop = cfg.chartType === 'raincloud' ? yMid + Math.max(3, rowH * 0.1) : boxTop;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(xMin, yMid);
    ctx.lineTo(xQ1, yMid);
    ctx.moveTo(xQ3, yMid);
    ctx.lineTo(xMax, yMid);
    ctx.stroke();
    ctx.fillStyle = colors.fillSoft;
    ctx.fillRect(xQ1, localBoxTop + 4, Math.max(1, xQ3 - xQ1), Math.max(4, localRowH - 8));
    ctx.strokeStyle = colors.stroke;
    ctx.strokeRect(xQ1, localBoxTop + 4, Math.max(1, xQ3 - xQ1), Math.max(4, localRowH - 8));
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(xMed, localBoxTop + 4);
    ctx.lineTo(xMed, localBoxTop + Math.max(4, localRowH - 4));
    ctx.stroke();
  }

  if (cfg.chartType === 'errorbar') {
    const err = computeError(group.values, s, cfg.errorMetric ?? 'sd', cfg.errorCiLevel ?? 95);
    const xMean = xOf(err.mean);
    const xl = xOf(err.lower);
    const xu = xOf(err.upper);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(xl, yMid);
    ctx.lineTo(xu, yMid);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(xl, yMid - 8);
    ctx.lineTo(xl, yMid + 8);
    ctx.moveTo(xu, yMid - 8);
    ctx.lineTo(xu, yMid + 8);
    ctx.stroke();
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(xMean, yMid, Math.max(4, rowH * 0.14), 0, Math.PI * 2);
    ctx.fill();
  }

  if (cfg.showOutliers && (cfg.chartType === 'boxplot' || cfg.chartType === 'boxviolin' || cfg.chartType === 'violin' || cfg.chartType === 'raincloud')) {
    ctx.fillStyle = colors.stroke;
    s.outliers.forEach((outlier) => {
      ctx.beginPath();
      ctx.arc(xOf(outlier), yMid, cfg.outlierSize, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (cfg.showJitter && (cfg.chartType === 'violin' || cfg.chartType === 'boxviolin' || cfg.chartType === 'raincloud')) {
    ctx.fillStyle = cfg.outlierColor;
    ctx.globalAlpha = Math.min(1, Math.max(0.05, cfg.jitterAlpha));
    const jitterCenterY = cfg.chartType === 'raincloud' ? yMid + rowH * 0.28 : yMid;
    group.values.forEach((value) => {
      const dy = (Math.random() - 0.5) * (rowH - 8);
      ctx.beginPath();
      ctx.arc(xOf(value), jitterCenterY + dy, cfg.jitterSize, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  if (cfg.showGroupMarker && cfg.chartType !== 'errorbar') {
    const metric = cfg.groupMetric === 'mean' ? s.mean : s.median;
    drawMarker(ctx, xMed, yMid, metric, xOf, () => yMid, cfg);
  }
}

function renderVerticalFallback(
  ctx: CanvasRenderingContext2D,
  groups: GroupEntry[],
  width: number,
  height: number,
  margin: { top: number; right: number; bottom: number; left: number },
  labelFontSize: number,
  labelLineHeight: number,
  rowH: number,
  cfg: DistCfg,
  minV: number,
  safeRange: number
): void {
  const xBandStart = margin.left;
  const xBandEnd = width - margin.right;
  const bandW = Math.max(24, (xBandEnd - xBandStart) / groups.length);
  const labelWidth = Math.max(48, bandW - 10);
  const maxVerticalLines = Math.max(
    1,
    ...groups.map((group) => wrapLabel(ctx, group.label, labelWidth, cfg.labelMaxLines).length)
  );
  const extraBottom = maxVerticalLines * labelLineHeight + (cfg.showSampleSizeLabel ? labelLineHeight : 0) + 16;
  const chartBottom = height - Math.max(margin.bottom, extraBottom);
  const plotH = chartBottom - margin.top;
  const yOf = (value: number) => margin.top + plotH - ((value - minV) / safeRange) * plotH;

  groups.forEach((group, idx) => {
    const colors = getGroupColors(cfg, idx, groups.length);
    const xCenter = xBandStart + bandW * idx + bandW / 2;
    const lines = wrapLabel(ctx, group.label, labelWidth, cfg.labelMaxLines);
    ctx.fillStyle = '#334155';
    ctx.font = `${labelFontSize}px ${cfg.fontFamily}`;
    ctx.textAlign = 'center';
    lines.forEach((line, lineIdx) => ctx.fillText(line, xCenter, chartBottom + labelFontSize + lineIdx * labelLineHeight));
    if (cfg.showSampleSizeLabel) {
      ctx.fillStyle = '#64748b';
      ctx.fillText(`n=${group.summary.n}`, xCenter, chartBottom + labelFontSize + lines.length * labelLineHeight + labelFontSize * 0.8);
    }

    const boxW = Math.min(bandW * 0.56, rowH);
    const s = group.summary;
    if (cfg.chartType === 'errorbar') {
      const err = computeError(group.values, s, cfg.errorMetric ?? 'sd', cfg.errorCiLevel ?? 95);
      const yMean = yOf(err.mean);
      const yl = yOf(err.lower);
      const yu = yOf(err.upper);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(xCenter, yl);
      ctx.lineTo(xCenter, yu);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCenter - 8, yl);
      ctx.lineTo(xCenter + 8, yl);
      ctx.moveTo(xCenter - 8, yu);
      ctx.lineTo(xCenter + 8, yu);
      ctx.stroke();
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(xCenter, yMean, Math.max(4, boxW * 0.14), 0, Math.PI * 2);
      ctx.fill();
    } else {
      const yMin = yOf(s.min);
      const yQ1 = yOf(s.q1);
      const yMed = yOf(s.median);
      const yQ3 = yOf(s.q3);
      const yMax = yOf(s.max);

      if (cfg.chartType === 'violin' || cfg.chartType === 'boxviolin' || cfg.chartType === 'raincloud') {
        const steps = Math.max(40, cfg.violinSteps ?? 70);
        const bandwidth = silvermanBandwidth(group.values, s.max - s.min || 1) * Math.max(0.4, cfg.violinBandwidthFactor ?? 1);
        const domain = Array.from({ length: steps }, (_, stepIdx) => s.min + ((s.max - s.min || 1) * stepIdx) / Math.max(1, steps - 1));
        const density = kdeEstimate(group.values, domain, bandwidth);
        const maxDensity = Math.max(...density.map((item) => item[1]), 0.0001);
        const halfWidth = Math.max(8, boxW / 2);
        const offset = cfg.chartType === 'raincloud' ? Math.max(6, cfg.raincloudOffset ?? 8) : 0;
        const centerX = cfg.chartType === 'raincloud' ? xCenter - halfWidth * 0.55 - offset : xCenter;
        const leftPath = density.map(([value, dens]) => ({ x: centerX - (dens / maxDensity) * halfWidth, y: yOf(value) }));
        const rightPath = density.slice().reverse().map(([value, dens]) => ({ x: centerX + (dens / maxDensity) * halfWidth, y: yOf(value) }));
        ctx.beginPath();
        ctx.moveTo(leftPath[0].x, leftPath[0].y);
        leftPath.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
        rightPath.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.closePath();
        ctx.fillStyle = colors.fill;
        ctx.globalAlpha = Math.min(0.9, Math.max(0.15, cfg.violinOpacity ?? 0.55));
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      if (cfg.chartType === 'boxplot' || cfg.chartType === 'boxviolin' || cfg.chartType === 'raincloud') {
        const raincloudShift = cfg.chartType === 'raincloud' ? Math.max(8, boxW * 0.65) : 0;
        const actualCenterX = cfg.chartType === 'raincloud' ? xCenter + raincloudShift : xCenter;
        const localBoxW = cfg.chartType === 'raincloud'
          ? Math.max(10, boxW * Math.max(0.2, Math.min(0.8, cfg.raincloudBoxHeightRatio ?? 0.35)))
          : boxW;

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(actualCenterX, yMin);
        ctx.lineTo(actualCenterX, yQ3);
        ctx.moveTo(actualCenterX, yQ1);
        ctx.lineTo(actualCenterX, yMax);
        ctx.stroke();
        ctx.fillStyle = colors.fillSoft;
        ctx.fillRect(actualCenterX - localBoxW / 2, yQ3, localBoxW, Math.max(1, yQ1 - yQ3));
        ctx.strokeStyle = colors.stroke;
        ctx.strokeRect(actualCenterX - localBoxW / 2, yQ3, localBoxW, Math.max(1, yQ1 - yQ3));
        ctx.strokeStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(actualCenterX - localBoxW / 2, yMed);
        ctx.lineTo(actualCenterX + localBoxW / 2, yMed);
        ctx.stroke();
      }

      if (cfg.showOutliers && (cfg.chartType === 'boxplot' || cfg.chartType === 'boxviolin' || cfg.chartType === 'violin' || cfg.chartType === 'raincloud')) {
        ctx.fillStyle = cfg.outlierColor;
        s.outliers.forEach((outlier) => {
          ctx.beginPath();
          ctx.arc(xCenter, yOf(outlier), cfg.outlierSize, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      if (cfg.showJitter && (cfg.chartType === 'violin' || cfg.chartType === 'boxviolin' || cfg.chartType === 'raincloud')) {
        ctx.fillStyle = colors.stroke;
        ctx.globalAlpha = Math.min(1, Math.max(0.05, cfg.jitterAlpha));
        const jitterCenterX = cfg.chartType === 'raincloud' ? xCenter + boxW * 0.32 : xCenter;
        group.values.forEach((value) => {
          const dx = (Math.random() - 0.5) * Math.max(8, boxW - 6);
          ctx.beginPath();
          ctx.arc(jitterCenterX + dx, yOf(value), cfg.jitterSize, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }

      if (cfg.showGroupMarker) {
        const metric = cfg.groupMetric === 'mean' ? s.mean : s.median;
        drawMarker(ctx, xCenter, yMed, metric, () => xCenter, yOf, cfg);
      }
    }
  });
  ctx.textAlign = 'start';
}
