function clamp(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}

function esc(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function stdDev(values) {
    const n = values.length;
    if (n < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / n;
    const variance = values.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (n - 1);
    return Math.sqrt(variance);
}

function silvermanBandwidth(values, minValue, maxValue) {
    const n = values.length;
    if (n < 2) return Math.max((maxValue - minValue) / 25, 0.1);
    const sigma = stdDev(values);
    if (!Number.isFinite(sigma) || sigma <= 0) return Math.max((maxValue - minValue) / 25, 0.1);
    return 1.06 * sigma * Math.pow(n, -0.2);
}

function gaussian(u) {
    return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
}

function kde(values = [], domain = [], bandwidth = 1) {
    if (!values.length || !domain.length || bandwidth <= 0) return [];
    return domain.map((x) => {
        let sum = 0;
        values.forEach((v) => {
            sum += gaussian((x - v) / bandwidth);
        });
        return [x, sum / (values.length * bandwidth)];
    });
}

function makeDomain(minValue, maxValue, steps = 70) {
    const safeRange = maxValue - minValue || 1;
    return Array.from({ length: steps }, (_, i) => minValue + (safeRange * i) / (steps - 1));
}

function vectorSVGFromContext(context = {}) {
    const cfg = context.config || {};
    const groups = Array.isArray(context.groups) ? context.groups : [];
    if (!groups.length) return null;
    if ((cfg.orientation || 'horizontal') !== 'horizontal') return null;

    const width = cfg.chartWidth || 1200;
    const groupHeight = cfg.groupThickness || 34;
    const groupGap = cfg.groupGap || 16;
    const marginLeft = cfg.marginLeft || 220;
    const marginRight = cfg.marginRight || 80;
    const marginTop = cfg.marginTop || 60;
    const marginBottom = cfg.marginBottom || 70;
    const minCanvasHeight = cfg.chartMinHeight || 420;
    const chartType = cfg.chartType || context.chartType || 'boxplot';
    if (!['boxplot', 'violin', 'boxviolin', 'raincloud'].includes(chartType)) return null;
    const height = Math.max(minCanvasHeight, marginTop + marginBottom + groups.length * (groupHeight + groupGap));
    const chartLeft = marginLeft;
    const chartRight = width - marginRight;
    const chartTop = marginTop;
    const chartBottom = height - marginBottom;
    const chartWidth = chartRight - chartLeft;
    const palette = {
        blue_orange: ['#2563eb', '#3b82f6', '#38bdf8', '#fb923c', '#f97316'],
        cool: ['#0ea5e9', '#06b6d4', '#14b8a6', '#22c55e', '#84cc16'],
        warm: ['#ef4444', '#f97316', '#f59e0b', '#fbbf24', '#fb7185']
    }[cfg.colorScheme || 'blue_orange'] || ['#2563eb', '#3b82f6', '#38bdf8'];

    const allValues = groups.flatMap((g) => (g.values || []).map(Number).filter(Number.isFinite));
    if (!allValues.length) return null;
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const safeRange = maxValue - minValue || 1;
    const scaleX = (v) => chartLeft + ((v - minValue) / safeRange) * chartWidth;
    const lineWidth = cfg.lineWidth || 2;
    const labelSize = cfg.labelFontSize || 12;
    const titleSize = cfg.titleFontSize || 20;
    const fontFamily = cfg.fontFamily || 'Arial, sans-serif';
    const showGrid = cfg.showGrid !== false;
    const showOutliers = cfg.showOutliers !== false;
    const showJitter = cfg.showJitter === true;
    const outlierColor = cfg.outlierColor || '#ef4444';
    const outlierSize = cfg.outlierSize || 2.2;

    const parts = [];
    parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
    parts.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>`);
    parts.push(`<text x="20" y="32" fill="#0f172a" font-family="${esc(fontFamily)}" font-size="${titleSize}" font-weight="700">${esc(cfg.chartTitle || context.numericColumn || 'Distribution')}</text>`);

    if (showGrid) {
        for (let i = 0; i <= 5; i += 1) {
            const x = chartLeft + (chartWidth * i) / 5;
            const value = (minValue + (safeRange * i) / 5).toFixed(2);
            parts.push(`<line x1="${x}" y1="${chartTop - 8}" x2="${x}" y2="${chartBottom + 6}" stroke="#e2e8f0" stroke-width="1"/>`);
            parts.push(`<text x="${x}" y="${chartBottom + 24}" fill="#64748b" font-family="${esc(fontFamily)}" font-size="${labelSize}" text-anchor="middle">${value}</text>`);
        }
    }

    const kdeSteps = Math.round(clamp(cfg.kdeSteps, 30, 260, 70));
    const kdeBandwidthFactor = clamp(cfg.kdeBandwidthFactor, 0.2, 4, 1);
    const domain = makeDomain(minValue, maxValue, kdeSteps);

    groups.forEach((group, index) => {
        const s = group.summary || {};
        const y = chartTop + index * (groupHeight + groupGap) + groupHeight / 2;
        const color = palette[index % palette.length];
        const xMin = scaleX(s.lowerWhisker);
        const xQ1 = scaleX(s.q1);
        const xMed = scaleX(s.median);
        const xQ3 = scaleX(s.q3);
        const xMax = scaleX(s.upperWhisker);
        const halfWidth = Math.max(8, groupHeight / 2 - 2);
        const values = (group.values || []).map(Number).filter(Number.isFinite);

        const drawViolin = chartType === 'violin' || chartType === 'boxviolin' || chartType === 'raincloud';
        const drawBox = chartType === 'boxplot' || chartType === 'boxviolin' || chartType === 'raincloud';
        const raincloud = chartType === 'raincloud';

        if (drawViolin && values.length > 1) {
            const bandwidth = silvermanBandwidth(values, minValue, maxValue) * kdeBandwidthFactor;
            const density = kde(values, domain, bandwidth);
            const maxDensity = Math.max(...density.map((d) => d[1]), 0.0001);
            const cloudBase = raincloud ? y - 3 : y;
            const upper = density.map(([x, d]) => `${scaleX(x)},${cloudBase - (d / maxDensity) * halfWidth}`);
            const lower = raincloud
                ? density.slice().reverse().map(([x]) => `${scaleX(x)},${cloudBase}`)
                : density.slice().reverse().map(([x, d]) => `${scaleX(x)},${cloudBase + (d / maxDensity) * halfWidth}`);
            parts.push(`<polygon points="${[`${scaleX(domain[0])},${cloudBase}`, ...upper, ...lower].join(' ')}" fill="${color}" fill-opacity="${raincloud ? 0.45 : cfg.violinOpacity || 0.55}" stroke="${color}" stroke-opacity="0.85" stroke-width="1.1"/>`);
        }

        if (drawBox) {
            const boxY = raincloud ? y + 4 : y - 7;
            const boxH = raincloud ? Math.max(10, groupHeight * 0.35) : 14;
            const centerY = boxY + boxH / 2;
            parts.push(`<line x1="${xMin}" y1="${centerY}" x2="${xQ1}" y2="${centerY}" stroke="#475569" stroke-width="${lineWidth}"/>`);
            parts.push(`<line x1="${xQ3}" y1="${centerY}" x2="${xMax}" y2="${centerY}" stroke="#475569" stroke-width="${lineWidth}"/>`);
            parts.push(`<line x1="${xMin}" y1="${boxY + 1}" x2="${xMin}" y2="${boxY + boxH - 1}" stroke="#475569" stroke-width="${lineWidth}"/>`);
            parts.push(`<line x1="${xMax}" y1="${boxY + 1}" x2="${xMax}" y2="${boxY + boxH - 1}" stroke="#475569" stroke-width="${lineWidth}"/>`);
            parts.push(`<rect x="${xQ1}" y="${boxY}" width="${Math.max(1, xQ3 - xQ1)}" height="${boxH}" fill="${raincloud ? '#ffffffdd' : color}" stroke="#0f172a" stroke-width="1.1"/>`);
            parts.push(`<line x1="${xMed}" y1="${boxY}" x2="${xMed}" y2="${boxY + boxH}" stroke="#111827" stroke-width="${lineWidth}"/>`);
        }

        if (showJitter) {
            const seedDen = Math.max(1, values.length - 1);
            values.forEach((v, i) => {
                const x = scaleX(v);
                const yJ = raincloud ? y + 8 + ((i / seedDen) - 0.5) * (halfWidth * 0.8) : y + ((i / seedDen) - 0.5) * (halfWidth * 1.3);
                const r = cfg.jitterSize || 1.6;
                parts.push(`<circle cx="${x}" cy="${yJ}" r="${r}" fill="#0f172a" fill-opacity="${cfg.jitterAlpha || 0.35}"/>`);
            });
        }

        if (showOutliers && Array.isArray(s.outliers)) {
            s.outliers.forEach((v) => {
                parts.push(`<circle cx="${scaleX(v)}" cy="${raincloud ? y + 4 + Math.max(10, groupHeight * 0.35) / 2 : y}" r="${outlierSize}" fill="${outlierColor}"/>`);
            });
        }

        parts.push(`<text x="${marginLeft - 10}" y="${y}" fill="#0f172a" font-family="${esc(fontFamily)}" font-size="${labelSize}" text-anchor="end" dominant-baseline="middle">${esc(`${group.label} (n=${s.n || 0})`)}</text>`);
    });

    const annotations = cfg.annotations || {};
    if (annotations.showMeanLine === true && Number.isFinite(context.overallStats?.mean)) {
        const x = scaleX(context.overallStats.mean);
        const dash = clamp(annotations.meanLineDash, 2, 40, 8);
        const gap = clamp(annotations.meanLineGap, 2, 40, 6);
        parts.push(`<line x1="${x}" y1="${chartTop}" x2="${x}" y2="${chartBottom}" stroke="${esc(annotations.meanLineColor || '#0f172a')}" stroke-width="${annotations.meanLineWidth || 1.6}" stroke-dasharray="${dash} ${gap}"/>`);
        if (annotations.showMeanLabel !== false) {
            parts.push(`<text x="${x + 6}" y="${chartTop + 12}" fill="${esc(annotations.meanLineColor || '#0f172a')}" font-family="${esc(fontFamily)}" font-size="${labelSize}">mean = ${context.overallStats.mean.toFixed(3)}</text>`);
        }
    }

    if (annotations.showStats === true && context.overallStats) {
        const lines = [];
        const fields = annotations.statsFields || {};
        if (fields.n !== false) lines.push(`n = ${context.overallStats.n}`);
        if (fields.mean !== false) lines.push(`mean = ${context.overallStats.mean.toFixed(3)}`);
        if (fields.median !== false) lines.push(`median = ${context.overallStats.median.toFixed(3)}`);
        if (fields.sd !== false) lines.push(`sd = ${context.overallStats.sd.toFixed(3)}`);
        if (fields.iqr !== false) lines.push(`iqr = ${context.overallStats.iqr.toFixed(3)}`);
        if (lines.length) {
            const boxW = 170;
            const boxH = lines.length * 16 + 14;
            let x = chartRight - boxW - 10;
            let y = chartTop + 10;
            if (annotations.statsPosition === 'top_left') x = chartLeft + 10;
            if (annotations.statsPosition === 'bottom_right') y = chartBottom - boxH - 10;
            if (annotations.statsPosition === 'bottom_left') {
                x = chartLeft + 10;
                y = chartBottom - boxH - 10;
            }
            parts.push(`<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" fill="#ffffff" fill-opacity="0.88" stroke="#94a3b8" stroke-width="1"/>`);
            lines.forEach((line, i) => {
                parts.push(`<text x="${x + 8}" y="${y + 20 + i * 16}" fill="#0f172a" font-family="${esc(fontFamily)}" font-size="${labelSize}">${esc(line)}</text>`);
            });
        }
    }

    if (String(annotations.annotationText || '').trim()) {
        const x = chartLeft + ((chartWidth * clamp(annotations.annotationX, 0, 100, 80)) / 100);
        const y = chartTop + (((chartBottom - chartTop) * clamp(annotations.annotationY, 0, 100, 12)) / 100);
        parts.push(`<text x="${x}" y="${y}" fill="${esc(annotations.annotationColor || '#111827')}" font-family="${esc(fontFamily)}" font-size="${Math.round(clamp(annotations.annotationSize, 10, 40, 13))}">${esc(annotations.annotationText)}</text>`);
    }

    parts.push(`</svg>`);
    return parts.join('');
}

export const ExportUtils = {
    downloadText(content, filename, mimeType = 'text/plain;charset=utf-8') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    },

    exportCanvasPNG(canvas, filename = 'distribution-chart.png') {
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    },

    exportVectorSVG(context, filename = 'distribution-chart.svg') {
        const svg = vectorSVGFromContext(context);
        if (!svg) return false;
        this.downloadText(svg, filename, 'image/svg+xml;charset=utf-8');
        return true;
    },

    exportCanvasSVGFallback(canvas, filename = 'distribution-chart.svg', metadata = {}) {
        if (!canvas) return;
        const width = canvas.width || 1200;
        const height = canvas.height || 600;
        const pngDataUrl = canvas.toDataURL('image/png', 1.0);
        const title = esc(metadata.title || 'Distribution Chart');
        const desc = esc(metadata.description || 'Exported from Distribution Lab');
        const svg = [
            `<?xml version="1.0" encoding="UTF-8"?>`,
            `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">`,
            `<title>${title}</title>`,
            `<desc>${desc}</desc>`,
            `<image href="${pngDataUrl}" x="0" y="0" width="${width}" height="${height}" />`,
            `</svg>`
        ].join('');
        this.downloadText(svg, filename, 'image/svg+xml;charset=utf-8');
    },

    exportCanvasPDF(canvas, filename = 'distribution-chart.pdf') {
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const html = [
            '<!doctype html><html><head><meta charset="utf-8"><title>PDF Export</title>',
            '<style>html,body{margin:0;padding:0;background:#fff}img{width:100%;height:auto;display:block}</style>',
            '</head><body><img src="', dataUrl, '" alt="chart"/></body></html>'
        ].join('');
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.open();
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => {
            win.print();
            win.close();
        }, 250);
        return filename;
    },

    async copyCanvasToClipboard(canvas) {
        if (!canvas || !navigator.clipboard || typeof ClipboardItem === 'undefined') return false;
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
        if (!blob) return false;
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        return true;
    },

    exportJSON(payload, filename = 'distribution-config.json') {
        const text = JSON.stringify(payload, null, 2);
        this.downloadText(text, filename, 'application/json;charset=utf-8');
    },

    exportGroupSummaryCSV(groups = [], filename = 'distribution-summary.csv') {
        if (!Array.isArray(groups) || !groups.length) return;
        const header = [
            'group',
            'n',
            'min',
            'q1',
            'median',
            'mean',
            'q3',
            'max',
            'iqr',
            'lower_whisker',
            'upper_whisker',
            'outliers_count'
        ];
        const rows = groups.map((group) => {
            const s = group.summary || {};
            const outliers = Array.isArray(s.outliers) ? s.outliers.length : 0;
            return [
                group.label ?? '',
                s.n ?? '',
                s.min ?? '',
                s.q1 ?? '',
                s.median ?? '',
                s.mean ?? '',
                s.q3 ?? '',
                s.max ?? '',
                s.iqr ?? '',
                s.lowerWhisker ?? '',
                s.upperWhisker ?? '',
                outliers
            ];
        });
        const csv = [header, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        this.downloadText(csv, filename, 'text/csv;charset=utf-8');
    }
};
