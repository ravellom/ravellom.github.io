/**
 * SPLIT CHART (CENTERED DIVERGING WITH SEPARATED NEUTRALS)
 * 
 * Visualiza respuestas Likert separando:
 * - Negativas (izquierda del centro)
 * - Positivas (derecha del centro) 
 * - Neutrales (columna separada a la derecha)
 */

export default {
    id: 'split',
    name: 'Split Chart',
    nameES: 'Gráfico Dividido',
    
    /**
     * Renderiza el gráfico
     * @param {HTMLCanvasElement} canvas
     * @param {Array} items - Lista de ítems
     * @param {Object} stats - Estadísticas por ítem
     * @param {Object} chartConfig - Configuración del gráfico
     * @param {Object} scaleConfig - Configuración de la escala
     * @param {Function} getColors - Función para obtener colores
     * @param {Function} t - Función de traducción
     */
    render(canvas, items, stats, chartConfig, scaleConfig, getColors, t) {
        const ctx = canvas.getContext('2d');
        
        // Configuración
        const barHeight = chartConfig.barHeight || 40;
        const barSpacing = chartConfig.barSpacing || 10;
        const leftMargin = 250;
        const rightMargin = 150; // Espacio para la columna de neutrales
        const topMargin = 80;
        const bottomMargin = 60;
        const neutralColumnWidth = 60; // Reducido de 100 a 60
        const neutralColumnGap = 5; // Reducido de 20 a 5
        
        // Calcular dimensiones
        const chartHeight = (barHeight + barSpacing) * items.length + topMargin + bottomMargin;
        const availableWidth = 1200;
        const chartWidth = availableWidth - neutralColumnWidth - neutralColumnGap;
        
        canvas.width = availableWidth;
        canvas.height = chartHeight;
        
        // Fondo
        if (!chartConfig.transparentBackground) {
            ctx.fillStyle = chartConfig.backgroundColor || '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Obtener colores
        const allColors = getColors();
        const midpoint = Math.ceil(scaleConfig.points / 2);
        
        // Colores para cada categoría (ajustados para coincidir con la imagen)
        // Negativos: grises oscuros, Positivos: naranjas/amarillos
        const negativeColors = ['#78716c', '#57534e']; // Gris claro, Gris oscuro
        const positiveColors = ['#fb923c', '#f97316']; // Naranja claro, Naranja oscuro  
        const neutralColor = '#9ca3af'; // Gris para neutral
        
        // Título
        ctx.fillStyle = '#1f2937';
        ctx.font = `bold ${chartConfig.fontSizeLabels + 4}px ${chartConfig.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.fillText(chartConfig.chartTitle || chartConfig.watermark || 'Survey Report', 20, 30);
        
        // Calcular posiciones
        const barAreaWidth = chartWidth - leftMargin - 40;
        const centerX = leftMargin + barAreaWidth / 2;
        
        // Etiquetas de categoría en la parte superior
        ctx.fillStyle = '#64748b';
        ctx.font = `${chartConfig.fontSizeLabels}px ${chartConfig.fontFamily}`;
        ctx.textAlign = 'center';
        
        const categoryY = topMargin - 10;
        
        // Disagree label (lado izquierdo)
        ctx.fillText('disagree', centerX - barAreaWidth / 4, categoryY);
        
        // Agree label (lado derecho)
        ctx.fillText('agree', centerX + barAreaWidth / 4, categoryY);
        
        // Neutral label (sobre la columna de neutrales)
        const neutralX = chartWidth + neutralColumnGap + neutralColumnWidth / 2;
        ctx.fillText('neutral', neutralX, categoryY);
        
        // Dibujar línea central
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, topMargin);
        ctx.lineTo(centerX, chartHeight - bottomMargin);
        ctx.stroke();
        
        // Renderizar cada ítem
        items.forEach((item, index) => {
            const y = topMargin + index * (barHeight + barSpacing);
            this.drawItem(
                ctx, 
                item, 
                stats[item], 
                y, 
                barHeight, 
                leftMargin,
                centerX,
                barAreaWidth,
                chartConfig,
                scaleConfig,
                negativeColors,
                positiveColors,
                neutralColor,
                neutralColumnWidth,
                neutralColumnGap,
                chartWidth
            );
        });
        
        // Dibujar leyenda en la parte inferior
        this.drawBottomLegend(ctx, chartConfig, scaleConfig, negativeColors, positiveColors, neutralColor, chartHeight - bottomMargin + 30);
        
        // Grid (opcional)
        if (chartConfig.showGrid) {
            this.drawGrid(ctx, centerX, barAreaWidth, topMargin, chartHeight - bottomMargin, chartConfig);
        }
    },
    
    /**
     * Dibuja la leyenda en la parte inferior con las categorías
     */
    drawBottomLegend(ctx, chartConfig, scaleConfig, negativeColors, positiveColors, neutralColor, y) {
        let legendX = 200;
        const boxSize = 14;
        const spacing = 25;
        
        ctx.font = `${chartConfig.fontSizeLegend || 10}px ${chartConfig.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Obtener etiquetas
        const labels = scaleConfig.labels || [];
        
        // Strongly disagree (primer valor - gris oscuro)
        if (labels[0]) {
            ctx.fillStyle = '#57534e';
            ctx.fillRect(legendX, y - boxSize/2, boxSize, boxSize);
            ctx.fillStyle = '#374151';
            ctx.fillText(labels[0], legendX + boxSize + 5, y);
            legendX += ctx.measureText(labels[0]).width + boxSize + spacing;
        }
        
        // Disagree (segundo valor - gris claro)
        if (labels[1] && scaleConfig.points > 3) {
            ctx.fillStyle = '#78716c';
            ctx.fillRect(legendX, y - boxSize/2, boxSize, boxSize);
            ctx.fillStyle = '#374151';
            ctx.fillText(labels[1], legendX + boxSize + 5, y);
            legendX += ctx.measureText(labels[1]).width + boxSize + spacing;
        }
        
        // Agree (primer valor positivo - naranja claro)
        const agreeIndex = scaleConfig.points > 3 ? scaleConfig.points - 2 : scaleConfig.points - 1;
        if (labels[agreeIndex]) {
            ctx.fillStyle = '#fb923c';
            ctx.fillRect(legendX, y - boxSize/2, boxSize, boxSize);
            ctx.fillStyle = '#374151';
            ctx.fillText(labels[agreeIndex], legendX + boxSize + 5, y);
            legendX += ctx.measureText(labels[agreeIndex]).width + boxSize + spacing;
        }
        
        // Strongly agree (último valor - naranja oscuro)
        if (labels[scaleConfig.points - 1] && scaleConfig.points > 3) {
            ctx.fillStyle = '#f97316';
            ctx.fillRect(legendX, y - boxSize/2, boxSize, boxSize);
            ctx.fillStyle = '#374151';
            ctx.fillText(labels[scaleConfig.points - 1], legendX + boxSize + 5, y);
        }
    },
    
    /**
     * Dibuja un ítem individual
     */
    drawItem(ctx, item, itemStats, y, barHeight, leftMargin, centerX, barAreaWidth, 
             chartConfig, scaleConfig, negativeColors, positiveColors, neutralColor,
             neutralColumnWidth, neutralColumnGap, chartWidth) {
        
        const frequencies = itemStats.frequencies;
        const total = itemStats.total;
        const midpoint = Math.ceil(scaleConfig.points / 2);
        
        // Calcular porcentajes para cada categoría
        let negativePercent = 0;
        let positivePercent = 0;
        let neutralPercent = 0;
        
        const negativeBreakdown = [];
        const positiveBreakdown = [];
        
        // Calcular negativos (valores < midpoint)
        for (let i = 1; i < midpoint; i++) {
            const count = frequencies[i] || 0;
            const percent = (count / total) * 100;
            negativePercent += percent;
            negativeBreakdown.push({ value: i, percent, count });
        }
        
        // Calcular neutral (valor = midpoint)
        const neutralCount = frequencies[midpoint] || 0;
        neutralPercent = (neutralCount / total) * 100;
        
        // Calcular positivos (valores > midpoint)
        for (let i = midpoint + 1; i <= scaleConfig.points; i++) {
            const count = frequencies[i] || 0;
            const percent = (count / total) * 100;
            positivePercent += percent;
            positiveBreakdown.push({ value: i, percent, count });
        }
        
        // Dibujar etiqueta del ítem (con ajuste de texto largo)
        ctx.fillStyle = '#1f2937';
        ctx.font = `${chartConfig.fontSizeLabels}px ${chartConfig.fontFamily}`;
        ctx.textAlign = 'right';
        const maxLabelWidth = leftMargin - 20;
        const lines = this.wrapText(ctx, item, maxLabelWidth, chartConfig.labelMaxLines || 2);
        const lineHeight = chartConfig.fontSizeLabels * 1.2;
        const totalHeight = lines.length * lineHeight;
        const startY = y + barHeight / 2 - totalHeight / 2 + lineHeight / 2;
        
        lines.forEach((line, i) => {
            ctx.fillText(line, leftMargin - 10, startY + i * lineHeight);
        });
        
        // Calcular anchos de las barras
        const pixelsPerPercent = barAreaWidth / 200; // 100% a cada lado del centro
        
        const negativeWidth = negativePercent * pixelsPerPercent;
        const positiveWidth = positivePercent * pixelsPerPercent;
        
        // Dibujar barras negativas (desde el centro hacia la izquierda)
        let currentX = centerX;
        negativeBreakdown.reverse().forEach((seg, idx) => {
            const segWidth = seg.percent * pixelsPerPercent;
            const color = negativeColors[idx % negativeColors.length];
            
            ctx.fillStyle = color;
            ctx.fillRect(currentX - segWidth, y, segWidth, barHeight);
            
            // Dibujar porcentaje si hay espacio
            if (chartConfig.showValues && segWidth > 30) {
                ctx.fillStyle = '#ffffff';
                ctx.font = `${chartConfig.fontSizeValues}px ${chartConfig.fontFamily}`;
                ctx.textAlign = 'center';
                ctx.fillText(
                    `${seg.percent.toFixed(chartConfig.decimalPlaces)}%`,
                    currentX - segWidth / 2,
                    y + barHeight / 2 + 4
                );
            }
            
            currentX -= segWidth;
        });
        
        // Dibujar barras positivas (desde el centro hacia la derecha)
        currentX = centerX;
        positiveBreakdown.forEach((seg, idx) => {
            const segWidth = seg.percent * pixelsPerPercent;
            const color = positiveColors[idx % positiveColors.length];
            
            ctx.fillStyle = color;
            ctx.fillRect(currentX, y, segWidth, barHeight);
            
            // Dibujar porcentaje si hay espacio
            if (chartConfig.showValues && segWidth > 30) {
                ctx.fillStyle = '#ffffff';
                ctx.font = `${chartConfig.fontSizeValues}px ${chartConfig.fontFamily}`;
                ctx.textAlign = 'center';
                ctx.fillText(
                    `${seg.percent.toFixed(chartConfig.decimalPlaces)}%`,
                    currentX + segWidth / 2,
                    y + barHeight / 2 + 4
                );
            }
            
            currentX += segWidth;
        });
        
        // Dibujar columna de neutrales (a la derecha, con fondo gris claro que muestra la escala completa)
        const neutralX = chartWidth + neutralColumnGap;
        
        // Fondo gris claro para mostrar el 100% de la escala
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(neutralX, y, neutralColumnWidth, barHeight);
        
        // Barra de neutral proporcional al porcentaje
        const neutralBarWidth = (neutralPercent / 100) * neutralColumnWidth;
        ctx.fillStyle = neutralColor;
        ctx.fillRect(neutralX, y, neutralBarWidth, barHeight);
        
        // Porcentaje de neutrales
        if (chartConfig.showValues && neutralPercent > 5) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${chartConfig.fontSizeValues}px ${chartConfig.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.fillText(
                `${neutralPercent.toFixed(0)}%`,
                neutralX + neutralBarWidth / 2,
                y + barHeight / 2 + 4
            );
        }
        
        // Borde de la columna neutral completa
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.strokeRect(neutralX, y, neutralColumnWidth, barHeight);
        
        // Bordes
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(centerX - negativeWidth, y, negativeWidth, barHeight);
        ctx.strokeRect(centerX, y, positiveWidth, barHeight);
        ctx.strokeRect(neutralX, y, neutralColumnWidth, barHeight);
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
    drawGrid(ctx, centerX, barAreaWidth, top, bottom, chartConfig) {
        ctx.save();
        ctx.strokeStyle = chartConfig.gridColor || '#e5e7eb';
        ctx.lineWidth = chartConfig.gridLineWidth || 1;
        
        if (chartConfig.gridDashed) {
            ctx.setLineDash([5, 5]);
        }
        
        const pixelsPerPercent = barAreaWidth / 200;
        
        // Líneas verticales
        if (chartConfig.gridVertical) {
            for (let percent = 10; percent <= 100; percent += 10) {
                // Lado negativo
                const xNeg = centerX - (percent * pixelsPerPercent);
                ctx.beginPath();
                ctx.moveTo(xNeg, top);
                ctx.lineTo(xNeg, bottom);
                ctx.stroke();
                
                // Lado positivo
                const xPos = centerX + (percent * pixelsPerPercent);
                ctx.beginPath();
                ctx.moveTo(xPos, top);
                ctx.lineTo(xPos, bottom);
                ctx.stroke();
            }
        }
        
        // Líneas horizontales
        if (chartConfig.gridHorizontal) {
            const numItems = Math.floor((bottom - top) / (chartConfig.barHeight + chartConfig.barSpacing));
            for (let i = 0; i <= numItems; i++) {
                const y = top + i * (chartConfig.barHeight + chartConfig.barSpacing);
                ctx.beginPath();
                ctx.moveTo(centerX - barAreaWidth / 2, y);
                ctx.lineTo(centerX + barAreaWidth / 2, y);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
};
