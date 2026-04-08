import type { Dataset } from '../../shared/types/state';

interface LikertChartCfg {
  chartType?: 'stacked' | 'diverging' | 'split' | 'distribution';
  decimalPlaces?: number;
  showLegend?: boolean;
  showValues?: boolean;
  legendPosition?: 'right' | 'bottom' | 'top' | 'left';
  scalePoints?: number;
  scaleLabels?: string[];
  scaleStart?: number;
  valueMode?: 'percentage' | 'count';
  itemOrder?: 'original' | 'mean_desc' | 'mean_asc' | 'label_asc';
  paletteId?: 'blue_orange' | 'red_green' | 'purple_yellow' | 'spectral' | 'viridis' | 'warm' | 'cool' | 'earth';
  selectedItems?: string[];
  showTitle?: boolean;
  chartTitle?: string;
  fontFamily?: string;
  fontSizeLabels?: number;
  fontSizeTitle?: number;
  fontSizeValues?: number;
  fontSizeLegend?: number;
  labelMaxLines?: number;
  watermark?: string;
  chartWidth?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  backgroundColor?: string;
  transparentBackground?: boolean;
  showGrid?: boolean;
  gridDashed?: boolean;
  gridVertical?: boolean;
  gridHorizontal?: boolean;
  showGridBorder?: boolean;
  gridColor?: string;
  gridWidth?: number;
  axisColor?: string;
  axisWidth?: number;
  showAxisLabels?: boolean;
  neutralIndex?: number;
  centerLineColor?: string;
  centerLineWidth?: number;
  barHeight?: number;
  barSpacing?: number;
  showBarBorders?: boolean;
  barBorderColor?: string;
  barBorderWidth?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return `#${[r, g, b].map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function interpolatePalette(colors: string[], targetLength: number): string[] {
  if (targetLength <= colors.length) return colors.slice(0, targetLength);
  if (targetLength <= 1) return [colors[0]];

  const result: string[] = [];
  const step = (colors.length - 1) / (targetLength - 1);
  for (let index = 0; index < targetLength; index += 1) {
    const source = index * step;
    const left = Math.floor(source);
    const right = Math.min(left + 1, colors.length - 1);
    const mix = source - left;
    if (left === right) {
      result.push(colors[left]);
      continue;
    }
    const a = hexToRgb(colors[left]);
    const b = hexToRgb(colors[right]);
    result.push(rgbToHex({
      r: a.r + (b.r - a.r) * mix,
      g: a.g + (b.g - a.g) * mix,
      b: a.b + (b.b - a.b) * mix
    }));
  }
  return result;
}

function getPalette(id: LikertChartCfg['paletteId'], points: number): string[] {
  const schemes: Record<string, string[]> = {
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
  const safePoints = Math.max(2, points);
  return interpolatePalette(base, safePoints);
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

function collectLikertItems(dataset: Dataset, scalePoints: number): Array<{ item: string; counts: number[]; total: number; mean: number }> {
  const scaleStart = 1;
  if (!dataset.records.length) return [];
  return collectLikertItemsWithStart(dataset, scalePoints, scaleStart);
}

function collectLikertItemsWithStart(dataset: Dataset, scalePoints: number, scaleStart: number): Array<{ item: string; counts: number[]; total: number; mean: number }> {
  if (!dataset.records.length) return [];

  const headers = Object.keys(dataset.records[0]);
  const results: Array<{ item: string; counts: number[]; total: number; mean: number }> = [];

  headers.forEach((col) => {
    const counts = new Array(scalePoints).fill(0);
    let total = 0;
    let weighted = 0;

    dataset.records.forEach((row) => {
      const value = row[col];
      const n = typeof value === 'string' ? Number(value.trim()) : Number(value);
      if (!Number.isFinite(n)) return;
      const index = clamp(Math.round(n) - scaleStart, 0, scalePoints - 1);
      counts[index] += 1;
      total += 1;
      weighted += index + scaleStart;
    });

    if (total > 0) {
      results.push({ item: col, counts, total, mean: weighted / total });
    }
  });

  return results;
}

function sortItems(items: Array<{ item: string; counts: number[]; total: number; mean: number }>, mode: NonNullable<LikertChartCfg['itemOrder']>) {
  const out = [...items];
  if (mode === 'mean_desc') out.sort((a, b) => b.mean - a.mean);
  if (mode === 'mean_asc') out.sort((a, b) => a.mean - b.mean);
  if (mode === 'label_asc') out.sort((a, b) => a.item.localeCompare(b.item));
  return out;
}

function filterItems(items: Array<{ item: string; counts: number[]; total: number; mean: number }>, selectedItems: string[]) {
  if (!selectedItems.length) return items;
  const selected = new Set(selectedItems);
  return items.filter((row) => selected.has(row.item));
}

function formatLikertValue(
  count: number,
  total: number,
  cfg: {
    valueMode: 'percentage' | 'count';
    decimalPlaces: number;
  }
): string {
  if (cfg.valueMode === 'count') return String(count);
  return `${((count / total) * 100).toFixed(cfg.decimalPlaces)}%`;
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  margin: { top: number; right: number; bottom: number; left: number },
  safe: {
    showLegend: boolean;
    legendPosition: 'right' | 'bottom' | 'top' | 'left';
    scalePoints: number;
    scaleLabels: string[];
    fontSizeLegend: number;
    fontFamily: string;
  },
  palette: string[]
) {
  if (!safe.showLegend) return;
  const boxW = 14;
  const boxH = 10;
  const gap = 6;
  const itemGap = 14;
  const lineHeight = Math.max(16, Math.round(safe.fontSizeLegend * 1.8));
  ctx.font = `${safe.fontSizeLegend}px ${safe.fontFamily}`;
  ctx.textBaseline = 'middle';

  const drawLegendSwatch = (x: number, y: number, color: string, label: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y - boxH / 2, boxW, boxH);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y - boxH / 2, boxW, boxH);
    ctx.fillStyle = '#334155';
    ctx.fillText(label, x + boxW + gap, y);
  };

  const labels = Array.from({ length: Math.max(2, safe.scalePoints) }, (_, i) => safe.scaleLabels[i] ?? String(i + 1));

  if (safe.legendPosition === 'top') {
    let lx = margin.left;
    let ly = Math.max(22, margin.top - lineHeight + 2);
    const maxX = width - margin.right;
    labels.forEach((label, i) => {
      const itemWidth = boxW + gap + ctx.measureText(label).width + itemGap;
      if (lx + itemWidth > maxX && lx > margin.left) {
        lx = margin.left;
        ly += lineHeight;
      }
      drawLegendSwatch(lx, ly, palette[i % palette.length], label);
      lx += itemWidth;
    });
    return;
  }
  if (safe.legendPosition === 'bottom') {
    let lx = margin.left;
    let ly = height - Math.max(20, margin.bottom - lineHeight);
    const maxX = width - margin.right;
    labels.forEach((label, i) => {
      const itemWidth = boxW + gap + ctx.measureText(label).width + itemGap;
      if (lx + itemWidth > maxX && lx > margin.left) {
        lx = margin.left;
        ly += lineHeight;
      }
      drawLegendSwatch(lx, ly, palette[i % palette.length], label);
      lx += itemWidth;
    });
    return;
  }
  if (safe.legendPosition === 'left') {
    let ly = margin.top + 10;
    const lx = 12;
    labels.forEach((label, i) => {
      drawLegendSwatch(lx, ly, palette[i % palette.length], label);
      ly += lineHeight;
    });
    return;
  }

  let ly = margin.top + 10;
  const lx = width - margin.right + 10;
  labels.forEach((label, i) => {
    drawLegendSwatch(lx, ly, palette[i % palette.length], label);
    ly += lineHeight;
  });
}

function estimateLegendPadding(
  ctx: CanvasRenderingContext2D,
  width: number,
  baseMargin: { top: number; right: number; bottom: number; left: number },
  safe: {
    showLegend: boolean;
    legendPosition: 'right' | 'bottom' | 'top' | 'left';
    scalePoints: number;
    scaleLabels: string[];
    fontSizeLegend: number;
    fontFamily: string;
  }
) {
  if (!safe.showLegend) return { top: 0, right: 0, bottom: 0, left: 0 };
  ctx.save();
  ctx.font = `${safe.fontSizeLegend}px ${safe.fontFamily}`;
  const labels = Array.from({ length: Math.max(2, safe.scalePoints) }, (_, i) => safe.scaleLabels[i] ?? String(i + 1));
  const boxW = 14;
  const gap = 6;
  const itemGap = 14;
  const lineHeight = Math.max(16, Math.round(safe.fontSizeLegend * 1.8));
  const itemWidths = labels.map((label) => boxW + gap + ctx.measureText(label).width + itemGap);

  let result = { top: 0, right: 0, bottom: 0, left: 0 };
  if (safe.legendPosition === 'left' || safe.legendPosition === 'right') {
    const widest = Math.max(...itemWidths, 90);
    if (safe.legendPosition === 'left') result.left = Math.ceil(widest + 14);
    if (safe.legendPosition === 'right') result.right = Math.ceil(widest + 14);
    ctx.restore();
    return result;
  }

  const available = Math.max(180, width - baseMargin.left - baseMargin.right);
  let rows = 1;
  let rowWidth = 0;
  itemWidths.forEach((itemWidth) => {
    if (rowWidth > 0 && rowWidth + itemWidth > available) {
      rows += 1;
      rowWidth = itemWidth;
      return;
    }
    rowWidth += itemWidth;
  });
  const totalHeight = rows * lineHeight + 12;
  if (safe.legendPosition === 'top') result.top = totalHeight;
  if (safe.legendPosition === 'bottom') result.bottom = totalHeight;
  ctx.restore();
  return result;
}

function drawAxisLabels(
  ctx: CanvasRenderingContext2D,
  safe: {
    chartType: 'stacked' | 'diverging' | 'split' | 'distribution';
    showAxisLabels: boolean;
    fontFamily: string;
    axisColor: string;
  },
  margin: { left: number; right: number; bottom: number },
  width: number,
  height: number,
  chartW: number
) {
  if (!safe.showAxisLabels) return;
  ctx.fillStyle = safe.axisColor;
  ctx.font = `11px ${safe.fontFamily}`;

  if (safe.chartType === 'split') {
    const neutralColumnWidth = Math.max(44, Math.min(96, Math.round(chartW * 0.08)));
    const neutralColumnGap = 10;
    const mainChartW = Math.max(120, chartW - neutralColumnWidth - neutralColumnGap);
    const startX = margin.left;
    const neutralX = margin.left + mainChartW + neutralColumnGap;
    const labelY = height - margin.bottom + 16;

    ctx.fillText('100%', startX - 18, labelY);
    ctx.fillText('50%', startX + mainChartW * 0.25 - 10, labelY);
    ctx.fillText('0%', startX + mainChartW * 0.5 - 6, labelY);
    ctx.fillText('50%', startX + mainChartW * 0.75 - 10, labelY);
    ctx.fillText('100%', startX + mainChartW - 16, labelY);
    ctx.fillText('100%', neutralX + neutralColumnWidth / 2 - 10, labelY);
    return;
  }

  if (safe.chartType === 'distribution') {
    ctx.fillText('0%', margin.left - 8, height - margin.bottom + 16);
    ctx.fillText('50%', margin.left + chartW / 2 - 10, height - margin.bottom + 16);
    ctx.fillText('100%', margin.left + chartW - 16, height - margin.bottom + 16);
    return;
  }

  if (safe.chartType === 'stacked') {
    ctx.fillText('0%', margin.left - 8, height - margin.bottom + 16);
    ctx.fillText('50%', margin.left + chartW / 2 - 10, height - margin.bottom + 16);
    ctx.fillText('100%', margin.left + chartW - 16, height - margin.bottom + 16);
    return;
  }

  const centerX = margin.left + chartW / 2;
  ctx.fillText('100%', margin.left - 18, height - margin.bottom + 16);
  ctx.fillText('50%', margin.left + chartW / 4 - 10, height - margin.bottom + 16);
  ctx.fillText('0%', centerX - 6, height - margin.bottom + 16);
  ctx.fillText('50%', margin.left + (chartW * 3) / 4 - 10, height - margin.bottom + 16);
  ctx.fillText('100%', width - margin.right - 20, height - margin.bottom + 16);
}

function drawCenteredGrid(
  ctx: CanvasRenderingContext2D,
  safe: {
    showGrid: boolean;
    gridColor: string;
    gridWidth: number;
    gridDashed: boolean;
    gridVertical: boolean;
    gridHorizontal: boolean;
    showGridBorder: boolean;
    axisColor: string;
    axisWidth: number;
    chartType: 'stacked' | 'diverging' | 'split' | 'distribution';
    centerLineColor: string;
    centerLineWidth: number;
  },
  margin: { left: number; right: number; top: number; bottom: number },
  width: number,
  height: number,
  chartW: number
) {
  const chartBottom = height - margin.bottom;

  if (safe.chartType === 'split') {
    const neutralColumnWidth = Math.max(44, Math.min(96, Math.round(chartW * 0.08)));
    const neutralColumnGap = 10;
    const mainChartW = Math.max(120, chartW - neutralColumnWidth - neutralColumnGap);
    const startX = margin.left;
    const endX = startX + mainChartW;
    const centerX = startX + mainChartW / 2;
    const neutralX = endX + neutralColumnGap;

    if (safe.showGrid) {
      ctx.strokeStyle = safe.gridColor;
      ctx.lineWidth = safe.gridWidth;
      ctx.setLineDash(safe.gridDashed ? [5, 5] : []);

      if (safe.gridVertical) {
        for (let i = 0; i <= 4; i += 1) {
          const x = startX + (mainChartW / 4) * i;
          ctx.beginPath();
          ctx.moveTo(x, margin.top);
          ctx.lineTo(x, chartBottom);
          ctx.stroke();
        }
      }

      if (safe.gridHorizontal) {
        for (let i = 0; i <= 4; i += 1) {
          const y = margin.top + ((chartBottom - margin.top) / 4) * i;
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(neutralX, y);
          ctx.lineTo(neutralX + neutralColumnWidth, y);
          ctx.stroke();
        }
      }

      ctx.setLineDash([]);
      if (safe.showGridBorder) {
        ctx.strokeStyle = safe.gridColor;
        ctx.strokeRect(startX, margin.top, mainChartW, chartBottom - margin.top);
        ctx.strokeRect(neutralX, margin.top, neutralColumnWidth, chartBottom - margin.top);
      }
    }

    ctx.strokeStyle = safe.axisColor;
    ctx.lineWidth = safe.axisWidth;
    ctx.beginPath();
    ctx.moveTo(startX, chartBottom + 2);
    ctx.lineTo(endX, chartBottom + 2);
    ctx.moveTo(neutralX, chartBottom + 2);
    ctx.lineTo(neutralX + neutralColumnWidth, chartBottom + 2);
    ctx.stroke();

    ctx.strokeStyle = safe.centerLineColor;
    ctx.lineWidth = safe.centerLineWidth;
    ctx.beginPath();
    ctx.moveTo(centerX, margin.top);
    ctx.lineTo(centerX, chartBottom);
    ctx.stroke();
    return;
  }

  if (safe.showGrid) {
    ctx.strokeStyle = safe.gridColor;
    ctx.lineWidth = safe.gridWidth;
    ctx.setLineDash(safe.gridDashed ? [5, 5] : []);
    const steps = safe.chartType === 'stacked' ? 4 : 4;
    for (let i = 0; i <= steps; i += 1) {
      const x = margin.left + (chartW / steps) * i;
      if (safe.gridVertical) {
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, chartBottom);
        ctx.stroke();
      }
    }
    if (safe.gridHorizontal) {
      for (let i = 0; i <= 4; i += 1) {
        const y = margin.top + ((chartBottom - margin.top) / 4) * i;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    if (safe.showGridBorder) {
      ctx.strokeStyle = safe.gridColor;
      ctx.strokeRect(margin.left, margin.top, chartW, chartBottom - margin.top);
    }
  }

  ctx.strokeStyle = safe.axisColor;
  ctx.lineWidth = safe.axisWidth;
  ctx.beginPath();
  ctx.moveTo(margin.left, chartBottom + 2);
  ctx.lineTo(width - margin.right, chartBottom + 2);
  ctx.stroke();

  if (safe.chartType === 'diverging') {
    const centerX = margin.left + chartW / 2;
    ctx.strokeStyle = safe.centerLineColor;
    ctx.lineWidth = safe.centerLineWidth;
    ctx.beginPath();
    ctx.moveTo(centerX, margin.top);
    ctx.lineTo(centerX, chartBottom);
    ctx.stroke();
  }
}

function drawDistributionChart(
  ctx: CanvasRenderingContext2D,
  rows: Array<{ item: string; counts: number[]; total: number; mean: number; labelLines: string[] }>,
  safe: {
    scalePoints: number;
    scaleLabels: string[];
    valueMode: 'percentage' | 'count';
    decimalPlaces: number;
    showValues: boolean;
    fontFamily: string;
    fontSizeLabels: number;
    fontSizeValues: number;
    chartType: 'distribution';
    showBarBorders: boolean;
    barBorderColor: string;
    barBorderWidth: number;
  },
  palette: string[],
  margin: { left: number; right: number; top: number; bottom: number },
  width: number,
  height: number
) {
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const totals = new Array(Math.max(2, safe.scalePoints)).fill(0);
  let totalResponses = 0;
  rows.forEach((row) => {
    row.counts.forEach((count, index) => {
      totals[index] += count;
      totalResponses += count;
    });
  });
  const percentages = totals.map((count) => totalResponses > 0 ? (count / totalResponses) * 100 : 0);
  const maxPercent = Math.max(1, ...percentages);
  const slotW = chartW / Math.max(1, totals.length);

  totals.forEach((count, index) => {
    const percentage = percentages[index];
    const barW = Math.max(18, slotW * 0.68);
    const barH = (percentage / maxPercent) * chartH;
    const x = margin.left + slotW * index + (slotW - barW) / 2;
    const y = margin.top + chartH - barH;

    ctx.fillStyle = palette[index % palette.length];
    ctx.fillRect(x, y, barW, barH);
    if (safe.showBarBorders) {
      ctx.strokeStyle = safe.barBorderColor;
      ctx.lineWidth = safe.barBorderWidth;
      ctx.strokeRect(x, y, barW, barH);
    }

    if (safe.showValues) {
      ctx.fillStyle = '#0f172a';
      ctx.font = `600 ${safe.fontSizeValues}px ${safe.fontFamily}`;
      ctx.textAlign = 'center';
      const display = safe.valueMode === 'count'
        ? String(count)
        : `${percentage.toFixed(safe.decimalPlaces)}%`;
      ctx.fillText(display, x + barW / 2, y - 8);
    }

    ctx.fillStyle = '#334155';
    ctx.font = `${safe.fontSizeLabels}px ${safe.fontFamily}`;
    ctx.textAlign = 'center';
    const label = safe.scaleLabels[index] ?? String(index + 1);
    const lines = wrapLabel(ctx, label, slotW - 8, 3);
    lines.forEach((line, lineIndex) => {
      ctx.fillText(line, x + barW / 2, height - margin.bottom + 20 + lineIndex * Math.round(safe.fontSizeLabels * 1.2));
    });
  });
}

export function renderLikertCanvas(canvas: HTMLCanvasElement, dataset: Dataset | null, cfg: LikertChartCfg): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const safe = {
    chartType: cfg.chartType ?? 'stacked',
    decimalPlaces: cfg.decimalPlaces ?? 1,
    showLegend: cfg.showLegend ?? true,
    showValues: cfg.showValues ?? true,
    legendPosition: cfg.legendPosition ?? 'bottom',
    scalePoints: cfg.scalePoints ?? 5,
    scaleLabels: cfg.scaleLabels ?? [],
    scaleStart: cfg.scaleStart ?? 1,
    valueMode: cfg.valueMode ?? 'percentage',
    itemOrder: cfg.itemOrder ?? 'original',
    paletteId: cfg.paletteId ?? 'blue_orange',
    selectedItems: cfg.selectedItems ?? [],
    showTitle: cfg.showTitle ?? true,
    chartTitle: cfg.chartTitle ?? '',
    fontFamily: cfg.fontFamily ?? 'Segoe UI, sans-serif',
    fontSizeLabels: cfg.fontSizeLabels ?? 12,
    fontSizeTitle: cfg.fontSizeTitle ?? 18,
    fontSizeValues: cfg.fontSizeValues ?? 11,
    fontSizeLegend: cfg.fontSizeLegend ?? 10,
    labelMaxLines: cfg.labelMaxLines ?? 2,
    watermark: cfg.watermark ?? '',
    chartWidth: cfg.chartWidth ?? 1200,
    marginTop: cfg.marginTop ?? 60,
    marginRight: cfg.marginRight ?? 80,
    marginBottom: cfg.marginBottom ?? 70,
    marginLeft: cfg.marginLeft ?? 220,
    backgroundColor: cfg.backgroundColor ?? '#ffffff',
    transparentBackground: cfg.transparentBackground ?? false,
    showGrid: cfg.showGrid ?? true,
    gridDashed: cfg.gridDashed ?? true,
    gridVertical: cfg.gridVertical ?? true,
    gridHorizontal: cfg.gridHorizontal ?? false,
    showGridBorder: cfg.showGridBorder ?? true,
    gridColor: cfg.gridColor ?? '#e2e8f0',
    gridWidth: cfg.gridWidth ?? 1,
    axisColor: cfg.axisColor ?? '#64748b',
    axisWidth: cfg.axisWidth ?? 2,
    showAxisLabels: cfg.showAxisLabels ?? true,
    neutralIndex: cfg.neutralIndex ?? Math.ceil((cfg.scalePoints ?? 5) / 2),
    centerLineColor: cfg.centerLineColor ?? '#334155',
    centerLineWidth: cfg.centerLineWidth ?? 2,
    barHeight: cfg.barHeight ?? 40,
    barSpacing: cfg.barSpacing ?? 10,
    showBarBorders: cfg.showBarBorders ?? false,
    barBorderColor: cfg.barBorderColor ?? '#ffffff',
    barBorderWidth: cfg.barBorderWidth ?? 1
  };

  const width = Math.max(700, safe.chartWidth);
  const rowH = Math.max(20, safe.barHeight);
  const gap = Math.max(0, safe.barSpacing);
  const legendPadding = estimateLegendPadding(ctx, width, {
    top: safe.marginTop,
    right: safe.marginRight,
    bottom: safe.marginBottom,
    left: safe.marginLeft
  }, safe);
  const margin = {
    top: Math.max(20, safe.marginTop + legendPadding.top),
    right: Math.max(20, safe.marginRight + legendPadding.right),
    bottom: Math.max(20, safe.marginBottom + legendPadding.bottom),
    left: Math.max(60, safe.marginLeft + legendPadding.left)
  };

  const raw = dataset ? collectLikertItemsWithStart(dataset, Math.max(2, safe.scalePoints), safe.scaleStart) : [];
  const filtered = filterItems(raw, safe.selectedItems);
  const items = sortItems(filtered, safe.itemOrder);
  ctx.font = `${safe.fontSizeLabels}px ${safe.fontFamily}`;
  const labelLineHeight = Math.round(safe.fontSizeLabels * 1.2);
  const labelWidth = Math.max(80, margin.left - 22);
  const wrappedItems = items.map((item) => ({
    ...item,
    labelLines: wrapLabel(ctx, item.item, labelWidth, safe.labelMaxLines)
  }));
  const rowBlockHeights = wrappedItems.map((item) => Math.max(rowH, item.labelLines.length * labelLineHeight));
  const contentHeight = rowBlockHeights.reduce((sum, blockHeight) => sum + blockHeight, 0) + Math.max(0, wrappedItems.length - 1) * gap;
  const height = Math.max(320, margin.top + margin.bottom + contentHeight);
  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);
  if (!safe.transparentBackground) {
    ctx.fillStyle = safe.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  const chartW = width - margin.left - margin.right;
  drawCenteredGrid(ctx, safe, margin, width, height, chartW);

  if (safe.showTitle) {
    ctx.fillStyle = '#0f172a';
    ctx.font = `600 ${safe.fontSizeTitle}px ${safe.fontFamily}`;
    ctx.fillText(safe.chartTitle.trim() || 'Likert Chart', 16, 28);
  }

  if (!items.length) {
    ctx.fillStyle = '#64748b';
    ctx.font = `13px ${safe.fontFamily}`;
    ctx.fillText('No hay datos numericos para renderizar Likert.', 16, 58);
    return;
  }

  const palette = getPalette(safe.paletteId, safe.scalePoints);

  if (safe.chartType === 'distribution') {
    drawDistributionChart(ctx, wrappedItems, { ...safe, chartType: 'distribution' }, palette, margin, width, height);
    drawAxisLabels(ctx, safe, margin, width, height, chartW);
    drawLegend(ctx, width, height, margin, safe, palette);
    if (safe.watermark.trim()) {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
      ctx.font = `11px ${safe.fontFamily}`;
      ctx.fillText(safe.watermark.trim(), width - 180, height - 8);
    }
    return;
  }

  let currentY = margin.top;
  wrappedItems.forEach((row) => {
    const blockHeight = Math.max(rowH, row.labelLines.length * labelLineHeight);
    const y = currentY + (blockHeight - rowH) / 2;

    ctx.fillStyle = '#334155';
    ctx.font = `${safe.fontSizeLabels}px ${safe.fontFamily}`;
    const labelStartY = currentY + blockHeight / 2 - ((row.labelLines.length - 1) * labelLineHeight) / 2;
    row.labelLines.forEach((line, lineIndex) => {
      ctx.fillText(line, 12, labelStartY + lineIndex * labelLineHeight);
    });

    if (safe.chartType === 'stacked') {
      let x = margin.left;
      row.counts.forEach((count, bucket) => {
        const frac = count / row.total;
        const w = chartW * frac;
        ctx.fillStyle = palette[bucket % palette.length];
        ctx.fillRect(x, y, w, rowH);

        if (safe.showBarBorders) {
          ctx.strokeStyle = safe.barBorderColor;
          ctx.lineWidth = safe.barBorderWidth;
          ctx.strokeRect(x, y, w, rowH);
        }

        if (safe.showValues && w > 36) {
          ctx.fillStyle = '#ffffff';
          ctx.font = `600 ${safe.fontSizeValues}px ${safe.fontFamily}`;
          ctx.fillText(formatLikertValue(count, row.total, safe), x + 8, y + rowH * 0.62);
        }
        x += w;
      });
    } else {
      const neutralBucket = clamp(Math.round(safe.neutralIndex) - 1, 0, row.counts.length - 1);
      const neutralCount = row.counts[neutralBucket] ?? 0;
      const splitNeutralColumnWidth = safe.chartType === 'split'
        ? Math.max(44, Math.min(96, Math.round(chartW * 0.08)))
        : 0;
      const splitNeutralGap = safe.chartType === 'split' ? 10 : 0;
      const mainChartW = safe.chartType === 'split'
        ? Math.max(120, chartW - splitNeutralColumnWidth - splitNeutralGap)
        : chartW;
      const centerX = margin.left + mainChartW / 2;
      const halfChartW = mainChartW / 2;
      const neutralWidth = safe.chartType === 'split'
        ? Math.max(0, (neutralCount / row.total) * splitNeutralColumnWidth)
        : halfChartW * (neutralCount / row.total);
      const neutralColumnX = safe.chartType === 'split' ? margin.left + mainChartW + splitNeutralGap : centerX - neutralWidth / 2;

      let xLeft = centerX;
      for (let bucket = neutralBucket - 1; bucket >= 0; bucket -= 1) {
        const count = row.counts[bucket] ?? 0;
        const w = halfChartW * (count / row.total);
        xLeft -= w;
        ctx.fillStyle = palette[bucket % palette.length];
        ctx.fillRect(xLeft, y, w, rowH);
        if (safe.showBarBorders) {
          ctx.strokeStyle = safe.barBorderColor;
          ctx.lineWidth = safe.barBorderWidth;
          ctx.strokeRect(xLeft, y, w, rowH);
        }
        if (safe.showValues && w > 36) {
          ctx.fillStyle = '#ffffff';
          ctx.font = `600 ${safe.fontSizeValues}px ${safe.fontFamily}`;
          ctx.fillText(formatLikertValue(count, row.total, safe), xLeft + 8, y + rowH * 0.62);
        }
      }

      if (safe.chartType === 'split') {
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(neutralColumnX, y, splitNeutralColumnWidth, rowH);
        if (neutralWidth > 0) {
          ctx.fillStyle = palette[neutralBucket % palette.length];
          ctx.fillRect(neutralColumnX, y, neutralWidth, rowH);
        }
        if (safe.showBarBorders) {
          ctx.strokeStyle = safe.barBorderColor;
          ctx.lineWidth = safe.barBorderWidth;
          ctx.strokeRect(neutralColumnX, y, splitNeutralColumnWidth, rowH);
        }
        if (safe.showValues && neutralWidth > 36) {
          ctx.fillStyle = '#0f172a';
          ctx.font = `600 ${safe.fontSizeValues}px ${safe.fontFamily}`;
          ctx.fillText(formatLikertValue(neutralCount, row.total, safe), neutralColumnX + splitNeutralColumnWidth / 2, y + rowH * 0.62);
        }
      } else if (neutralWidth > 0) {
        ctx.fillStyle = palette[neutralBucket % palette.length];
        ctx.fillRect(centerX - neutralWidth / 2, y, neutralWidth, rowH);
        if (safe.showBarBorders) {
          ctx.strokeStyle = safe.barBorderColor;
          ctx.lineWidth = safe.barBorderWidth;
          ctx.strokeRect(centerX - neutralWidth / 2, y, neutralWidth, rowH);
        }
        if (safe.showValues && neutralWidth > 36) {
          ctx.fillStyle = '#0f172a';
          ctx.font = `600 ${safe.fontSizeValues}px ${safe.fontFamily}`;
          ctx.fillText(formatLikertValue(neutralCount, row.total, safe), centerX - neutralWidth / 2 + 8, y + rowH * 0.62);
        }
      }

      let xRight = centerX;
      for (let bucket = neutralBucket + 1; bucket < row.counts.length; bucket += 1) {
        const count = row.counts[bucket] ?? 0;
        const w = halfChartW * (count / row.total);
        ctx.fillStyle = palette[bucket % palette.length];
        ctx.fillRect(xRight, y, w, rowH);
        if (safe.showBarBorders) {
          ctx.strokeStyle = safe.barBorderColor;
          ctx.lineWidth = safe.barBorderWidth;
          ctx.strokeRect(xRight, y, w, rowH);
        }
        if (safe.showValues && w > 36) {
          ctx.fillStyle = '#ffffff';
          ctx.font = `600 ${safe.fontSizeValues}px ${safe.fontFamily}`;
          ctx.fillText(formatLikertValue(count, row.total, safe), xRight + 8, y + rowH * 0.62);
        }
        xRight += w;
      }
    }
    currentY += blockHeight + gap;
  });
  drawAxisLabels(ctx, safe, margin, width, height, chartW);
  drawLegend(ctx, width, height, margin, safe, palette);

  if (safe.watermark.trim()) {
    ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.font = `11px ${safe.fontFamily}`;
    ctx.fillText(safe.watermark.trim(), width - 180, height - 8);
  }
}

