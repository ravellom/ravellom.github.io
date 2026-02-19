/**
 * ChartOptionsAdapter
 * Normaliza opciones del chart para que todos los módulos usen el mismo contrato.
 */
export const ChartOptionsAdapter = {
    normalize(chartConfig = {}, scaleConfig = {}, chartType = '') {
        const toNum = (value, fallback) => {
            const n = Number(value);
            return Number.isFinite(n) ? n : fallback;
        };

        const safePoints = Math.max(2, toNum(scaleConfig.points, 5));

        const normalized = {
            ...chartConfig,
            type: chartType || chartConfig.type || 'stacked',
            valueType: chartConfig.valueType || 'percentage',
            fontFamily: chartConfig.fontFamily || 'Arial, sans-serif',
            fontSizeLabels: Math.max(8, toNum(chartConfig.fontSizeLabels, 12)),
            fontSizeValues: Math.max(8, toNum(chartConfig.fontSizeValues, 11)),
            fontSizeLegend: Math.max(8, toNum(chartConfig.fontSizeLegend, 10)),
            fontSizeTitle: Math.max(10, toNum(chartConfig.fontSizeTitle, 18)),
            barHeight: Math.max(8, toNum(chartConfig.barHeight, 40)),
            barSpacing: Math.max(0, toNum(chartConfig.barSpacing, 10)),
            decimalPlaces: Math.max(0, toNum(chartConfig.decimalPlaces, 1)),
            chartWidth: Math.max(640, toNum(chartConfig.chartWidth, 1200)),
            marginTop: Math.max(10, toNum(chartConfig.marginTop, 60)),
            marginBottom: Math.max(10, toNum(chartConfig.marginBottom, 80)),
            marginLeft: Math.max(60, toNum(chartConfig.marginLeft, 200)),
            marginRight: Math.max(60, toNum(chartConfig.marginRight, 150)),
            axisWidth: Math.max(1, toNum(chartConfig.axisWidth, 2)),
            gridLineWidth: Math.max(1, toNum(chartConfig.gridLineWidth, 1)),
            barBorderWidth: Math.max(1, toNum(chartConfig.barBorderWidth, 1)),
            labelMaxLines: Math.max(1, toNum(chartConfig.labelMaxLines, 2)),
            backgroundColor: chartConfig.backgroundColor || '#ffffff',
            showTitle: chartConfig.showTitle !== false,
            showLegend: chartConfig.showLegend !== false,
            showValues: chartConfig.showValues !== false,
            showAxisLabels: chartConfig.showAxisLabels !== false,
            showGrid: chartConfig.showGrid === true,
            showGridBorder: chartConfig.showGridBorder !== false,
            showBarBorders: chartConfig.showBarBorders === true,
            transparentBackground: chartConfig.transparentBackground === true
        };

        const innerWidth = Math.max(120, normalized.chartWidth - normalized.marginLeft - normalized.marginRight);
        normalized.innerWidth = innerWidth;
        normalized.points = safePoints;
        return normalized;
    }
};

