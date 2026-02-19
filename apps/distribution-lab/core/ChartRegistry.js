export class ChartRegistry {
    constructor() {
        this.charts = new Map();
    }

    register(chartModule) {
        if (!chartModule || !chartModule.id || typeof chartModule.render !== 'function') return false;
        this.charts.set(chartModule.id, chartModule);
        return true;
    }

    get(id) {
        return this.charts.get(id) || null;
    }

    getAll() {
        return Array.from(this.charts.values());
    }
}

export const chartRegistry = new ChartRegistry();

