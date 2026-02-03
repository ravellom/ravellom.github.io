/**
 * StackedChart - Gráfico de barras apiladas al 100%
 * Muestra la distribución porcentual de cada categoría Likert por ítem
 */

export default {
    id: 'stacked',
    
    name: {
        en: 'Stacked Bar Chart',
        es: 'Gráfico de Barras Apiladas'
    },

    description: {
        en: '100% stacked bars showing distribution for each item',
        es: 'Barras apiladas al 100% mostrando distribución por ítem'
    },

    /**
     * Renderiza el gráfico apilado
     * @param {HTMLCanvasElement} canvas - Elemento canvas
     * @param {Array} items - Lista de ítems ordenados
     * @param {Object} stats - Estadísticas por ítem
     * @param {Object} config - Configuración del gráfico
     * @param {Object} scaleConfig - Configuración de la escala
     * @param {Function} getColors - Función para obtener colores
     * @param {Function} t - Función de traducción
     */
    render(canvas, items, stats, config, scaleConfig, getColors, t) {
        const ctx = canvas.getContext('2d');
        
        // Calculate dimensions using config values
        const margin = { 
            top: config.marginTop || 60, 
            right: config.marginRight || 150, 
            bottom: config.marginBottom || 80, 
            left: config.marginLeft || 200 
        };
        const barHeight = config.barHeight;
        const barSpacing = config.barSpacing;
        const chartHeight = items.length * (barHeight + barSpacing) + margin.top + margin.bottom;
        const chartWidth = config.chartWidth || 1200;
        
        // Set canvas size
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
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        const colors = getColors();
        const barWidth = chartWidth - margin.left - margin.right;
        
        // Draw title if enabled
        if (config.showTitle !== false) {
            const titleText = config.chartTitle || t('chart_stacked');
            ctx.font = `bold ${config.fontSizeTitle || (config.fontSizeLabels + 4)}px ${config.fontFamily}`;
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.fillText(titleText, chartWidth / 2, margin.top / 2);
        }
        
        // Reset font for chart
        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
        
        // Draw grid if enabled
        if (config.showGrid) {
            this.drawGrid(ctx, margin.left, barWidth, margin.top, chartHeight - margin.bottom, config);
        }
        
        // Draw bars for each item
        items.forEach((item, index) => {
            const y = margin.top + index * (barHeight + barSpacing);
            const stat = stats[item];
            
            // Draw item label
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'right';
            const maxLabelWidth = margin.left - 20;
            const lines = this.wrapText(ctx, item, maxLabelWidth, config.labelMaxLines || 2);
            const lineHeight = config.fontSizeLabels * 1.2;
            const totalHeight = lines.length * lineHeight;
            const startY = y + barHeight / 2 - totalHeight / 2 + lineHeight / 2;
            
            lines.forEach((line, i) => {
                ctx.fillText(line, margin.left - 10, startY + i * lineHeight);
            });
            
            // Draw stacked bars
            let xOffset = margin.left;
            
            for (let value = 1; value <= scaleConfig.points; value++) {
                const count = stat.frequencies[value] || 0;
                const percentage = (count / stat.total) * 100;
                const width = (percentage / 100) * barWidth;
                
                if (width > 0) {
                    // Draw bar segment
                    ctx.fillStyle = colors[value - 1];
                    ctx.fillRect(xOffset, y, width, barHeight);
                    
                    // Draw bar border if enabled
                    if (config.showBarBorders) {
                        ctx.strokeStyle = config.barBorderColor || '#ffffff';
                        ctx.lineWidth = config.barBorderWidth || 1;
                        ctx.strokeRect(xOffset, y, width, barHeight);
                    }
                    
                    // Draw value label if enabled and width is sufficient
                    if (config.showValues && width > 30) {
                        ctx.font = `${config.fontSizeValues}px ${config.fontFamily}`;
                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'center';
                        const displayValue = config.valueType === 'percentage' 
                            ? percentage.toFixed(config.decimalPlaces) + '%'
                            : count;
                        ctx.fillText(displayValue, xOffset + width / 2, y + barHeight / 2);
                        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
                    }
                    
                    xOffset += width;
                }
            }
            
            // Draw border
            ctx.strokeStyle = '#cbd5e1';
            ctx.strokeRect(margin.left, y, barWidth, barHeight);
        });
        
        // Draw axis frame and labels if enabled
        if (config.showAxisLabels !== false) {
            this.drawAxisFrame(ctx, margin.left, barWidth, margin.top, chartHeight - margin.bottom, config);
        }
        
        // Draw legend if enabled
        if (config.showLegend) {
            this.drawLegend(ctx, colors, scaleConfig, config, chartWidth, chartHeight, margin);
        }
        
        // Draw watermark if specified
        if (config.watermark) {
            ctx.font = `${config.fontSizeLegend}px ${config.fontFamily}`;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.textAlign = 'center';
            ctx.fillText(config.watermark, chartWidth / 2, chartHeight - 20);
        }
    },

    /**
     * Dibuja la leyenda en la posición configurada
     */
    drawLegend(ctx, colors, scaleConfig, config, chartWidth, chartHeight, margin) {
        const boxSize = 15;
        const spacing = 5;
        const position = config.legendPosition || 'right';
        
        ctx.font = `${config.fontSizeLegend}px ${config.fontFamily}`;
        
        let x, y, orientation;
        
        switch(position) {
            case 'left':
                x = 10;
                y = margin.top + 25;  // Más espacio para evitar superposición con título
                orientation = 'vertical';
                break;
            case 'top':
                x = margin.left;
                y = 30;  // Más espacio abajo del título
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
                y = margin.top + 25;  // Más espacio para evitar superposición con título
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
            // Horizontal
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

    /**
     * Valida si puede renderizar los datos
     */
    canRender(items, stats, scaleConfig) {
        return items && items.length > 0 && stats && scaleConfig;
    },
    
    /**
     * Trunca texto si es muy largo
     */
    truncateText(ctx, text, maxWidth) {
        const width = ctx.measureText(text).width;
        if (width <= maxWidth) return text;
        
        let truncated = text;
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
        }
        return truncated + '...';
    },
    
    /**
     * Divide texto en múltiples líneas
     */
    wrapText(ctx, text, maxWidth, maxLines) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = words[i];
                
                if (lines.length >= maxLines - 1) {
                    // Última línea permitida, agregar resto con elipsis
                    const remaining = words.slice(i).join(' ');
                    currentLine = this.truncateText(ctx, remaining, maxWidth);
                    break;
                }
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.slice(0, maxLines);
    },    /**
     * Dibuja la cuadrícula de fondo
     */
    drawGrid(ctx, startX, width, top, bottom, chartConfig) {
        ctx.save();
        ctx.strokeStyle = chartConfig.gridColor || '#e5e7eb';
        ctx.lineWidth = chartConfig.gridLineWidth || 1;
        
        if (chartConfig.gridDashed) {
            ctx.setLineDash([5, 5]);
        }
        
        // Líneas verticales
        if (chartConfig.gridVertical) {
            for (let percent = 10; percent <= 100; percent += 10) {
                const x = startX + (width * percent / 100);
                ctx.beginPath();
                ctx.moveTo(x, top);
                ctx.lineTo(x, bottom);
                ctx.stroke();
            }
        }
        
        // Líneas horizontales
        if (chartConfig.gridHorizontal) {
            const numItems = Math.floor((bottom - top) / (chartConfig.barHeight + chartConfig.barSpacing));
            for (let i = 0; i <= numItems; i++) {
                const y = top + i * (chartConfig.barHeight + chartConfig.barSpacing);
                ctx.beginPath();
                ctx.moveTo(startX, y);
                ctx.lineTo(startX + width, y);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    },

    drawAxisFrame(ctx, startX, width, top, bottom, config) {
        ctx.save();
        
        // Draw frame border (solo si showGridBorder está activo)
        if (config.showGridBorder) {
            ctx.strokeStyle = config.axisColor || '#333333';
            ctx.lineWidth = config.axisWidth || 2;
            ctx.strokeRect(startX, top, width, bottom - top);
        }
        
        // Draw axis labels (percentages) - solo si showAxisLabels está activo
        if (config.showAxisLabels) {
            ctx.fillStyle = config.axisColor || '#333333';
            ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            const labelY = bottom + 10;
            
            // Percentage labels
            ctx.fillText('0%', startX, labelY);
            ctx.fillText('25%', startX + width * 0.25, labelY);
            ctx.fillText('50%', startX + width * 0.5, labelY);
            ctx.fillText('75%', startX + width * 0.75, labelY);
            ctx.fillText('100%', startX + width, labelY);
        }
        
        ctx.restore();
    }
};
