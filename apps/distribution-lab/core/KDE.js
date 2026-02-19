export const KDE = {
    gaussian(u) {
        return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
    },

    estimate(values = [], domain = [], bandwidth = 1) {
        const numeric = values.map(Number).filter((v) => Number.isFinite(v));
        if (!numeric.length || !domain.length || bandwidth <= 0) return [];
        return domain.map((x) => {
            let sum = 0;
            numeric.forEach((v) => {
                sum += this.gaussian((x - v) / bandwidth);
            });
            return [x, sum / (numeric.length * bandwidth)];
        });
    }
};

