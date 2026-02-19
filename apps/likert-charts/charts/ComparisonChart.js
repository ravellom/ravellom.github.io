/**
 * ComparisonChart - Native canvas grouped comparison chart
 * Compares group means (stats[item].groups[group].mean) with no external chart library.
 */
export default {
    id: 'comparison-groups',
    name: {
        en: 'Group Comparison',
        es: 'Comparativa de Grupos'
    },
    description: {
        en: 'Compare Likert results between different categories (e.g. Gender, Class)',
        es: 'Compara resultados Likert entre diferentes categorias (ej. Genero, Clase)'
    },

    render(canvas, items, stats, config, scaleConfig, getColors, t) {
        const ctx = canvas.getContext('2d');
        const colors = getColors();

        const allGroups = new Set();
        items.forEach((item) => {
            if (stats[item] && stats[item].groups) {
                Object.keys(stats[item].groups).forEach((g) => allGroups.add(g));
            }
        });
        const groups = Array.from(allGroups).sort();

        const margin = {
            top: config.marginTop || 70,
            right: config.marginRight || 160,
            bottom: config.marginBottom || 80,
            left: config.marginLeft || 260
        };
        const chartWidth = config.chartWidth || 1200;
        const rowGap = Math.max(10, config.barSpacing || 10);
        const barHeight = Math.max(8, config.barHeight || 20);
        const rowHeight = groups.length * barHeight + (groups.length - 1) * 4;
        const chartHeight = margin.top + margin.bottom + items.length * (rowHeight + rowGap);

        canvas.width = chartWidth;
        canvas.height = chartHeight;

        if (!config.transparentBackground) {
            ctx.fillStyle = config.backgroundColor || '#ffffff';
            ctx.fillRect(0, 0, chartWidth, chartHeight);
        } else {
            ctx.clearRect(0, 0, chartWidth, chartHeight);
        }

        if (!groups.length) {
            ctx.fillStyle = '#334155';
            ctx.font = `600 ${config.fontSizeLabels || 12}px ${config.fontFamily || 'Arial, sans-serif'}`;
            ctx.fillText('No group data found for comparison', margin.left, margin.top);
            return;
        }

        const minVal = 1;
        const maxVal = Math.max(minVal + 1, scaleConfig.points || 5);
        const innerWidth = chartWidth - margin.left - margin.right;

        if (config.showTitle !== false) {
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `700 ${config.fontSizeTitle || (config.fontSizeLabels + 6)}px ${config.fontFamily}`;
            ctx.fillText(config.chartTitle || t('chart_comparison') || 'Group Comparison', chartWidth / 2, margin.top / 2);
        }

        if (config.showGrid) {
            ctx.save();
            ctx.strokeStyle = config.gridColor || '#e5e7eb';
            ctx.lineWidth = config.gridLineWidth || 1;
            if (config.gridDashed) ctx.setLineDash([4, 4]);
            for (let tick = minVal; tick <= maxVal; tick++) {
                const x = margin.left + ((tick - minVal) / (maxVal - minVal)) * innerWidth;
                ctx.beginPath();
                ctx.moveTo(x, margin.top);
                ctx.lineTo(x, chartHeight - margin.bottom);
                ctx.stroke();
            }
            ctx.restore();
        }

        items.forEach((item, itemIndex) => {
            const baseY = margin.top + itemIndex * (rowHeight + rowGap);

            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.font = `${config.fontSizeLabels || 12}px ${config.fontFamily}`;
            ctx.fillText(item, margin.left - 10, baseY + rowHeight / 2);

            groups.forEach((group, gi) => {
                const mean = stats[item]?.groups?.[group]?.mean;
                if (!Number.isFinite(mean)) return;

                const width = ((mean - minVal) / (maxVal - minVal)) * innerWidth;
                const y = baseY + gi * (barHeight + 4);
                ctx.fillStyle = colors[gi % colors.length];
                ctx.fillRect(margin.left, y, Math.max(1, width), barHeight);

                if (config.showBarBorders) {
                    ctx.strokeStyle = config.barBorderColor || '#ffffff';
                    ctx.lineWidth = config.barBorderWidth || 1;
                    ctx.strokeRect(margin.left, y, Math.max(1, width), barHeight);
                }

                if (config.showValues) {
                    ctx.fillStyle = '#0f172a';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.font = `${config.fontSizeValues || 10}px ${config.fontFamily}`;
                    ctx.fillText(mean.toFixed(config.decimalPlaces || 1), margin.left + Math.max(4, width + 4), y + barHeight / 2);
                }
            });
        });

        if (config.showLegend) {
            const y = chartHeight - margin.bottom + 24;
            ctx.font = `${config.fontSizeLegend || 10}px ${config.fontFamily}`;
            ctx.textBaseline = 'middle';
            let x = margin.left;
            groups.forEach((group, gi) => {
                ctx.fillStyle = colors[gi % colors.length];
                ctx.fillRect(x, y - 7, 14, 14);
                ctx.fillStyle = '#334155';
                ctx.textAlign = 'left';
                ctx.fillText(group, x + 20, y);
                x += 20 + ctx.measureText(group).width + 20;
            });
        }
    },

    canRender(items, stats) {
        return items && items.length > 0 && Object.keys(stats).some((k) => stats[k].groups);
    }
};

