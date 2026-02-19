function mean(values) {
    if (!values.length) return NaN;
    return values.reduce((s, v) => s + v, 0) / values.length;
}

function sampleVariance(values) {
    if (values.length < 2) return 0;
    const m = mean(values);
    return values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
}

function erf(x) {
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * ax);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-ax * ax);
    return sign * y;
}

function normalCdf(x) {
    return 0.5 * (1 + erf(x / Math.SQRT2));
}

function gammaln(z) {
    const cof = [
        76.18009172947146,
        -86.50532032941677,
        24.01409824083091,
        -1.231739572450155,
        0.001208650973866179,
        -0.000005395239384953
    ];
    let x = z;
    let y = z;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < cof.length; j += 1) {
        y += 1;
        ser += cof[j] / y;
    }
    return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function betacf(a, b, x) {
    const maxIt = 100;
    const eps = 3e-7;
    const fpmin = 1e-30;
    let qab = a + b;
    let qap = a + 1;
    let qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < fpmin) d = fpmin;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= maxIt; m += 1) {
        const m2 = 2 * m;
        let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < fpmin) d = fpmin;
        c = 1 + aa / c;
        if (Math.abs(c) < fpmin) c = fpmin;
        d = 1 / d;
        h *= d * c;
        aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < fpmin) d = fpmin;
        c = 1 + aa / c;
        if (Math.abs(c) < fpmin) c = fpmin;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < eps) break;
    }
    return h;
}

function betainc(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) {
        return (bt * betacf(a, b, x)) / a;
    }
    return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

function gammaP(a, x) {
    if (x < 0 || a <= 0) return NaN;
    if (x === 0) return 0;
    if (x < a + 1) {
        let ap = a;
        let sum = 1 / a;
        let del = sum;
        for (let n = 1; n <= 100; n += 1) {
            ap += 1;
            del *= x / ap;
            sum += del;
            if (Math.abs(del) < Math.abs(sum) * 1e-7) break;
        }
        return sum * Math.exp(-x + a * Math.log(x) - gammaln(a));
    }
    let b = x + 1 - a;
    let c = 1 / 1e-30;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i <= 100; i += 1) {
        const an = -i * (i - a);
        b += 2;
        d = an * d + b;
        if (Math.abs(d) < 1e-30) d = 1e-30;
        c = b + an / c;
        if (Math.abs(c) < 1e-30) c = 1e-30;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < 1e-7) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - gammaln(a)) * h;
}

function studentTCdf(t, df) {
    if (!Number.isFinite(t) || !Number.isFinite(df) || df <= 0) return NaN;
    const x = df / (df + t * t);
    const ib = betainc(df / 2, 0.5, x);
    return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
}

function fCdf(f, d1, d2) {
    if (f <= 0) return 0;
    const x = (d1 * f) / (d1 * f + d2);
    return betainc(d1 / 2, d2 / 2, x);
}

function chiSquareCdf(x, df) {
    return gammaP(df / 2, x / 2);
}

function rankWithTies(values) {
    const sorted = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(values.length);
    let i = 0;
    while (i < sorted.length) {
        let j = i + 1;
        while (j < sorted.length && sorted[j].v === sorted[i].v) j += 1;
        const avgRank = (i + 1 + j) / 2;
        for (let k = i; k < j; k += 1) ranks[sorted[k].i] = avgRank;
        i = j;
    }
    return ranks;
}

function welchTTest(a, b) {
    const n1 = a.length;
    const n2 = b.length;
    if (n1 < 2 || n2 < 2) return null;
    const m1 = mean(a);
    const m2 = mean(b);
    const v1 = sampleVariance(a);
    const v2 = sampleVariance(b);
    const se = Math.sqrt(v1 / n1 + v2 / n2);
    if (!Number.isFinite(se) || se <= 0) return null;
    const t = (m1 - m2) / se;
    const df = ((v1 / n1 + v2 / n2) ** 2) / (((v1 / n1) ** 2) / (n1 - 1) + ((v2 / n2) ** 2) / (n2 - 1));
    const cdf = studentTCdf(Math.abs(t), df);
    const p = Math.max(0, Math.min(1, 2 * (1 - cdf)));
    const pooled = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2));
    const d = pooled > 0 ? (m1 - m2) / pooled : 0;
    return { test: 'welch_t', statLabel: 't', stat: t, df, p, effectLabel: "Cohen's d", effect: d };
}

function mannWhitney(a, b) {
    const n1 = a.length;
    const n2 = b.length;
    if (n1 < 2 || n2 < 2) return null;
    const combined = [...a, ...b];
    const ranks = rankWithTies(combined);
    const r1 = ranks.slice(0, n1).reduce((s, r) => s + r, 0);
    const u1 = r1 - (n1 * (n1 + 1)) / 2;
    const u2 = n1 * n2 - u1;
    const u = Math.min(u1, u2);
    const mu = (n1 * n2) / 2;
    const sigma = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
    if (sigma === 0) return null;
    const z = (u - mu + 0.5) / sigma;
    const p = Math.max(0, Math.min(1, 2 * (1 - normalCdf(Math.abs(z)))));
    const rbc = 1 - (2 * u) / (n1 * n2);
    return { test: 'mann_whitney', statLabel: 'U', stat: u, z, p, effectLabel: 'Rank-biserial r', effect: rbc };
}

function oneWayAnova(groups) {
    const arrays = groups.map((g) => g.values.filter(Number.isFinite));
    const nTotal = arrays.reduce((s, arr) => s + arr.length, 0);
    const k = arrays.length;
    if (k < 2 || nTotal <= k) return null;
    const grand = mean(arrays.flat());
    let ssb = 0;
    let ssw = 0;
    arrays.forEach((arr) => {
        const m = mean(arr);
        ssb += arr.length * (m - grand) ** 2;
        ssw += arr.reduce((s, v) => s + (v - m) ** 2, 0);
    });
    const df1 = k - 1;
    const df2 = nTotal - k;
    const msb = ssb / df1;
    const msw = ssw / df2;
    const f = msw > 0 ? msb / msw : 0;
    const p = Math.max(0, Math.min(1, 1 - fCdf(f, df1, df2)));
    const eta2 = (ssb + ssw) > 0 ? ssb / (ssb + ssw) : 0;
    return { test: 'anova', statLabel: 'F', stat: f, df1, df2, p, effectLabel: 'eta^2', effect: eta2 };
}

function kruskalWallis(groups) {
    const arrays = groups.map((g) => g.values.filter(Number.isFinite));
    const k = arrays.length;
    const n = arrays.reduce((s, arr) => s + arr.length, 0);
    if (k < 2 || n <= k) return null;
    const combined = arrays.flat();
    const ranks = rankWithTies(combined);
    let offset = 0;
    let hNumerator = 0;
    arrays.forEach((arr) => {
        const rSum = ranks.slice(offset, offset + arr.length).reduce((s, r) => s + r, 0);
        hNumerator += (rSum ** 2) / arr.length;
        offset += arr.length;
    });
    const h = (12 / (n * (n + 1))) * hNumerator - 3 * (n + 1);
    const df = k - 1;
    const p = Math.max(0, Math.min(1, 1 - chiSquareCdf(h, df)));
    const eps2 = (n - k) > 0 ? (h - k + 1) / (n - k) : 0;
    return { test: 'kruskal_wallis', statLabel: 'H', stat: h, df, p, effectLabel: 'epsilon^2', effect: eps2 };
}

export const HypothesisTests = {
    compare(groups = [], mode = 'auto') {
        const valid = groups
            .map((g) => ({ label: g.label, values: (g.values || []).map(Number).filter(Number.isFinite) }))
            .filter((g) => g.values.length >= 2);
        if (valid.length < 2) return null;

        if (mode === 'nonparametric') {
            return valid.length === 2 ? mannWhitney(valid[0].values, valid[1].values) : kruskalWallis(valid);
        }

        if (mode === 'parametric') {
            return valid.length === 2 ? welchTTest(valid[0].values, valid[1].values) : oneWayAnova(valid);
        }

        return valid.length === 2 ? welchTTest(valid[0].values, valid[1].values) : oneWayAnova(valid);
    }
};
