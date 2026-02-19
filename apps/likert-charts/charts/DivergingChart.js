/**
 * DivergingChart - Gráfico divergente
 * Muestra respuestas negativas a la izquierda, neutrales al centro, positivas a la derecha
 */

export default {
    id: 'diverging',
    
    name: {
        en: 'Diverging Bar Chart',
        es: 'Gráfico Divergente'
    },

    description: {
        en: 'Diverging bars with negative/neutral/positive split',
        es: 'Barras divergentes con división negativo/neutral/positivo'
    },

    /**
     * Renderiza el gráfico divergente
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
        
        const colors = getColors();
        const barWidth = chartWidth - margin.left - margin.right;
        const centerX = margin.left + barWidth / 2;
        
        // Determine midpoint (neutral position)
        const midpoint = Math.ceil(scaleConfig.points / 2);
        const hasNeutral = scaleConfig.points % 2 === 1;
        
        // Draw title if enabled
        if (config.showTitle !== false) {
            const titleText = config.chartTitle || t('chart_diverging');
            ctx.font = `bold ${config.fontSizeTitle || (config.fontSizeLabels + 4)}px ${config.fontFamily}`;
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.fillText(titleText, chartWidth / 2, margin.top / 2);
        }
        
        // Reset font for labels
        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
        
        // Draw grid if enabled
        if (config.showGrid) {
            this.drawGrid(ctx, centerX, barWidth / 2, margin.top, chartHeight - margin.bottom, config);
        }
        
        // Draw center line with configurable style
        ctx.strokeStyle = config.axisColor || '#cbd5e1';
        ctx.lineWidth = config.axisWidth || 2;
        ctx.beginPath();
        ctx.moveTo(centerX, margin.top);
        ctx.lineTo(centerX, chartHeight - margin.bottom);
        ctx.stroke();
        
        // Draw bars for each item
        items.forEach((item, index) => {
            const y = margin.top + index * (barHeight + barSpacing);
            const stat = stats[item];
            const safeTotal = Math.max(1, stat.total || 0);
            
            // Draw item label
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            const maxLabelWidth = margin.left - 20;
            const lines = this.wrapText(ctx, item, maxLabelWidth, config.labelMaxLines || 2);
            const lineHeight = config.fontSizeLabels * 1.2;
            const totalHeight = lines.length * lineHeight;
            const startY = y + barHeight / 2 - totalHeight / 2 + lineHeight / 2;
            
            lines.forEach((line, i) => {
                ctx.fillText(line, margin.left - 10, startY + i * lineHeight);
            });
            
            // Calculate percentages
            const percentages = {};
            for (let value = 1; value <= scaleConfig.points; value++) {
                const count = stat.frequencies[value] || 0;
                percentages[value] = (count / safeTotal) * 100;
            }
            
            // Draw neutral (center) if exists
            if (hasNeutral) {
                const neutralPercentage = percentages[midpoint] || 0;
                const neutralWidth = (neutralPercentage / 100) * (barWidth / 2);
                
                if (neutralWidth > 0) {
                    ctx.fillStyle = colors[midpoint - 1];
                    ctx.fillRect(centerX - neutralWidth / 2, y, neutralWidth, barHeight);
                    
                    // Draw bar border if enabled
                    if (config.showBarBorders) {
                        ctx.strokeStyle = config.barBorderColor || '#ffffff';
                        ctx.lineWidth = config.barBorderWidth || 1;
                        ctx.strokeRect(centerX - neutralWidth / 2, y, neutralWidth, barHeight);
                    }
                    
                    if (config.showValues && neutralWidth > 30) {
                        ctx.font = `${config.fontSizeValues}px ${config.fontFamily}`;
                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'center';
                        const displayValue = config.valueType === 'percentage'
                            ? neutralPercentage.toFixed(config.decimalPlaces) + '%'
                            : stat.frequencies[midpoint];
                        ctx.fillText(displayValue, centerX, y + barHeight / 2);
                        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
                    }
                }
            }
            
            // Draw positive side (right of center)
            let rightOffset = hasNeutral ? (percentages[midpoint] / 100) * (barWidth / 2) / 2 : 0;
            for (let value = midpoint + (hasNeutral ? 1 : 0); value <= scaleConfig.points; value++) {
                const percentage = percentages[value] || 0;
                const width = (percentage / 100) * (barWidth / 2);
                
                if (width > 0) {
                    ctx.fillStyle = colors[value - 1];
                    ctx.fillRect(centerX + rightOffset, y, width, barHeight);
                    
                    // Draw bar border if enabled
                    if (config.showBarBorders) {
                        ctx.strokeStyle = config.barBorderColor || '#ffffff';
                        ctx.lineWidth = config.barBorderWidth || 1;
                        ctx.strokeRect(centerX + rightOffset, y, width, barHeight);
                    }
                    
                    if (config.showValues && width > 30) {
                        ctx.font = `${config.fontSizeValues}px ${config.fontFamily}`;
                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'center';
                        const displayValue = config.valueType === 'percentage'
                            ? percentage.toFixed(config.decimalPlaces) + '%'
                            : stat.frequencies[value];
                        ctx.fillText(displayValue, centerX + rightOffset + width / 2, y + barHeight / 2);
                        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
                    }
                    
                    rightOffset += width;
                }
            }
        });
        
        // Dibujar barras negativas AL FINAL para que no sean cubiertas
        items.forEach((item, index) => {
            const y = margin.top + index * (barHeight + barSpacing);
            const stat = stats[item];
            const safeTotal = Math.max(1, stat.total || 0);
            
            const percentages = {};
            for (let value = 1; value <= scaleConfig.points; value++) {
                const count = stat.frequencies[value] || 0;
                percentages[value] = (count / safeTotal) * 100;
            }
            
            // Calcular offset inicial (mitad del neutral si existe)
            const leftStartOffset = hasNeutral ? (percentages[midpoint] / 100) * (barWidth / 2) / 2 : 0;
            
            // Dibujar barras negativas de derecha a izquierda (desde el centro hacia afuera)
            let currentX = centerX - leftStartOffset;
            for (let value = midpoint - 1; value >= 1; value--) {
                const percentage = percentages[value] || 0;
                const width = (percentage / 100) * (barWidth / 2);
                
                if (width > 0) {
                    currentX -= width;
                    ctx.fillStyle = colors[value - 1];
                    ctx.fillRect(currentX, y, width, barHeight);
                    
                    // Draw bar border if enabled
                    if (config.showBarBorders) {
                        ctx.strokeStyle = config.barBorderColor || '#ffffff';
                        ctx.lineWidth = config.barBorderWidth || 1;
                        ctx.strokeRect(currentX, y, width, barHeight);
                    }
                    
                    if (config.showValues && width > 30) {
                        ctx.font = `${config.fontSizeValues}px ${config.fontFamily}`;
                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'center';
                        const displayValue = config.valueType === 'percentage'
                            ? percentage.toFixed(config.decimalPlaces) + '%'
                            : stat.frequencies[value];
                        ctx.fillText(displayValue, currentX + width / 2, y + barHeight / 2);
                        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
                    }
                }
            }
        });
        
        // Draw axis frame and labels if enabled
        if (config.showAxisLabels !== false) {
            this.drawAxisFrame(ctx, centerX, barWidth / 2, margin.top, chartHeight - margin.bottom, config);
        }
        
        // Draw legend if enabled
        if (config.showLegend) {
            this.drawLegend(ctx, colors, scaleConfig, config, chartWidth, chartHeight, margin);
        }
        
        // Draw watermark
        if (config.watermark) {
            ctx.font = `${config.fontSizeLegend}px ${config.fontFamily}`;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.textAlign = 'center';
            ctx.fillText(config.watermark, chartWidth / 2, chartHeight - 20);
        }
    },

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
                const label = scaleConfig.labels[i] || `${i + 1}`;
                
                ctx.fillStyle = colors[i];
                ctx.fillRect(x, yPos, boxSize, boxSize);
                ctx.strokeStyle = '#cbd5e1';
                ctx.strokeRect(x, yPos, boxSize, boxSize);
                
                // Restablecer font antes de dibujar texto
                ctx.font = `${config.fontSizeLegend}px ${config.fontFamily}`;
                ctx.fillStyle = '#1e293b';
                ctx.textAlign = 'left';
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
                
                // Restablecer font antes de dibujar texto
                ctx.font = `${config.fontSizeLegend}px ${config.fontFamily}`;
                ctx.fillStyle = '#1e293b';
                ctx.textAlign = 'left';
                const label = scaleConfig.labels[i] || `${i + 1}`;
                const labelWidth = ctx.measureText(label).width;
                ctx.fillText(label, xOffset + boxSize + 5, y + boxSize / 2);
                
                xOffset += boxSize + labelWidth + 15;
            }
        }
    },

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
    },
    
    /**
     * Dibuja la cuadrícula de fondo
     */
    drawGrid(ctx, centerX, halfWidth, top, bottom, config) {
        ctx.save();
        ctx.strokeStyle = config.gridColor || '#e5e7eb';
        ctx.lineWidth = config.gridLineWidth || 1;
        
        if (config.gridDashed) {
            ctx.setLineDash([5, 5]);
        }
        
        // Líneas verticales
        if (config.gridVertical) {
            for (let percent = 10; percent <= 100; percent += 10) {
                const offset = halfWidth * percent / 100;
                // Lado izquierdo
                ctx.beginPath();
                ctx.moveTo(centerX - offset, top);
                ctx.lineTo(centerX - offset, bottom);
                ctx.stroke();
                // Lado derecho
                ctx.beginPath();
                ctx.moveTo(centerX + offset, top);
                ctx.lineTo(centerX + offset, bottom);
                ctx.stroke();
            }
        }
        
        // Líneas horizontales
        if (config.gridHorizontal) {
            const numItems = Math.floor((bottom - top) / (config.barHeight + config.barSpacing));
            for (let i = 0; i <= numItems; i++) {
                const y = top + i * (config.barHeight + config.barSpacing);
                ctx.beginPath();
                ctx.moveTo(centerX - halfWidth, y);
                ctx.lineTo(centerX + halfWidth, y);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    },

    drawAxisFrame(ctx, centerX, halfWidth, top, bottom, config) {
        ctx.save();
        
        const left = centerX - halfWidth;
        const right = centerX + halfWidth;
        
        // Draw frame border (solo si showGridBorder está activo)
        if (config.showGridBorder) {
            ctx.strokeStyle = config.axisColor || '#333333';
            ctx.lineWidth = config.axisWidth || 2;
            ctx.strokeRect(left, top, halfWidth * 2, bottom - top);
        }
        
        // Draw axis labels (percentages) - solo si showAxisLabels está activo
        if (config.showAxisLabels) {
            ctx.fillStyle = config.axisColor || '#333333';
            ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            const labelY = bottom + 10;
            
            // Left side (100% to 0%)
            ctx.fillText('100%', left, labelY);
            ctx.fillText('50%', centerX - halfWidth / 2, labelY);
            
            // Center (0%)
            ctx.fillText('0%', centerX, labelY);
            
            // Right side (0% to 100%)
            ctx.fillText('50%', centerX + halfWidth / 2, labelY);
            ctx.fillText('100%', right, labelY);
        }
        
        ctx.restore();
    }
};
