function quantile(sortedValues, q) {
    if (!sortedValues.length) return NaN;
    const pos = (sortedValues.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    const next = sortedValues[base + 1];
    if (next !== undefined) {
        return sortedValues[base] + rest * (next - sortedValues[base]);
    }
    return sortedValues[base];
}

export const StatsEngine = {
    summarize(values = []) {
        const numeric = values
            .map((v) => Number(v))
            .filter((v) => Number.isFinite(v))
            .sort((a, b) => a - b);

        if (!numeric.length) {
            return {
                n: 0,
                min: NaN,
                q1: NaN,
                median: NaN,
                q3: NaN,
                max: NaN,
                mean: NaN,
                iqr: NaN
            };
        }

        const n = numeric.length;
        const mean = numeric.reduce((sum, v) => sum + v, 0) / n;
        const q1 = quantile(numeric, 0.25);
        const median = quantile(numeric, 0.5);
        const q3 = quantile(numeric, 0.75);

        return {
            n,
            min: numeric[0],
            q1,
            median,
            q3,
            max: numeric[n - 1],
            mean,
            iqr: q3 - q1
        };
    },

    summarizeBox(values = [], whiskerMultiplier = 1.5) {
        const base = this.summarize(values);
        if (!base.n) {
            return {
                ...base,
                lowerWhisker: NaN,
                upperWhisker: NaN,
                outliers: []
            };
        }

        const numeric = values
            .map((v) => Number(v))
            .filter((v) => Number.isFinite(v))
            .sort((a, b) => a - b);

        const safeMultiplier = Number.isFinite(Number(whiskerMultiplier)) ? Number(whiskerMultiplier) : 1.5;
        const lowerFence = base.q1 - safeMultiplier * base.iqr;
        const upperFence = base.q3 + safeMultiplier * base.iqr;
        const inliers = numeric.filter((v) => v >= lowerFence && v <= upperFence);
        const outliers = numeric.filter((v) => v < lowerFence || v > upperFence);

        return {
            ...base,
            lowerWhisker: inliers.length ? inliers[0] : base.min,
            upperWhisker: inliers.length ? inliers[inliers.length - 1] : base.max,
            outliers
        };
    },

    groupNumeric(dataRows = [], numericColumn = '', categoryColumn = '', whiskerMultiplier = 1.5) {
        const grouped = new Map();
        dataRows.forEach((row) => {
            const category = categoryColumn ? String(row?.[categoryColumn] ?? '').trim() || '(empty)' : 'All data';
            const value = Number(row?.[numericColumn]);
            if (!Number.isFinite(value)) return;
            if (!grouped.has(category)) grouped.set(category, []);
            grouped.get(category).push(value);
        });

        return Array.from(grouped.entries()).map(([label, values]) => ({
            label,
            values,
            summary: this.summarizeBox(values, whiskerMultiplier)
        }));
    }
};
