import { drawAnnotations, drawGroupMetricMarker } from './Annotations.js';

export default {
    id: 'boxplot',
    name: { en: 'Boxplot', es: 'Diagrama de caja' },
    description: { en: 'Boxplot renderer', es: 'Renderizador de boxplot' },

    render(canvas, groups, options = {}) {
        const ctx = canvas.getContext('2d');
        const orientation = options.orientation || 'horizontal';
        const width = options.width || 1200;
        const groupSize = options.groupHeight || 34;
        const groupGap = options.groupGap || 16;
        const minCanvasHeight = options.minCanvasHeight || 420;
        const lineWidth = options.lineWidth || 2;
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

        const palette = options.palette || ['#3b82f6', '#38bdf8', '#06b6d4', '#2563eb'];
        const showOutliers = options.showOutliers !== false;
        const title = options.title || 'Boxplot';
        const fontFamily = options.fontFamily || 'Arial, sans-serif';
        const titleFontSize = options.titleFontSize || 20;
        const labelFontSize = options.labelFontSize || 12;
        const outlierSize = options.outlierSize || 2.2;
        const outlierColor = options.outlierColor || '#ef4444';
        const showGrid = options.showGrid !== false;

        const allValues = groups.flatMap((g) => g.values || []);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const safeRange = maxValue - minValue || 1;

        ctx.fillStyle = '#0f172a';
        ctx.font = `700 ${titleFontSize}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, 20, 28);

        if (orientation === 'horizontal') {
            this.drawHorizontal(ctx, groups, {
                width, height, margin, groupSize, groupGap, lineWidth, palette, showOutliers,
                fontFamily, labelFontSize, outlierSize, outlierColor, showGrid,
                minValue, safeRange, annotations: options.annotations || {}
            });
            return;
        }

        this.drawVertical(ctx, groups, {
            width, height, margin, groupSize, groupGap, lineWidth, palette, showOutliers,
            fontFamily, labelFontSize, outlierSize, outlierColor, showGrid,
            minValue, safeRange, annotations: options.annotations || {}
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
                ctx.fillText((cfg.minValue + (cfg.safeRange * i) / 5).toFixed(2), x, cfg.height - cfg.margin.bottom + 24);
            }
        }

        groups.forEach((group, index) => {
            const y = cfg.margin.top + index * (cfg.groupSize + cfg.groupGap) + cfg.groupSize / 2;
            const s = group.summary;
            const xMin = scaleX(s.lowerWhisker);
            const xQ1 = scaleX(s.q1);
            const xMed = scaleX(s.median);
            const xQ3 = scaleX(s.q3);
            const xMax = scaleX(s.upperWhisker);
            const boxColor = cfg.palette[index % cfg.palette.length];

            ctx.strokeStyle = '#475569';
            ctx.lineWidth = cfg.lineWidth;
            ctx.beginPath();
            ctx.moveTo(xMin, y);
            ctx.lineTo(xQ1, y);
            ctx.moveTo(xQ3, y);
            ctx.lineTo(xMax, y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(xMin, y - 8);
            ctx.lineTo(xMin, y + 8);
            ctx.moveTo(xMax, y - 8);
            ctx.lineTo(xMax, y + 8);
            ctx.stroke();

            ctx.fillStyle = boxColor;
            ctx.fillRect(xQ1, y - cfg.groupSize / 2 + 4, Math.max(1, xQ3 - xQ1), cfg.groupSize - 8);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(xQ1, y - cfg.groupSize / 2 + 4, Math.max(1, xQ3 - xQ1), cfg.groupSize - 8);

            ctx.strokeStyle = '#111827';
            ctx.lineWidth = cfg.lineWidth;
            ctx.beginPath();
            ctx.moveTo(xMed, y - cfg.groupSize / 2 + 3);
            ctx.lineTo(xMed, y + cfg.groupSize / 2 - 3);
            ctx.stroke();

            if (cfg.showOutliers) {
                ctx.fillStyle = cfg.outlierColor;
                (s.outliers || []).forEach((outlier) => {
                    const xo = scaleX(outlier);
                    ctx.beginPath();
                    ctx.arc(xo, y, cfg.outlierSize, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            const metric = (cfg.annotations.groupMetric || 'median') === 'mean' ? s.mean : s.median;
            drawGroupMetricMarker(ctx, {
                enabled: cfg.annotations.showGroupMarker === true,
                style: cfg.annotations.groupMarkerStyle || 'point',
                color: cfg.annotations.groupMarkerColor || '#7c3aed',
                size: cfg.annotations.groupMarkerSize || 4,
                span: Math.max(8, cfg.groupSize * 0.35),
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
        const boxWidth = Math.max(10, Math.min(slotWidth * 0.6, cfg.groupSize));

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
            const s = group.summary;
            const yMin = scaleY(s.lowerWhisker);
            const yQ1 = scaleY(s.q1);
            const yMed = scaleY(s.median);
            const yQ3 = scaleY(s.q3);
            const yMax = scaleY(s.upperWhisker);
            const boxColor = cfg.palette[index % cfg.palette.length];

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
            ctx.fillStyle = boxColor;
            ctx.fillRect(xCenter - boxWidth / 2, boxTop, boxWidth, Math.max(1, boxBottom - boxTop));
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(xCenter - boxWidth / 2, boxTop, boxWidth, Math.max(1, boxBottom - boxTop));

            ctx.strokeStyle = '#111827';
            ctx.lineWidth = cfg.lineWidth;
            ctx.beginPath();
            ctx.moveTo(xCenter - boxWidth / 2, yMed);
            ctx.lineTo(xCenter + boxWidth / 2, yMed);
            ctx.stroke();

            if (cfg.showOutliers) {
                ctx.fillStyle = cfg.outlierColor;
                (s.outliers || []).forEach((outlier) => {
                    const yo = scaleY(outlier);
                    ctx.beginPath();
                    ctx.arc(xCenter, yo, cfg.outlierSize, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            const metric = (cfg.annotations.groupMetric || 'median') === 'mean' ? s.mean : s.median;
            drawGroupMetricMarker(ctx, {
                enabled: cfg.annotations.showGroupMarker === true,
                style: cfg.annotations.groupMarkerStyle || 'point',
                color: cfg.annotations.groupMarkerColor || '#7c3aed',
                size: cfg.annotations.groupMarkerSize || 4,
                span: Math.max(8, boxWidth * 0.45),
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
