export function clampLabelLines(value, fallback = 2) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(1, Math.min(4, Math.round(numeric)));
}

export function getLabelLineHeight(fontSize) {
    return Math.max(14, Number(fontSize || 12) + 3);
}

export function wrapLabelLines(ctx, text, maxWidth, maxLines = 2) {
    const raw = String(text || '').trim();
    if (!raw) return [''];
    if (!Number.isFinite(maxWidth) || maxWidth <= 24) return [truncateWithEllipsis(ctx, raw, 24)];

    const words = raw.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (ctx.measureText(candidate).width <= maxWidth) {
            current = candidate;
            continue;
        }

        if (!current) {
            lines.push(truncateWithEllipsis(ctx, word, maxWidth));
        } else {
            lines.push(current);
            current = word;
        }

        if (lines.length === maxLines) {
            lines[maxLines - 1] = truncateWithEllipsis(ctx, lines[maxLines - 1], maxWidth);
            return lines;
        }
    }

    if (current) lines.push(current);
    if (lines.length <= maxLines) return lines;

    const kept = lines.slice(0, maxLines);
    const overflowTail = lines.slice(maxLines - 1).join(' ');
    kept[maxLines - 1] = truncateWithEllipsis(ctx, overflowTail, maxWidth);
    return kept;
}

export function drawRightAlignedMultiline(ctx, lines, x, centerY, lineHeight) {
    const startY = centerY - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
        ctx.fillText(line, x, startY + index * lineHeight);
    });
}

function truncateWithEllipsis(ctx, text, maxWidth) {
    const value = String(text || '');
    if (ctx.measureText(value).width <= maxWidth) return value;
    let out = value;
    while (out.length > 1 && ctx.measureText(`${out}...`).width > maxWidth) {
        out = out.slice(0, -1);
    }
    return `${out}...`;
}
