export const ChartOptionsAdapter = {
    normalize(config = {}) {
        return {
            chartType: config.chartType || 'boxplot',
            fontFamily: config.fontFamily || 'Arial, sans-serif',
            marginTop: Number(config.marginTop || 60),
            marginBottom: Number(config.marginBottom || 80),
            marginLeft: Number(config.marginLeft || 120),
            marginRight: Number(config.marginRight || 100),
            chartWidth: Number(config.chartWidth || 1200),
            showOutliers: config.showOutliers !== false,
            showJitter: config.showJitter === true
        };
    }
};

