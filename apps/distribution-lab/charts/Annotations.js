function clamp(value, min, max, fallback) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, numeric));
}

function drawStatsBox(ctx, cfg) {
    if (!cfg.showStats || !cfg.stats || !Number.isFinite(cfg.stats.n) || cfg.stats.n <= 0) return;

    const fields = cfg.statsFields || {};
    const lines = [];
    if (fields.n !== false) lines.push(`n = ${cfg.stats.n}`);
    if (fields.mean !== false && Number.isFinite(cfg.stats.mean)) lines.push(`mean = ${cfg.stats.mean.toFixed(3)}`);
    if (fields.median !== false && Number.isFinite(cfg.stats.median)) lines.push(`median = ${cfg.stats.median.toFixed(3)}`);
    if (fields.sd !== false && Number.isFinite(cfg.stats.sd)) lines.push(`sd = ${cfg.stats.sd.toFixed(3)}`);
    if (fields.iqr !== false && Number.isFinite(cfg.stats.iqr)) lines.push(`iqr = ${cfg.stats.iqr.toFixed(3)}`);
    if (!lines.length) return;

    const pad = 8;
    const lineHeight = Math.max(14, cfg.labelFontSize + 2);
    ctx.save();
    ctx.font = `${cfg.labelFontSize}px ${cfg.fontFamily}`;
    const textWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
    const boxWidth = textWidth + pad * 2;
    const boxHeight = lines.length * lineHeight + pad * 2;

    const chartWidth = cfg.chartRight - cfg.chartLeft;
    const chartHeight = cfg.chartBottom - cfg.chartTop;
    const offset = 10;
    let x = cfg.chartRight - boxWidth - offset;
    let y = cfg.chartTop + offset;

    switch (cfg.statsPosition) {
        case 'top_left':
            x = cfg.chartLeft + offset;
            y = cfg.chartTop + offset;
            break;
        case 'bottom_left':
            x = cfg.chartLeft + offset;
            y = cfg.chartBottom - boxHeight - offset;
            break;
        case 'bottom_right':
            x = cfg.chartRight - boxWidth - offset;
            y = cfg.chartBottom - boxHeight - offset;
            break;
        default:
            break;
    }

    x = clamp(x, cfg.chartLeft, cfg.chartLeft + chartWidth - boxWidth, cfg.chartLeft + offset);
    y = clamp(y, cfg.chartTop, cfg.chartTop + chartHeight - boxHeight, cfg.chartTop + offset);

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

function drawCustomText(ctx, cfg) {
    const text = String(cfg.annotationText || '').trim();
    if (!text) return;
    const xPct = clamp(cfg.annotationX, 0, 100, 80);
    const yPct = clamp(cfg.annotationY, 0, 100, 12);
    const x = cfg.chartLeft + ((cfg.chartRight - cfg.chartLeft) * xPct) / 100;
    const y = cfg.chartTop + ((cfg.chartBottom - cfg.chartTop) * yPct) / 100;

    ctx.save();
    ctx.fillStyle = cfg.annotationColor || '#111827';
    ctx.font = `${Math.round(clamp(cfg.annotationSize, 10, 40, 13))}px ${cfg.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
}

function drawMeanLine(ctx, cfg) {
    if (!cfg.showMeanLine || !Number.isFinite(cfg.meanValue)) return;

    const dash = clamp(cfg.meanLineDash, 2, 40, 8);
    const gap = clamp(cfg.meanLineGap, 2, 40, 6);
    const lineWidth = clamp(cfg.meanLineWidth, 1, 8, 1.6);
    const color = cfg.meanLineColor || '#0f172a';

    ctx.save();
    ctx.setLineDash([dash, gap]);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    if (cfg.orientation === 'vertical' && typeof cfg.scaleY === 'function') {
        const y = cfg.scaleY(cfg.meanValue);
        ctx.moveTo(cfg.chartLeft, y);
        ctx.lineTo(cfg.chartRight, y);
        ctx.stroke();
        if (cfg.showMeanLabel) {
            ctx.setLineDash([]);
            ctx.fillStyle = color;
            ctx.font = `${cfg.labelFontSize}px ${cfg.fontFamily}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`mean = ${cfg.meanValue.toFixed(3)}`, cfg.chartLeft + 6, y - 4);
        }
        ctx.restore();
        return;
    }

    if (typeof cfg.scaleX === 'function') {
        const x = cfg.scaleX(cfg.meanValue);
        ctx.moveTo(x, cfg.chartTop);
        ctx.lineTo(x, cfg.chartBottom);
        ctx.stroke();
        if (cfg.showMeanLabel) {
            ctx.setLineDash([]);
            ctx.fillStyle = color;
            ctx.font = `${cfg.labelFontSize}px ${cfg.fontFamily}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(`mean = ${cfg.meanValue.toFixed(3)}`, x + 6, cfg.chartTop + 6);
        }
    }
    ctx.restore();
}

export function drawAnnotations(ctx, cfg) {
    drawMeanLine(ctx, cfg);
    drawStatsBox(ctx, cfg);
    drawCustomText(ctx, cfg);
}

export function drawGroupMetricMarker(ctx, cfg) {
    if (!cfg || !cfg.enabled) return;
    const style = cfg.style || 'point';
    const color = cfg.color || '#7c3aed';
    const size = clamp(cfg.size, 2, 20, 5);
    const span = clamp(cfg.span, 6, 60, Math.max(8, size * 2));

    if (cfg.orientation === 'vertical') {
        if (typeof cfg.scaleY !== 'function' || !Number.isFinite(cfg.value) || !Number.isFinite(cfg.xCenter)) return;
        const y = cfg.scaleY(cfg.value);
        const x = cfg.xCenter;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = Math.max(1.4, size * 0.45);
        if (style === 'line') {
            ctx.beginPath();
            ctx.moveTo(x - span, y);
            ctx.lineTo(x + span, y);
            ctx.stroke();
        } else if (style === 'square') {
            const side = size * 2;
            ctx.fillRect(x - side / 2, y - side / 2, side, side);
        } else {
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        return;
    }

    if (typeof cfg.scaleX !== 'function' || !Number.isFinite(cfg.value) || !Number.isFinite(cfg.yCenter)) return;
    const x = cfg.scaleX(cfg.value);
    const y = cfg.yCenter;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1.4, size * 0.45);
    if (style === 'line') {
        ctx.beginPath();
        ctx.moveTo(x, y - span);
        ctx.lineTo(x, y + span);
        ctx.stroke();
    } else if (style === 'square') {
        const side = size * 2;
        ctx.fillRect(x - side / 2, y - side / 2, side, side);
    } else {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
