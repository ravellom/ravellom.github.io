/**
 * SplitChart
 * Centered diverging bars with a separate neutral column.
 */
export default {
    id: 'split',
    name: {
        en: 'Split Chart',
        es: 'Grafico Dividido'
    },
    description: {
        en: 'Centered diverging bars with a separate column for neutral responses',
        es: 'Barras divergentes centradas con una columna separada para respuestas neutrales'
    },

    render(canvas, items, stats, config, scaleConfig, getColors, t) {
        const ctx = canvas.getContext('2d');
        const colors = getColors();

        const margin = {
            top: config.marginTop || 60,
            right: config.marginRight || 150,
            bottom: config.marginBottom || 80,
            left: config.marginLeft || 200
        };
        const chartWidth = config.chartWidth || 1200;
        const barHeight = config.barHeight || 40;
        const barSpacing = config.barSpacing || 10;
        const chartHeight = margin.top + margin.bottom + items.length * (barHeight + barSpacing);

        const neutralColumnWidth = Math.max(44, Math.min(96, Math.round(chartWidth * 0.06)));
        const neutralColumnGap = 8;
        const mainAreaWidth = chartWidth - margin.left - margin.right - neutralColumnWidth - neutralColumnGap;
        const mainStartX = margin.left;
        const centerX = mainStartX + mainAreaWidth / 2;
        const neutralX = mainStartX + mainAreaWidth + neutralColumnGap;

        canvas.width = chartWidth;
        canvas.height = chartHeight;

        if (!config.transparentBackground) {
            ctx.fillStyle = config.backgroundColor || '#ffffff';
            ctx.fillRect(0, 0, chartWidth, chartHeight);
        } else {
            ctx.clearRect(0, 0, chartWidth, chartHeight);
        }

        if (config.showTitle !== false) {
            const titleText = config.chartTitle || t('chart_split') || 'Split Chart';
            ctx.font = `bold ${config.fontSizeTitle || (config.fontSizeLabels + 4)}px ${config.fontFamily}`;
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(titleText, chartWidth / 2, margin.top / 2);
        }

        if (config.showGrid) {
            this.drawGrid(ctx, centerX, mainAreaWidth, margin.top, chartHeight - margin.bottom, config, barHeight, barSpacing);
        }

        ctx.strokeStyle = config.axisColor || '#cbd5e1';
        ctx.lineWidth = config.axisWidth || 2;
        ctx.beginPath();
        ctx.moveTo(centerX, margin.top);
        ctx.lineTo(centerX, chartHeight - margin.bottom);
        ctx.stroke();

        const midpoint = Math.ceil(scaleConfig.points / 2);
        const labels = scaleConfig.labels || [];
        const disagreeLabel = labels[0] || t('disagree') || 'Disagree';
        const agreeLabel = labels[scaleConfig.points - 1] || t('agree') || 'Agree';
        const neutralLabel = labels[midpoint - 1] || t('neutral') || 'Neutral';

        ctx.fillStyle = '#64748b';
        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const categoryY = margin.top - 6;
        ctx.fillText(disagreeLabel, centerX - mainAreaWidth / 4, categoryY);
        ctx.fillText(agreeLabel, centerX + mainAreaWidth / 4, categoryY);
        ctx.fillText(neutralLabel, neutralX + neutralColumnWidth / 2, categoryY);

        const hasNeutral = scaleConfig.points % 2 === 1;
        const negativeColors = colors.slice(0, midpoint - 1).reverse();
        const positiveColors = colors.slice(hasNeutral ? midpoint : midpoint - 1);
        const neutralColor = hasNeutral ? colors[midpoint - 1] : '#9ca3af';

        items.forEach((item, index) => {
            const y = margin.top + index * (barHeight + barSpacing);
            this.drawItem(
                ctx,
                item,
                stats[item],
                y,
                barHeight,
                mainStartX,
                centerX,
                mainAreaWidth,
                neutralX,
                neutralColumnWidth,
                config,
                scaleConfig,
                negativeColors,
                positiveColors,
                neutralColor
            );
        });

        if (config.showAxisLabels !== false) {
            this.drawAxisFrame(
                ctx,
                mainStartX,
                mainAreaWidth,
                neutralX,
                neutralColumnWidth,
                margin.top,
                chartHeight - margin.bottom,
                config
            );
        }

        if (config.showLegend) {
            this.drawLegend(ctx, colors, scaleConfig, config, chartWidth, chartHeight, margin);
        }

        if (config.watermark) {
            ctx.font = `${config.fontSizeLegend}px ${config.fontFamily}`;
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(config.watermark, chartWidth / 2, chartHeight - 20);
        }
    },

    drawItem(
        ctx,
        item,
        itemStats,
        y,
        barHeight,
        mainStartX,
        centerX,
        mainAreaWidth,
        neutralX,
        neutralColumnWidth,
        config,
        scaleConfig,
        negativeColors,
        positiveColors,
        neutralColor
    ) {
        const frequencies = itemStats.frequencies || {};
        const safeTotal = Math.max(1, itemStats.total || 0);
        const midpoint = Math.ceil(scaleConfig.points / 2);

        let negativePercent = 0;
        let positivePercent = 0;
        let neutralPercent = 0;
        const negativeBreakdown = [];
        const positiveBreakdown = [];

        for (let i = 1; i < midpoint; i++) {
            const count = frequencies[i] || 0;
            const percent = (count / safeTotal) * 100;
            negativePercent += percent;
            negativeBreakdown.push({ value: i, percent, count });
        }

        const neutralCount = frequencies[midpoint] || 0;
        neutralPercent = (neutralCount / safeTotal) * 100;

        for (let i = midpoint + 1; i <= scaleConfig.points; i++) {
            const count = frequencies[i] || 0;
            const percent = (count / safeTotal) * 100;
            positivePercent += percent;
            positiveBreakdown.push({ value: i, percent, count });
        }

        ctx.fillStyle = '#1e293b';
        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const maxLabelWidth = mainStartX - 20;
        const lines = this.wrapText(ctx, item, maxLabelWidth, config.labelMaxLines || 2);
        const lineHeight = config.fontSizeLabels * 1.2;
        const startY = y + barHeight / 2 - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, i) => {
            ctx.fillText(line, mainStartX - 10, startY + i * lineHeight);
        });

        const pixelsPerPercent = mainAreaWidth / 200;
        const negativeWidth = negativePercent * pixelsPerPercent;
        const positiveWidth = positivePercent * pixelsPerPercent;

        let currentX = centerX;
        negativeBreakdown.reverse().forEach((seg, idx) => {
            const segWidth = seg.percent * pixelsPerPercent;
            if (segWidth <= 0) return;
            ctx.fillStyle = negativeColors[idx % Math.max(1, negativeColors.length)];
            ctx.fillRect(currentX - segWidth, y, segWidth, barHeight);

            if (config.showBarBorders) {
                ctx.strokeStyle = config.barBorderColor || '#ffffff';
                ctx.lineWidth = config.barBorderWidth || 1;
                ctx.strokeRect(currentX - segWidth, y, segWidth, barHeight);
            }

            if (config.showValues && segWidth > 30) {
                ctx.fillStyle = '#ffffff';
                ctx.font = `${config.fontSizeValues}px ${config.fontFamily}`;
                ctx.textAlign = 'center';
                ctx.fillText(`${seg.percent.toFixed(config.decimalPlaces)}%`, currentX - segWidth / 2, y + barHeight / 2);
            }
            currentX -= segWidth;
        });

        currentX = centerX;
        positiveBreakdown.forEach((seg, idx) => {
            const segWidth = seg.percent * pixelsPerPercent;
            if (segWidth <= 0) return;
            ctx.fillStyle = positiveColors[idx % Math.max(1, positiveColors.length)];
            ctx.fillRect(currentX, y, segWidth, barHeight);

            if (config.showBarBorders) {
                ctx.strokeStyle = config.barBorderColor || '#ffffff';
                ctx.lineWidth = config.barBorderWidth || 1;
                ctx.strokeRect(currentX, y, segWidth, barHeight);
            }

            if (config.showValues && segWidth > 30) {
                ctx.fillStyle = '#ffffff';
                ctx.font = `${config.fontSizeValues}px ${config.fontFamily}`;
                ctx.textAlign = 'center';
                ctx.fillText(`${seg.percent.toFixed(config.decimalPlaces)}%`, currentX + segWidth / 2, y + barHeight / 2);
            }
            currentX += segWidth;
        });

        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(neutralX, y, neutralColumnWidth, barHeight);
        const neutralBarWidth = (neutralPercent / 100) * neutralColumnWidth;
        ctx.fillStyle = neutralColor;
        ctx.fillRect(neutralX, y, neutralBarWidth, barHeight);

        if (config.showValues && neutralPercent > 5) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `${config.fontSizeValues}px ${config.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.fillText(`${neutralPercent.toFixed(config.decimalPlaces)}%`, neutralX + neutralBarWidth / 2, y + barHeight / 2);
        }

        if (config.showGridBorder) {
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.strokeRect(centerX - negativeWidth, y, negativeWidth, barHeight);
            ctx.strokeRect(centerX, y, positiveWidth, barHeight);
            ctx.strokeRect(neutralX, y, neutralColumnWidth, barHeight);
        }
    },

    drawLegend(ctx, colors, scaleConfig, config, chartWidth, chartHeight, margin) {
        const boxSize = 15;
        const spacing = 5;
        const position = config.legendPosition || 'right';

        ctx.font = `${config.fontSizeLegend}px ${config.fontFamily}`;

        let x;
        let y;
        let orientation;

        switch (position) {
            case 'left':
                x = 10;
                y = margin.top + 25;
                orientation = 'vertical';
                break;
            case 'top':
                x = margin.left;
                y = 30;
                orientation = 'horizontal';
                break;
            case 'bottom':
                x = margin.left;
                y = chartHeight - 30;
                orientation = 'horizontal';
                break;
            case 'right':
            default:
                x = chartWidth - margin.right + 10;
                y = margin.top + 25;
                orientation = 'vertical';
                break;
        }

        if (orientation === 'vertical') {
            ctx.textBaseline = 'middle';
            for (let i = 0; i < scaleConfig.points; i++) {
                const yPos = y + i * (boxSize + spacing);
                ctx.fillStyle = colors[i];
                ctx.fillRect(x, yPos, boxSize, boxSize);
                ctx.strokeStyle = '#cbd5e1';
                ctx.strokeRect(x, yPos, boxSize, boxSize);
                ctx.fillStyle = '#1e293b';
                ctx.textAlign = 'left';
                const label = scaleConfig.labels[i] || `${i + 1}`;
                ctx.fillText(label, x + boxSize + 5, yPos + boxSize / 2);
            }
        } else {
            ctx.textBaseline = 'middle';
            let xOffset = x;
            for (let i = 0; i < scaleConfig.points; i++) {
                ctx.fillStyle = colors[i];
                ctx.fillRect(xOffset, y, boxSize, boxSize);
                ctx.strokeStyle = '#cbd5e1';
                ctx.strokeRect(xOffset, y, boxSize, boxSize);
                ctx.fillStyle = '#1e293b';
                ctx.textAlign = 'left';
                const label = scaleConfig.labels[i] || `${i + 1}`;
                const labelWidth = ctx.measureText(label).width;
                ctx.fillText(label, xOffset + boxSize + 5, y + boxSize / 2);
                xOffset += boxSize + labelWidth + 15;
            }
        }
    },

    drawAxisFrame(ctx, startX, mainWidth, neutralX, neutralWidth, top, bottom, config) {
        ctx.save();

        if (config.showGridBorder) {
            ctx.strokeStyle = config.axisColor || '#333333';
            ctx.lineWidth = config.axisWidth || 2;
            ctx.strokeRect(startX, top, mainWidth, bottom - top);
            ctx.strokeRect(neutralX, top, neutralWidth, bottom - top);
        }

        if (config.showAxisLabels) {
            ctx.fillStyle = config.axisColor || '#333333';
            ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            const labelY = bottom + 10;
            ctx.fillText('100%', startX, labelY);
            ctx.fillText('50%', startX + mainWidth * 0.25, labelY);
            ctx.fillText('0%', startX + mainWidth * 0.5, labelY);
            ctx.fillText('50%', startX + mainWidth * 0.75, labelY);
            ctx.fillText('100%', startX + mainWidth, labelY);
            ctx.fillText('100%', neutralX + neutralWidth / 2, labelY);
        }

        ctx.restore();
    },

    drawGrid(ctx, centerX, mainAreaWidth, top, bottom, config, barHeight, barSpacing) {
        ctx.save();
        ctx.strokeStyle = config.gridColor || '#e5e7eb';
        ctx.lineWidth = config.gridLineWidth || 1;

        if (config.gridDashed) {
            ctx.setLineDash([5, 5]);
        }

        const pixelsPerPercent = mainAreaWidth / 200;

        if (config.gridVertical) {
            for (let percent = 10; percent <= 100; percent += 10) {
                const xNeg = centerX - percent * pixelsPerPercent;
                ctx.beginPath();
                ctx.moveTo(xNeg, top);
                ctx.lineTo(xNeg, bottom);
                ctx.stroke();

                const xPos = centerX + percent * pixelsPerPercent;
                ctx.beginPath();
                ctx.moveTo(xPos, top);
                ctx.lineTo(xPos, bottom);
                ctx.stroke();
            }
        }

        if (config.gridHorizontal) {
            const numItems = Math.floor((bottom - top) / (barHeight + barSpacing));
            for (let i = 0; i <= numItems; i++) {
                const y = top + i * (barHeight + barSpacing);
                ctx.beginPath();
                ctx.moveTo(centerX - mainAreaWidth / 2, y);
                ctx.lineTo(centerX + mainAreaWidth / 2, y);
                ctx.stroke();
            }
        }

        ctx.restore();
    },

    truncateText(ctx, text, maxWidth) {
        if (ctx.measureText(text).width <= maxWidth) return text;
        let truncated = text;
        while (ctx.measureText(`${truncated}...`).width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
        }
        return `${truncated}...`;
    },

    wrapText(ctx, text, maxWidth, maxLines) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            const testLine = `${currentLine}${currentLine ? ' ' : ''}${words[i]}`;
            if (ctx.measureText(testLine).width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = words[i];
                if (lines.length >= maxLines - 1) {
                    currentLine = this.truncateText(ctx, words.slice(i).join(' '), maxWidth);
                    break;
                }
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) lines.push(currentLine);
        return lines.slice(0, maxLines);
    },

    canRender(items, stats, scaleConfig) {
        return items && items.length > 0 && stats && scaleConfig;
    }
};

