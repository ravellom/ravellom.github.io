import { KDE } from '../core/KDE.js';
import { drawAnnotations, drawGroupMetricMarker } from './Annotations.js';

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

function clamp(value, min, max, fallback) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, numeric));
}

function hexToRgba(color, alpha = 1) {
    if (typeof color !== 'string') return `rgba(15, 23, 42, ${alpha})`;
    const hex = color.trim().replace('#', '');
    if (![3, 6].includes(hex.length)) return `rgba(15, 23, 42, ${alpha})`;
    const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default {
    id: 'boxviolin',
    name: { en: 'Box + Violin', es: 'Caja + Violin' },
    description: {
        en: 'Combined boxplot + violin renderer',
        es: 'Renderizador combinado caja + violin'
    },

    render(canvas, groups, options = {}) {
        const ctx = canvas.getContext('2d');
        const orientation = options.orientation || 'horizontal';
        const width = options.width || 1200;
        const groupSize = options.groupHeight || 34;
        const groupGap = options.groupGap || 16;
        const minCanvasHeight = options.minCanvasHeight || 420;
        const lineWidth = options.lineWidth || 1.8;
        const margin = {
            top: options.marginTop || 60,
            right: options.marginRight || 80,
            bottom: options.marginBottom || 70,
            left: options.marginLeft || 220
        };
        const dynamicHeight = margin.top + margin.bottom + groups.length * (groupSize + groupGap);
        const height = Math.max(minCanvasHeight, dynamicHeight);

        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        if (!groups.length) return;

        const palette = options.palette || ['#2563eb', '#3b82f6', '#38bdf8'];
        const showJitter = options.showJitter === true;
        const showOutliers = options.showOutliers !== false;
        const showGrid = options.showGrid !== false;
        const title = options.title || 'Box + Violin';
        const fontFamily = options.fontFamily || 'Arial, sans-serif';
        const titleFontSize = options.titleFontSize || 20;
        const labelFontSize = options.labelFontSize || 12;
        const jitterSize = clamp(options.jitterSize, 1, 8, 1.6);
        const jitterAlpha = clamp(options.jitterAlpha, 0.1, 1, 0.4);
        const outlierSize = clamp(options.outlierSize, 1, 10, 2.2);
        const outlierColor = options.outlierColor || '#ef4444';
        const violinOpacity = clamp(options.violinOpacity, 0.1, 1, 0.55);
        const kdeSteps = Math.round(clamp(options.kdeSteps, 30, 260, 70));
        const kdeBandwidthFactor = clamp(options.kdeBandwidthFactor, 0.2, 4, 1);

        const allValues = groups.flatMap((g) => g.values || []);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const safeRange = maxValue - minValue || 1;
        const domain = Array.from({ length: kdeSteps }, (_, i) => minValue + (safeRange * i) / (kdeSteps - 1));

        ctx.fillStyle = '#0f172a';
        ctx.font = `700 ${titleFontSize}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, 20, 28);

        if (orientation === 'vertical') {
            this.drawVertical(ctx, groups, {
                width,
                height,
                margin,
                groupSize,
                groupGap,
                palette,
                showJitter,
                showOutliers,
                showGrid,
                fontFamily,
                labelFontSize,
                lineWidth,
                jitterSize,
                jitterAlpha,
                outlierSize,
                outlierColor,
                violinOpacity,
                domain,
                kdeBandwidthFactor,
                minValue,
                safeRange,
                annotations: options.annotations || {}
            });
            return;
        }

        this.drawHorizontal(ctx, groups, {
            width,
            height,
            margin,
            groupSize,
            groupGap,
            palette,
            showJitter,
            showOutliers,
            showGrid,
            fontFamily,
            labelFontSize,
            lineWidth,
            jitterSize,
            jitterAlpha,
            outlierSize,
            outlierColor,
            violinOpacity,
            domain,
            kdeBandwidthFactor,
            minValue,
            safeRange,
            annotations: options.annotations || {}
        });
    },

    drawHorizontal(ctx, groups, cfg) {
        const chartLeft = cfg.margin.left;
        const chartRight = cfg.width - cfg.margin.right;
        const chartTop = cfg.margin.top;
        const chartBottom = cfg.height - cfg.margin.bottom;
        const chartWidth = chartRight - chartLeft;
        const scaleX = (value) => chartLeft + ((value - cfg.minValue) / cfg.safeRange) * chartWidth;

        if (cfg.showGrid) {
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
                const x = chartLeft + (chartWidth * i) / 5;
                ctx.beginPath();
                ctx.moveTo(x, cfg.margin.top - 8);
                ctx.lineTo(x, cfg.height - cfg.margin.bottom + 6);
                ctx.stroke();
                ctx.fillStyle = '#64748b';
                ctx.font = `${cfg.labelFontSize}px ${cfg.fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText((cfg.minValue + (cfg.safeRange * i) / 5).toFixed(2), x, cfg.height - cfg.margin.bottom + 12);
            }
        }

        groups.forEach((group, index) => {
            const y = cfg.margin.top + index * (cfg.groupSize + cfg.groupGap) + cfg.groupSize / 2;
            const color = cfg.palette[index % cfg.palette.length];
            const bandwidth = silvermanBandwidth(group.values, cfg.minValue, cfg.minValue + cfg.safeRange) * cfg.kdeBandwidthFactor;
            const density = KDE.estimate(group.values, cfg.domain, bandwidth);
            const maxDensity = Math.max(...density.map((d) => d[1]), 0.0001);
            const halfWidth = Math.max(8, cfg.groupSize / 2 - 2);

            const topPath = density.map(([x, d]) => ({ x: scaleX(x), y: y - (d / maxDensity) * halfWidth }));
            const bottomPath = density.slice().reverse().map(([x, d]) => ({ x: scaleX(x), y: y + (d / maxDensity) * halfWidth }));

            ctx.beginPath();
            ctx.moveTo(topPath[0].x, topPath[0].y);
            topPath.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
            bottomPath.forEach((p) => ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.fillStyle = hexToRgba(color, cfg.violinOpacity);
            ctx.fill();
            ctx.strokeStyle = hexToRgba(color, Math.min(1, cfg.violinOpacity + 0.3));
            ctx.lineWidth = 1.1;
            ctx.stroke();

            const s = group.summary;
            const xMin = scaleX(s.lowerWhisker);
            const xQ1 = scaleX(s.q1);
            const xMed = scaleX(s.median);
            const xQ3 = scaleX(s.q3);
            const xMax = scaleX(s.upperWhisker);

            ctx.strokeStyle = '#475569';
            ctx.lineWidth = cfg.lineWidth;
            ctx.beginPath();
            ctx.moveTo(xMin, y);
            ctx.lineTo(xQ1, y);
            ctx.moveTo(xQ3, y);
            ctx.lineTo(xMax, y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(xMin, y - 7);
            ctx.lineTo(xMin, y + 7);
            ctx.moveTo(xMax, y - 7);
            ctx.lineTo(xMax, y + 7);
            ctx.stroke();

            ctx.fillStyle = '#ffffffcc';
            ctx.fillRect(xQ1, y - 7, Math.max(1, xQ3 - xQ1), 14);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = Math.max(1, cfg.lineWidth - 0.3);
            ctx.strokeRect(xQ1, y - 7, Math.max(1, xQ3 - xQ1), 14);

            ctx.strokeStyle = '#111827';
            ctx.lineWidth = cfg.lineWidth;
            ctx.beginPath();
            ctx.moveTo(xMed, y - 8);
            ctx.lineTo(xMed, y + 8);
            ctx.stroke();

            if (cfg.showJitter) {
                ctx.fillStyle = hexToRgba('#0f172a', cfg.jitterAlpha);
                group.values.forEach((v) => {
                    const x = scaleX(v);
                    const jitter = (Math.random() - 0.5) * (halfWidth * 1.3);
                    ctx.beginPath();
                    ctx.arc(x, y + jitter, cfg.jitterSize, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            if (cfg.showOutliers) {
                ctx.fillStyle = cfg.outlierColor;
                (s.outliers || []).forEach((v) => {
                    ctx.beginPath();
                    ctx.arc(scaleX(v), y, cfg.outlierSize, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            const metric = (cfg.annotations.groupMetric || 'median') === 'mean' ? s.mean : s.median;
            drawGroupMetricMarker(ctx, {
                enabled: cfg.annotations.showGroupMarker === true,
                style: cfg.annotations.groupMarkerStyle || 'point',
                color: cfg.annotations.groupMarkerColor || '#7c3aed',
                size: cfg.annotations.groupMarkerSize || 4,
                span: Math.max(8, halfWidth * 0.85),
                orientation: 'horizontal',
                value: metric,
                scaleX,
                yCenter: y
            });

            ctx.fillStyle = '#0f172a';
            ctx.font = `${cfg.labelFontSize}px ${cfg.fontFamily}`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${group.label} (n=${s.n})`, cfg.margin.left - 10, y);
        });

        drawAnnotations(ctx, {
            ...cfg.annotations,
            orientation: 'horizontal',
            chartLeft,
            chartRight,
            chartTop,
            chartBottom,
            scaleX,
            fontFamily: cfg.fontFamily,
            labelFontSize: cfg.labelFontSize
        });
    },

    drawVertical(ctx, groups, cfg) {
        const chartTop = cfg.margin.top;
        const chartBottom = cfg.height - cfg.margin.bottom;
        const chartHeight = chartBottom - chartTop;
        const chartLeft = cfg.margin.left;
        const chartRight = cfg.width - cfg.margin.right;
        const chartWidth = chartRight - chartLeft;
        const scaleY = (value) => chartBottom - ((value - cfg.minValue) / cfg.safeRange) * chartHeight;
        const slotWidth = chartWidth / Math.max(1, groups.length);
        const boxWidth = Math.max(10, Math.min(slotWidth * 0.55, cfg.groupSize));

        if (cfg.showGrid) {
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
                const y = chartBottom - (chartHeight * i) / 5;
                ctx.beginPath();
                ctx.moveTo(chartLeft - 8, y);
                ctx.lineTo(chartRight + 6, y);
                ctx.stroke();
                ctx.fillStyle = '#64748b';
                ctx.font = `${cfg.labelFontSize}px ${cfg.fontFamily}`;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                ctx.fillText((cfg.minValue + (cfg.safeRange * i) / 5).toFixed(2), chartLeft - 12, y);
            }
        }

        groups.forEach((group, index) => {
            const xCenter = chartLeft + slotWidth * index + slotWidth / 2;
            const color = cfg.palette[index % cfg.palette.length];
            const bandwidth = silvermanBandwidth(group.values, cfg.minValue, cfg.minValue + cfg.safeRange) * cfg.kdeBandwidthFactor;
            const density = KDE.estimate(group.values, cfg.domain, bandwidth);
            const maxDensity = Math.max(...density.map((d) => d[1]), 0.0001);
            const halfWidth = Math.max(8, Math.min(slotWidth * 0.44, cfg.groupSize));

            const leftPath = density.map(([v, d]) => ({ x: xCenter - (d / maxDensity) * halfWidth, y: scaleY(v) }));
            const rightPath = density.slice().reverse().map(([v, d]) => ({ x: xCenter + (d / maxDensity) * halfWidth, y: scaleY(v) }));

            ctx.beginPath();
            ctx.moveTo(leftPath[0].x, leftPath[0].y);
            leftPath.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
            rightPath.forEach((p) => ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.fillStyle = hexToRgba(color, cfg.violinOpacity);
            ctx.fill();
            ctx.strokeStyle = hexToRgba(color, Math.min(1, cfg.violinOpacity + 0.3));
            ctx.lineWidth = 1.1;
            ctx.stroke();

            const s = group.summary;
            const yMin = scaleY(s.lowerWhisker);
            const yQ1 = scaleY(s.q1);
            const yMed = scaleY(s.median);
            const yQ3 = scaleY(s.q3);
            const yMax = scaleY(s.upperWhisker);

            ctx.strokeStyle = '#475569';
            ctx.lineWidth = cfg.lineWidth;
            ctx.beginPath();
            ctx.moveTo(xCenter, yMin);
            ctx.lineTo(xCenter, yQ3);
            ctx.moveTo(xCenter, yQ1);
            ctx.lineTo(xCenter, yMax);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(xCenter - 8, yMin);
            ctx.lineTo(xCenter + 8, yMin);
            ctx.moveTo(xCenter - 8, yMax);
            ctx.lineTo(xCenter + 8, yMax);
            ctx.stroke();

            const boxTop = Math.min(yQ1, yQ3);
            const boxBottom = Math.max(yQ1, yQ3);
            ctx.fillStyle = '#ffffffcc';
            ctx.fillRect(xCenter - boxWidth / 2, boxTop, boxWidth, Math.max(1, boxBottom - boxTop));
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = Math.max(1, cfg.lineWidth - 0.3);
            ctx.strokeRect(xCenter - boxWidth / 2, boxTop, boxWidth, Math.max(1, boxBottom - boxTop));

            ctx.strokeStyle = '#111827';
            ctx.lineWidth = cfg.lineWidth;
            ctx.beginPath();
            ctx.moveTo(xCenter - boxWidth / 2, yMed);
            ctx.lineTo(xCenter + boxWidth / 2, yMed);
            ctx.stroke();

            if (cfg.showJitter) {
                ctx.fillStyle = hexToRgba('#0f172a', cfg.jitterAlpha);
                group.values.forEach((v) => {
                    const y = scaleY(v);
                    const jitter = (Math.random() - 0.5) * (halfWidth * 1.3);
                    ctx.beginPath();
                    ctx.arc(xCenter + jitter, y, cfg.jitterSize, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            if (cfg.showOutliers) {
                ctx.fillStyle = cfg.outlierColor;
                (s.outliers || []).forEach((v) => {
                    ctx.beginPath();
                    ctx.arc(xCenter, scaleY(v), cfg.outlierSize, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            const metric = (cfg.annotations.groupMetric || 'median') === 'mean' ? s.mean : s.median;
            drawGroupMetricMarker(ctx, {
                enabled: cfg.annotations.showGroupMarker === true,
                style: cfg.annotations.groupMarkerStyle || 'point',
                color: cfg.annotations.groupMarkerColor || '#7c3aed',
                size: cfg.annotations.groupMarkerSize || 4,
                span: Math.max(8, halfWidth * 0.85),
                orientation: 'vertical',
                value: metric,
                scaleY,
                xCenter
            });

            ctx.fillStyle = '#0f172a';
            ctx.font = `${cfg.labelFontSize}px ${cfg.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const label = `${group.label} (n=${s.n})`;
            const clipped = label.length > 18 ? `${label.slice(0, 18)}...` : label;
            ctx.fillText(clipped, xCenter, chartBottom + 10);
        });

        drawAnnotations(ctx, {
            ...cfg.annotations,
            orientation: 'vertical',
            chartLeft,
            chartRight,
            chartTop,
            chartBottom,
            scaleY,
            fontFamily: cfg.fontFamily,
            labelFontSize: cfg.labelFontSize
        });
    }
};
