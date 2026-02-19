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

function hexToRgba(color, alpha = 1) {
    const hex = String(color || '#2563eb').trim().replace('#', '');
    const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    if (full.length !== 6) return `rgba(37,99,235,${alpha})`;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default {
    id: 'raincloud',
    name: { en: 'Raincloud', es: 'Raincloud' },
    description: {
        en: 'Raincloud chart renderer',
        es: 'Renderizador de gráfico raincloud'
    },

    render(canvas, groups, options = {}) {
        const orientation = options.orientation || 'horizontal';
        if (orientation === 'vertical') {
            this.renderVertical(canvas, groups, options);
            return;
        }
        this.renderHorizontal(canvas, groups, options);
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
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        if (!groups.length) return;

        const chartLeft = margin.left;
        const chartRight = width - margin.right;
        const chartTop = margin.top;
        const chartBottom = height - margin.bottom;
        const chartWidth = chartRight - chartLeft;
        const showGrid = options.showGrid !== false;
        const showOutliers = options.showOutliers !== false;
        const showJitter = options.showJitter !== false;
        const fontFamily = options.fontFamily || 'Arial, sans-serif';
        const labelFontSize = options.labelFontSize || 12;
        const title = options.title || 'Raincloud';
        const palette = options.palette || ['#2563eb', '#3b82f6', '#38bdf8'];
        const lineWidth = options.lineWidth || 1.8;
        const jitterSize = options.jitterSize || 1.6;
        const jitterAlpha = options.jitterAlpha || 0.35;
        const outlierSize = options.outlierSize || 2.2;
        const outlierColor = options.outlierColor || '#ef4444';
        const violinOpacity = options.violinOpacity || 0.45;
        const kdeSteps = Math.max(40, Number(options.kdeSteps || 70));
        const kdeBandwidthFactor = Math.max(0.2, Number(options.kdeBandwidthFactor || 1));

        const allValues = groups.flatMap((g) => g.values || []);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const safeRange = maxValue - minValue || 1;
        const scaleX = (value) => chartLeft + ((value - minValue) / safeRange) * chartWidth;
        const domain = Array.from({ length: kdeSteps }, (_, i) => minValue + (safeRange * i) / (kdeSteps - 1));

        ctx.fillStyle = '#0f172a';
        ctx.font = `700 ${options.titleFontSize || 20}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, 20, 28);

        if (showGrid) {
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
                ctx.fillText((minValue + (safeRange * i) / 5).toFixed(2), x, chartBottom + 24);
            }
        }

        groups.forEach((group, index) => {
            const yCenter = chartTop + index * (groupHeight + groupGap) + groupHeight / 2;
            const color = palette[index % palette.length];
            const s = group.summary;
            const halfWidth = Math.max(8, groupHeight / 2 - 2);

            const bandwidth = silvermanBandwidth(group.values, minValue, maxValue) * kdeBandwidthFactor;
            const density = KDE.estimate(group.values, domain, bandwidth);
            const maxDensity = Math.max(...density.map((d) => d[1]), 0.0001);

            const cloudBase = yCenter - 3;
            const cloudPath = density.map(([x, d]) => ({ x: scaleX(x), y: cloudBase - (d / maxDensity) * (halfWidth * 0.95) }));
            ctx.beginPath();
            ctx.moveTo(cloudPath[0].x, cloudBase);
            cloudPath.forEach((p) => ctx.lineTo(p.x, p.y));
            ctx.lineTo(cloudPath[cloudPath.length - 1].x, cloudBase);
            ctx.closePath();
            ctx.fillStyle = hexToRgba(color, violinOpacity);
            ctx.fill();
            ctx.strokeStyle = hexToRgba(color, Math.min(1, violinOpacity + 0.3));
            ctx.lineWidth = 1.1;
            ctx.stroke();

            const boxY = yCenter + 4;
            const boxH = Math.max(10, groupHeight * 0.35);
            const xMin = scaleX(s.lowerWhisker);
            const xQ1 = scaleX(s.q1);
            const xMed = scaleX(s.median);
            const xQ3 = scaleX(s.q3);
            const xMax = scaleX(s.upperWhisker);

            ctx.strokeStyle = '#475569';
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(xMin, boxY + boxH / 2);
            ctx.lineTo(xQ1, boxY + boxH / 2);
            ctx.moveTo(xQ3, boxY + boxH / 2);
            ctx.lineTo(xMax, boxY + boxH / 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(xMin, boxY + 1);
            ctx.lineTo(xMin, boxY + boxH - 1);
            ctx.moveTo(xMax, boxY + 1);
            ctx.lineTo(xMax, boxY + boxH - 1);
            ctx.stroke();

            ctx.fillStyle = '#ffffffdd';
            ctx.fillRect(xQ1, boxY, Math.max(1, xQ3 - xQ1), boxH);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.1;
            ctx.strokeRect(xQ1, boxY, Math.max(1, xQ3 - xQ1), boxH);

            ctx.beginPath();
            ctx.moveTo(xMed, boxY);
            ctx.lineTo(xMed, boxY + boxH);
            ctx.strokeStyle = '#111827';
            ctx.lineWidth = lineWidth;
            ctx.stroke();

            if (showJitter) {
                ctx.fillStyle = hexToRgba('#0f172a', jitterAlpha);
                group.values.forEach((v) => {
                    const x = scaleX(v);
                    const y = yCenter + 8 + (Math.random() - 0.5) * (halfWidth * 0.8);
                    ctx.beginPath();
                    ctx.arc(x, y, jitterSize, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            if (showOutliers) {
                ctx.fillStyle = outlierColor;
                (s.outliers || []).forEach((v) => {
                    ctx.beginPath();
                    ctx.arc(scaleX(v), boxY + boxH / 2, outlierSize, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            const metric = (options.annotations?.groupMetric || 'median') === 'mean' ? s.mean : s.median;
            drawGroupMetricMarker(ctx, {
                enabled: options.annotations?.showGroupMarker === true,
                style: options.annotations?.groupMarkerStyle || 'point',
                color: options.annotations?.groupMarkerColor || '#7c3aed',
                size: options.annotations?.groupMarkerSize || 4,
                span: Math.max(8, groupHeight * 0.35),
                orientation: 'horizontal',
                value: metric,
                scaleX,
                yCenter: boxY + boxH / 2
            });

            ctx.fillStyle = '#0f172a';
            ctx.font = `${labelFontSize}px ${fontFamily}`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${group.label} (n=${s.n})`, margin.left - 10, yCenter + 2);
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
    },

    renderVertical(canvas, groups, options) {
        const ctx = canvas.getContext('2d');
        const width = options.width || 1200;
        const groupHeight = options.groupHeight || 34;
        const groupGap = options.groupGap || 16;
        const minCanvasHeight = options.minCanvasHeight || 520;
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
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        if (!groups.length) return;

        const chartLeft = margin.left;
        const chartRight = width - margin.right;
        const chartTop = margin.top;
        const chartBottom = height - margin.bottom;
        const chartHeight = chartBottom - chartTop;
        const chartWidth = chartRight - chartLeft;
        const slotWidth = chartWidth / Math.max(1, groups.length);
        const showGrid = options.showGrid !== false;
        const showOutliers = options.showOutliers !== false;
        const showJitter = options.showJitter !== false;
        const fontFamily = options.fontFamily || 'Arial, sans-serif';
        const labelFontSize = options.labelFontSize || 12;
        const title = options.title || 'Raincloud';
        const palette = options.palette || ['#2563eb', '#3b82f6', '#38bdf8'];
        const lineWidth = options.lineWidth || 1.8;
        const jitterSize = options.jitterSize || 1.6;
        const jitterAlpha = options.jitterAlpha || 0.35;
        const outlierSize = options.outlierSize || 2.2;
        const outlierColor = options.outlierColor || '#ef4444';
        const violinOpacity = options.violinOpacity || 0.45;
        const kdeSteps = Math.max(40, Number(options.kdeSteps || 70));
        const kdeBandwidthFactor = Math.max(0.2, Number(options.kdeBandwidthFactor || 1));

        const allValues = groups.flatMap((g) => g.values || []);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const safeRange = maxValue - minValue || 1;
        const scaleY = (value) => chartBottom - ((value - minValue) / safeRange) * chartHeight;
        const domain = Array.from({ length: kdeSteps }, (_, i) => minValue + (safeRange * i) / (kdeSteps - 1));

        ctx.fillStyle = '#0f172a';
        ctx.font = `700 ${options.titleFontSize || 20}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, 20, 28);

        if (showGrid) {
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
                ctx.fillText((minValue + (safeRange * i) / 5).toFixed(2), chartLeft - 12, y);
            }
        }

        groups.forEach((group, index) => {
            const xCenter = chartLeft + slotWidth * index + slotWidth / 2;
            const color = palette[index % palette.length];
            const s = group.summary;
            const halfWidth = Math.max(8, Math.min(slotWidth * 0.35, groupHeight));

            const bandwidth = silvermanBandwidth(group.values, minValue, maxValue) * kdeBandwidthFactor;
            const density = KDE.estimate(group.values, domain, bandwidth);
            const maxDensity = Math.max(...density.map((d) => d[1]), 0.0001);

            const cloudBase = xCenter - 3;
            const cloudPath = density.map(([v, d]) => ({ x: cloudBase - (d / maxDensity) * (halfWidth * 0.95), y: scaleY(v) }));
            ctx.beginPath();
            ctx.moveTo(cloudBase, cloudPath[0].y);
            cloudPath.forEach((p) => ctx.lineTo(p.x, p.y));
            ctx.lineTo(cloudBase, cloudPath[cloudPath.length - 1].y);
            ctx.closePath();
            ctx.fillStyle = hexToRgba(color, violinOpacity);
            ctx.fill();
            ctx.strokeStyle = hexToRgba(color, Math.min(1, violinOpacity + 0.3));
            ctx.lineWidth = 1.1;
            ctx.stroke();

            const boxX = xCenter + 4;
            const boxW = Math.max(10, Math.min(slotWidth * 0.28, groupHeight * 0.8));
            const yMin = scaleY(s.lowerWhisker);
            const yQ1 = scaleY(s.q1);
            const yMed = scaleY(s.median);
            const yQ3 = scaleY(s.q3);
            const yMax = scaleY(s.upperWhisker);

            ctx.strokeStyle = '#475569';
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(boxX + boxW / 2, yMin);
            ctx.lineTo(boxX + boxW / 2, yQ3);
            ctx.moveTo(boxX + boxW / 2, yQ1);
            ctx.lineTo(boxX + boxW / 2, yMax);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(boxX + 1, yMin);
            ctx.lineTo(boxX + boxW - 1, yMin);
            ctx.moveTo(boxX + 1, yMax);
            ctx.lineTo(boxX + boxW - 1, yMax);
            ctx.stroke();

            const boxTop = Math.min(yQ1, yQ3);
            const boxBottom = Math.max(yQ1, yQ3);
            ctx.fillStyle = '#ffffffdd';
            ctx.fillRect(boxX, boxTop, boxW, Math.max(1, boxBottom - boxTop));
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.1;
            ctx.strokeRect(boxX, boxTop, boxW, Math.max(1, boxBottom - boxTop));

            ctx.beginPath();
            ctx.moveTo(boxX, yMed);
            ctx.lineTo(boxX + boxW, yMed);
            ctx.strokeStyle = '#111827';
            ctx.lineWidth = lineWidth;
            ctx.stroke();

            if (showJitter) {
                ctx.fillStyle = hexToRgba('#0f172a', jitterAlpha);
                group.values.forEach((v) => {
                    const y = scaleY(v);
                    const x = xCenter + 8 + (Math.random() - 0.5) * (halfWidth * 0.8);
                    ctx.beginPath();
                    ctx.arc(x, y, jitterSize, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            if (showOutliers) {
                ctx.fillStyle = outlierColor;
                (s.outliers || []).forEach((v) => {
                    ctx.beginPath();
                    ctx.arc(boxX + boxW / 2, scaleY(v), outlierSize, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            const metric = (options.annotations?.groupMetric || 'median') === 'mean' ? s.mean : s.median;
            drawGroupMetricMarker(ctx, {
                enabled: options.annotations?.showGroupMarker === true,
                style: options.annotations?.groupMarkerStyle || 'point',
                color: options.annotations?.groupMarkerColor || '#7c3aed',
                size: options.annotations?.groupMarkerSize || 4,
                span: Math.max(8, boxW * 0.9),
                orientation: 'vertical',
                value: metric,
                scaleY,
                xCenter: boxX + boxW / 2
            });

            ctx.fillStyle = '#0f172a';
            ctx.font = `${labelFontSize}px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const label = `${group.label} (n=${s.n})`;
            const clipped = label.length > 18 ? `${label.slice(0, 18)}...` : label;
            ctx.fillText(clipped, xCenter, chartBottom + 10);
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
    }
};
