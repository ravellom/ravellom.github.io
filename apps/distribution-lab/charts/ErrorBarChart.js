import { drawAnnotations } from './Annotations.js';

function computeError(values = [], summary = {}, mode = 'sd', ciLevel = 95) {
    const n = Number(summary.n || values.length || 0);
    if (!n) return { lower: NaN, upper: NaN, mean: NaN };
    const mean = Number(summary.mean);
    const sd = values.length > 1
        ? Math.sqrt(values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1))
        : 0;
    const se = n > 0 ? sd / Math.sqrt(n) : 0;
    const z = Math.max(0.5, Number(ciLevel || 95) / 100) === 0.99 ? 2.576 : 1.96;

    if (mode === 'se') return { lower: mean - se, upper: mean + se, mean };
    if (mode === 'ci95' || mode === 'ci') return { lower: mean - z * se, upper: mean + z * se, mean };
    if (mode === 'minmax') return { lower: Number(summary.min), upper: Number(summary.max), mean };
    return { lower: mean - sd, upper: mean + sd, mean };
}

export default {
    id: 'errorbar',
    name: { en: 'Mean + Error Bars', es: 'Media + Barras de error' },
    description: {
        en: 'Bar chart with configurable error bars',
        es: 'Gráfico de barras con barras de error configurables'
    },

    render(canvas, groups, options = {}) {
        const orientation = options.orientation || 'vertical';
        if (orientation === 'horizontal') {
            this.renderHorizontal(canvas, groups, options);
            return;
        }
        this.renderVertical(canvas, groups, options);
    },

    renderVertical(canvas, groups, options) {
        const ctx = canvas.getContext('2d');
        const width = options.width || 1200;
        const minCanvasHeight = options.minCanvasHeight || 480;
        const margin = {
            top: options.marginTop || 60,
            right: options.marginRight || 80,
            bottom: options.marginBottom || 90,
            left: options.marginLeft || 120
        };
        const height = Math.max(minCanvasHeight, 520);
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        if (!groups.length) return;

        const fontFamily = options.fontFamily || 'Arial, sans-serif';
        const labelFontSize = options.labelFontSize || 12;
        const titleSize = options.titleFontSize || 20;
        const palette = options.palette || ['#2563eb', '#3b82f6', '#38bdf8'];
        const lineWidth = options.lineWidth || 2;
        const chartLeft = margin.left;
        const chartRight = width - margin.right;
        const chartTop = margin.top;
        const chartBottom = height - margin.bottom;
        const chartWidth = chartRight - chartLeft;
        const chartHeight = chartBottom - chartTop;
        const slotWidth = chartWidth / Math.max(1, groups.length);
        const barWidth = Math.max(16, Math.min(slotWidth * 0.68, 120));
        const errorMode = options.errorMetric || 'sd';
        const ciLevel = options.errorCiLevel || 95;

        const enriched = groups.map((g) => {
            const err = computeError(g.values || [], g.summary || {}, errorMode, ciLevel);
            return { ...g, err };
        });
        const allValues = enriched.flatMap((g) => [g.err.lower, g.err.upper, g.err.mean]).filter(Number.isFinite);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const pad = (maxValue - minValue || 1) * 0.1;
        const yMin = Math.min(0, minValue - pad);
        const yMax = maxValue + pad;
        const safeRange = yMax - yMin || 1;
        const scaleY = (v) => chartBottom - ((v - yMin) / safeRange) * chartHeight;

        ctx.fillStyle = '#0f172a';
        ctx.font = `700 ${titleSize}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(options.title || 'Mean + Error Bars', 20, 28);

        if (options.showGrid !== false) {
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
                const y = chartBottom - (chartHeight * i) / 5;
                ctx.beginPath();
                ctx.moveTo(chartLeft - 8, y);
                ctx.lineTo(chartRight + 6, y);
                ctx.stroke();
                ctx.fillStyle = '#64748b';
                ctx.font = `${labelFontSize}px ${fontFamily}`;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText((yMin + (safeRange * i) / 5).toFixed(2), chartLeft - 12, y);
            }
        }

        enriched.forEach((g, i) => {
            const x = chartLeft + slotWidth * i + slotWidth / 2;
            const barTop = scaleY(g.err.mean);
            const baseY = scaleY(0);
            const y1 = Math.min(barTop, baseY);
            const h = Math.max(1, Math.abs(baseY - barTop));
            const color = palette[i % palette.length];

            ctx.fillStyle = color;
            ctx.fillRect(x - barWidth / 2, y1, barWidth, h);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(x - barWidth / 2, y1, barWidth, h);

            const yLower = scaleY(g.err.lower);
            const yUpper = scaleY(g.err.upper);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(x, yLower);
            ctx.lineTo(x, yUpper);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x - 10, yLower);
            ctx.lineTo(x + 10, yLower);
            ctx.moveTo(x - 10, yUpper);
            ctx.lineTo(x + 10, yUpper);
            ctx.stroke();

            ctx.fillStyle = '#0f172a';
            ctx.font = `${labelFontSize}px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const label = `${g.label} (n=${g.summary?.n || 0})`;
            const clipped = label.length > 18 ? `${label.slice(0, 18)}...` : label;
            ctx.fillText(clipped, x, chartBottom + 10);
        });

        drawAnnotations(ctx, {
            ...(options.annotations || {}),
            orientation: 'vertical',
            chartLeft,
            chartRight,
            chartTop,
            chartBottom,
            scaleY,
            fontFamily,
            labelFontSize
        });
    },

    renderHorizontal(canvas, groups, options) {
        const ctx = canvas.getContext('2d');
        const width = options.width || 1200;
        const groupHeight = options.groupHeight || 34;
        const groupGap = options.groupGap || 16;
        const minCanvasHeight = options.minCanvasHeight || 420;
        const margin = {
            top: options.marginTop || 60,
            right: options.marginRight || 80,
            bottom: options.marginBottom || 70,
            left: options.marginLeft || 220
        };
        const height = Math.max(minCanvasHeight, margin.top + margin.bottom + groups.length * (groupHeight + groupGap));
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        if (!groups.length) return;

        const fontFamily = options.fontFamily || 'Arial, sans-serif';
        const labelFontSize = options.labelFontSize || 12;
        const titleSize = options.titleFontSize || 20;
        const palette = options.palette || ['#2563eb', '#3b82f6', '#38bdf8'];
        const lineWidth = options.lineWidth || 2;
        const chartLeft = margin.left;
        const chartRight = width - margin.right;
        const chartTop = margin.top;
        const chartBottom = height - margin.bottom;
        const chartWidth = chartRight - chartLeft;
        const errorMode = options.errorMetric || 'sd';
        const ciLevel = options.errorCiLevel || 95;

        const enriched = groups.map((g) => {
            const err = computeError(g.values || [], g.summary || {}, errorMode, ciLevel);
            return { ...g, err };
        });
        const allValues = enriched.flatMap((g) => [g.err.lower, g.err.upper, g.err.mean]).filter(Number.isFinite);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const pad = (maxValue - minValue || 1) * 0.1;
        const xMin = Math.min(0, minValue - pad);
        const xMax = maxValue + pad;
        const safeRange = xMax - xMin || 1;
        const scaleX = (v) => chartLeft + ((v - xMin) / safeRange) * chartWidth;

        ctx.fillStyle = '#0f172a';
        ctx.font = `700 ${titleSize}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(options.title || 'Mean + Error Bars', 20, 28);

        if (options.showGrid !== false) {
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
                const x = chartLeft + (chartWidth * i) / 5;
                ctx.beginPath();
                ctx.moveTo(x, chartTop - 8);
                ctx.lineTo(x, chartBottom + 6);
                ctx.stroke();
                ctx.fillStyle = '#64748b';
                ctx.font = `${labelFontSize}px ${fontFamily}`;
                ctx.textAlign = 'center';
                ctx.fillText((xMin + (safeRange * i) / 5).toFixed(2), x, chartBottom + 24);
            }
        }

        enriched.forEach((g, i) => {
            const y = chartTop + i * (groupHeight + groupGap) + groupHeight / 2;
            const barH = Math.max(10, groupHeight * 0.7);
            const x0 = scaleX(0);
            const xMean = scaleX(g.err.mean);
            const barX = Math.min(x0, xMean);
            const barW = Math.max(1, Math.abs(xMean - x0));
            const color = palette[i % palette.length];

            ctx.fillStyle = color;
            ctx.fillRect(barX, y - barH / 2, barW, barH);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(barX, y - barH / 2, barW, barH);

            const xl = scaleX(g.err.lower);
            const xu = scaleX(g.err.upper);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(xl, y);
            ctx.lineTo(xu, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(xl, y - 8);
            ctx.lineTo(xl, y + 8);
            ctx.moveTo(xu, y - 8);
            ctx.lineTo(xu, y + 8);
            ctx.stroke();

            ctx.fillStyle = '#0f172a';
            ctx.font = `${labelFontSize}px ${fontFamily}`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${g.label} (n=${g.summary?.n || 0})`, margin.left - 10, y);
        });

        drawAnnotations(ctx, {
            ...(options.annotations || {}),
            orientation: 'horizontal',
            chartLeft,
            chartRight,
            chartTop,
            chartBottom,
            scaleX,
            fontFamily,
            labelFontSize
        });
    }
};
