/**
 * DistributionChart - Gráfico de distribución general
 * Muestra la frecuencia total de cada categoría Likert en todos los ítems
 */

export default {
    id: 'distribution',
    
    name: {
        en: 'Distribution Chart',
        es: 'Gráfico de Distribución'
    },

    description: {
        en: 'Overall distribution across all items',
        es: 'Distribución general de todas las respuestas'
    },

    /**
     * Renderiza el gráfico de distribución
     */
    render(canvas, longData, config, scaleConfig, getColors, t) {
        const ctx = canvas.getContext('2d');
        
        // Calculate overall frequencies
        const frequencies = {};
        for (let i = 1; i <= scaleConfig.points; i++) {
            frequencies[i] = 0;
        }
        longData.forEach(record => {
            if (frequencies[record.value] !== undefined) {
                frequencies[record.value]++;
            }
        });
        
        const total = longData.length;
        
        // Calculate dimensions using config values
        const margin = { 
            top: config.marginTop || 60, 
            right: config.marginRight || 100, 
            bottom: config.marginBottom || 100, 
            left: config.marginLeft || 80 
        };
        const chartWidth = config.chartWidth || 800;
        const chartHeight = 500;
        
        canvas.width = chartWidth;
        canvas.height = chartHeight;
        
        // Clear canvas and apply background
        if (!config.transparentBackground) {
            ctx.fillStyle = config.backgroundColor || '#ffffff';
            ctx.fillRect(0, 0, chartWidth, chartHeight);
        } else {
            ctx.clearRect(0, 0, chartWidth, chartHeight);
        }
        
        // Set font for labels
        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
        
        const colors = getColors();
        const barWidth = (chartWidth - margin.left - margin.right) / scaleConfig.points;
        const maxPercentage = Math.max(...Object.values(frequencies).map(f => (f / total) * 100));
        const chartAreaHeight = chartHeight - margin.top - margin.bottom;
        
        // Draw title if enabled
        if (config.showTitle !== false) {
            const titleText = config.chartTitle || t('chart_distribution');
            ctx.font = `bold ${config.fontSizeTitle || (config.fontSizeLabels + 4)}px ${config.fontFamily}`;
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.fillText(titleText, chartWidth / 2, margin.top / 2);
        }
        
        // Draw grid if enabled
        if (config.showGrid) {
            this.drawGrid(ctx, margin.left, chartWidth - margin.left - margin.right, margin.top, chartHeight - margin.bottom, maxPercentage, config);
        }
        
        // Reset font for labels
        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
        
        // Draw bars
        for (let value = 1; value <= scaleConfig.points; value++) {
            const count = frequencies[value];
            const percentage = (count / total) * 100;
            const barHeight = (percentage / maxPercentage) * chartAreaHeight;
            const x = margin.left + (value - 1) * barWidth;
            const y = chartHeight - margin.bottom - barHeight;
            
            // Draw bar
            ctx.fillStyle = colors[value - 1];
            ctx.fillRect(x, y, barWidth * 0.8, barHeight);
            
            // Draw border
            ctx.strokeStyle = '#cbd5e1';
            ctx.strokeRect(x, y, barWidth * 0.8, barHeight);
            
            // Draw value label if enabled
            if (config.showValues) {
                ctx.font = `${config.fontSizeValues}px ${config.fontFamily}`;
                ctx.fillStyle = '#1e293b';
                ctx.textAlign = 'center';
                const displayValue = config.valueType === 'percentage'
                    ? percentage.toFixed(config.decimalPlaces) + '%'
                    : count;
                ctx.fillText(displayValue, x + barWidth * 0.4, y - 10);
                ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
            }
            
            // Draw x-axis label
            ctx.fillStyle = '#475569';
            ctx.textAlign = 'center';
            const label = scaleConfig.labels[value - 1] || `${value}`;
            
            // Wrap long labels
            const maxLabelWidth = barWidth * 0.8;
            const words = label.split(' ');
            let line = '';
            let lineY = chartHeight - margin.bottom + 20;
            
            words.forEach(word => {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxLabelWidth && line !== '') {
                    ctx.fillText(line, x + barWidth * 0.4, lineY);
                    line = word + ' ';
                    lineY += config.fontSizeLabels + 2;
                } else {
                    line = testLine;
                }
            });
            ctx.fillText(line, x + barWidth * 0.4, lineY);
        }
        
        // Draw y-axis
        ctx.strokeStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, chartHeight - margin.bottom);
        ctx.lineTo(chartWidth - margin.right, chartHeight - margin.bottom);
        ctx.stroke();
        
        // Draw y-axis label
        ctx.save();
        ctx.translate(20, chartHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#475569';
        ctx.fillText(config.valueType === 'percentage' ? t('percentage') : t('count'), 0, 0);
        ctx.restore();
        
        // Draw watermark
        if (config.watermark) {
            ctx.font = `${config.fontSizeLegend}px ${config.fontFamily}`;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.textAlign = 'center';
            ctx.fillText(config.watermark, chartWidth / 2, chartHeight - 10);
        }
    },

    canRender(longData, scaleConfig) {
        return longData && longData.length > 0 && scaleConfig;    },
    
    /**
     * Dibuja la cuadrícula de fondo
     */
    drawGrid(ctx, startX, width, top, bottom, maxValue, config) {
        ctx.save();
        ctx.strokeStyle = config.gridColor || '#e5e7eb';
        ctx.lineWidth = config.gridLineWidth || 1;
        
        if (config.gridDashed) {
            ctx.setLineDash([5, 5]);
        }
        
        const chartAreaHeight = bottom - top;
        
        // Líneas horizontales
        if (config.gridHorizontal) {
            for (let percent = 10; percent <= 100; percent += 10) {
                const y = bottom - (chartAreaHeight * percent / 100);
                ctx.beginPath();
                ctx.moveTo(startX, y);
                ctx.lineTo(startX + width, y);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
};
