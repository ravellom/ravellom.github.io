/**
 * HeatmapChart - Mapa de calor de respuestas
 * Muestra una matriz de ítems vs valores con intensidad de color
 * EJEMPLO: Este es un gráfico adicional que puedes habilitar
 */

export default {
    id: 'heatmap',
    
    name: {
        en: 'Heatmap',
        es: 'Mapa de Calor'
    },

    description: {
        en: 'Heatmap showing response intensity per item and value',
        es: 'Mapa de calor mostrando intensidad de respuestas por ítem y valor'
    },

    /**
     * Renderiza el mapa de calor
     */
    render(canvas, items, stats, config, scaleConfig, getColors, t) {
        const ctx = canvas.getContext('2d');
        const colors = getColors();
        
        // Dimensiones
        const margin = { top: 60, right: 100, bottom: 60, left: 200 };
        const cellWidth = 80;
        const cellHeight = 40;
        const chartWidth = margin.left + margin.right + (scaleConfig.points * cellWidth);
        const chartHeight = margin.top + margin.bottom + (items.length * cellHeight);
        
        canvas.width = chartWidth;
        canvas.height = chartHeight;
        ctx.clearRect(0, 0, chartWidth, chartHeight);
        
        // Título
        ctx.font = `bold ${config.fontSizeLabels + 4}px ${config.fontFamily}`;
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(t('chart_heatmap') || 'Mapa de Calor', chartWidth / 2, 30);
        
        // Encontrar el máximo para normalizar colores
        let maxFrequency = 0;
        items.forEach(item => {
            const stat = stats[item];
            for (let value = 1; value <= scaleConfig.points; value++) {
                maxFrequency = Math.max(maxFrequency, stat.frequencies[value] || 0);
            }
        });
        
        // Dibujar celdas del mapa
        items.forEach((item, rowIndex) => {
            const y = margin.top + rowIndex * cellHeight;
            const stat = stats[item];
            
            // Etiqueta del ítem
            ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(item, margin.left - 10, y + cellHeight / 2);
            
            // Celdas de valores
            for (let value = 1; value <= scaleConfig.points; value++) {
                const x = margin.left + (value - 1) * cellWidth;
                const count = stat.frequencies[value] || 0;
                const percentage = (count / stat.total) * 100;
                const intensity = count / maxFrequency;
                
                // Usar el color de la escala pero aplicar opacidad según intensidad
                const baseColor = colors[value - 1] || '#cbd5e1';
                ctx.globalAlpha = 0.2 + (intensity * 0.8); // Mínimo 20% de opacidad
                ctx.fillStyle = baseColor;
                
                // Dibujar celda
                ctx.fillRect(x, y, cellWidth - 2, cellHeight - 2);
                ctx.globalAlpha = 1.0;
                
                // Borde
                ctx.strokeStyle = '#e2e8f0';
                ctx.strokeRect(x, y, cellWidth - 2, cellHeight - 2);
                
                // Valor en la celda
                if (config.showValues && count > 0) {
                    ctx.font = `${config.fontSizeValues}px ${config.fontFamily}`;
                    ctx.fillStyle = intensity > 0.5 ? '#ffffff' : '#1e293b';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    const displayValue = config.valueType === 'percentage'
                        ? percentage.toFixed(config.decimalPlaces) + '%'
                        : count;
                    
                    ctx.fillText(displayValue, x + cellWidth / 2 - 1, y + cellHeight / 2);
                }
            }
        });
        
        // Encabezados de columnas (valores de escala)
        ctx.font = `${config.fontSizeLabels}px ${config.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        for (let value = 1; value <= scaleConfig.points; value++) {
            const x = margin.left + (value - 1) * cellWidth + cellWidth / 2 - 1;
            const label = scaleConfig.labels[value - 1] || `${value}`;
            
            // Rotar texto si es largo
            if (label.length > 10) {
                ctx.save();
                ctx.translate(x, margin.top - 10);
                ctx.rotate(-Math.PI / 4);
                ctx.fillStyle = '#475569';
                ctx.fillText(label, 0, 0);
                ctx.restore();
            } else {
                ctx.fillStyle = '#475569';
                ctx.fillText(label, x, margin.top - 10);
            }
        }
        
        // Leyenda de intensidad
        if (config.showLegend) {
            this.drawIntensityLegend(ctx, config, chartWidth - margin.right + 20, margin.top, colors[Math.floor(colors.length/2)]);
        }
        
        // Marca de agua
        if (config.watermark) {
            ctx.font = `${config.fontSizeLegend}px ${config.fontFamily}`;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.textAlign = 'center';
            ctx.fillText(config.watermark, chartWidth / 2, chartHeight - 20);
        }
    },

    /**
     * Dibuja la leyenda de intensidad
     */
    drawIntensityLegend(ctx, config, x, y, baseColor) {
        const width = 20;
        const height = 150;
        const steps = 10;
        
        ctx.font = `${config.fontSizeLegend}px ${config.fontFamily}`;
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'left';
        ctx.fillText('Intensidad:', x, y - 10);
        
        // Gradiente de intensidad
        for (let i = 0; i < steps; i++) {
            const intensity = i / steps;
            ctx.globalAlpha = 0.2 + (intensity * 0.8);
            ctx.fillStyle = baseColor;
            
            const cellY = y + (i * height / steps);
            ctx.fillRect(x, cellY, width, height / steps);
            
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(x, cellY, width, height / steps);
        }
        ctx.globalAlpha = 1.0;
        
        // Etiquetas
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.fillText('Más', x + width + 5, y + 10);
        ctx.fillText('Menos', x + width + 5, y + height);
    },

    /**
     * Valida si puede renderizar
     */
    canRender(items, stats, scaleConfig) {
        return items && items.length > 0 && stats && scaleConfig && scaleConfig.points <= 10;
    }
};
