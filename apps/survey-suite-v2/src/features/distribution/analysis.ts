import type { Dataset } from '../../shared/types/state';

export type DistributionGroupOrder = 'original' | 'alphabetical' | 'median_desc' | 'median_asc';
export type HypothesisMode = 'auto' | 'parametric' | 'nonparametric';

export interface DistributionSummary {
  n: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  sd: number;
  iqr: number;
  outliers: number[];
}

export interface DistributionGroup {
  label: string;
  values: number[];
  summary: DistributionSummary;
}

export interface HypothesisResult {
  test: 'welch_t' | 'mann_whitney' | 'anova' | 'kruskal_wallis';
  statLabel: string;
  stat: number;
  df?: number;
  df1?: number;
  df2?: number;
  p: number;
  effectLabel: string;
  effect: number;
}

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function summarizeBox(values: number[], whiskerMultiplier: number): DistributionSummary {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) {
    return {
      n: 0,
      min: NaN,
      q1: NaN,
      median: NaN,
      q3: NaN,
      max: NaN,
      mean: NaN,
      sd: NaN,
      iqr: NaN,
      outliers: []
    };
  }

  const mean = sorted.reduce((acc, item) => acc + item, 0) / sorted.length;
  const variance = sorted.length > 1
    ? sorted.reduce((acc, item) => acc + (item - mean) ** 2, 0) / (sorted.length - 1)
    : 0;
  const q1 = quantile(sorted, 0.25);
  const median = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - whiskerMultiplier * iqr;
  const upperFence = q3 + whiskerMultiplier * iqr;
  const inliers = sorted.filter((value) => value >= lowerFence && value <= upperFence);
  const outliers = sorted.filter((value) => value < lowerFence || value > upperFence);

  return {
    n: sorted.length,
    min: inliers[0] ?? sorted[0],
    q1,
    median,
    q3,
    max: inliers[inliers.length - 1] ?? sorted[sorted.length - 1],
    mean,
    sd: Math.sqrt(variance),
    iqr,
    outliers
  };
}

export function groupDistributionData(
  dataset: Dataset | null,
  numericColumn: string,
  categoryColumn: string,
  groupOrder: DistributionGroupOrder,
  topN: number,
  whiskerMultiplier: number
): DistributionGroup[] {
  if (!dataset?.records?.length || !numericColumn) return [];
  const grouped = new Map<string, number[]>();

  dataset.records.forEach((row) => {
    const value = toFiniteNumber(row[numericColumn]);
    if (value === null) return;
    const key = categoryColumn
      ? String(row[categoryColumn] ?? '(empty)').trim() || '(empty)'
      : numericColumn;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)?.push(value);
  });

  const entries = Array.from(grouped.entries())
    .map(([label, values]) => ({ label, values, summary: summarizeBox(values, whiskerMultiplier) }))
    .filter((group) => group.summary.n > 0);

  if (groupOrder === 'alphabetical') entries.sort((a, b) => a.label.localeCompare(b.label));
  if (groupOrder === 'median_desc') entries.sort((a, b) => b.summary.median - a.summary.median);
  if (groupOrder === 'median_asc') entries.sort((a, b) => a.summary.median - b.summary.median);

  return entries.slice(0, Math.max(1, topN));
}

export function summarizeOverall(groups: DistributionGroup[]): DistributionSummary {
  return summarizeBox(groups.flatMap((group) => group.values), 1.5);
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1);
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-ax * ax);
  return sign * y;
}

function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function gammaln(z: number): number {
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
  for (let index = 0; index < cof.length; index += 1) {
    y += 1;
    ser += cof[index] / y;
  }
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function betacf(a: number, b: number, x: number): number {
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

function betainc(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(a, b, x)) / a;
  }
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

function gammaP(a: number, x: number): number {
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

function studentTCdf(t: number, df: number): number {
  if (!Number.isFinite(t) || !Number.isFinite(df) || df <= 0) return NaN;
  const x = df / (df + t * t);
  const ib = betainc(df / 2, 0.5, x);
  return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
}

function fCdf(f: number, d1: number, d2: number): number {
  if (f <= 0) return 0;
  const x = (d1 * f) / (d1 * f + d2);
  return betainc(d1 / 2, d2 / 2, x);
}

function chiSquareCdf(x: number, df: number): number {
  return gammaP(df / 2, x / 2);
}

function rankWithTies(values: number[]): number[] {
  const sorted = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const ranks = new Array(values.length);
  let index = 0;
  while (index < sorted.length) {
    let end = index + 1;
    while (end < sorted.length && sorted[end].value === sorted[index].value) end += 1;
    const avgRank = (index + 1 + end) / 2;
    for (let cursor = index; cursor < end; cursor += 1) ranks[sorted[cursor].index] = avgRank;
    index = end;
  }
  return ranks;
}

function welchTTest(a: number[], b: number[]): HypothesisResult | null {
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

function mannWhitney(a: number[], b: number[]): HypothesisResult | null {
  const n1 = a.length;
  const n2 = b.length;
  if (n1 < 2 || n2 < 2) return null;
  const combined = [...a, ...b];
  const ranks = rankWithTies(combined);
  const r1 = ranks.slice(0, n1).reduce((sum, rank) => sum + rank, 0);
  const u1 = r1 - (n1 * (n1 + 1)) / 2;
  const u2 = n1 * n2 - u1;
  const u = Math.min(u1, u2);
  const mu = (n1 * n2) / 2;
  const sigma = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
  if (sigma === 0) return null;
  const z = (u - mu + 0.5) / sigma;
  const p = Math.max(0, Math.min(1, 2 * (1 - normalCdf(Math.abs(z)))));
  const rbc = 1 - (2 * u) / (n1 * n2);
  return { test: 'mann_whitney', statLabel: 'U', stat: u, p, effectLabel: 'Rank-biserial r', effect: rbc };
}

function oneWayAnova(groups: DistributionGroup[]): HypothesisResult | null {
  const arrays = groups.map((group) => group.values.filter(Number.isFinite));
  const nTotal = arrays.reduce((sum, values) => sum + values.length, 0);
  const k = arrays.length;
  if (k < 2 || nTotal <= k) return null;
  const grand = mean(arrays.flat());
  let ssb = 0;
  let ssw = 0;
  arrays.forEach((values) => {
    const m = mean(values);
    ssb += values.length * (m - grand) ** 2;
    ssw += values.reduce((sum, value) => sum + (value - m) ** 2, 0);
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

function kruskalWallis(groups: DistributionGroup[]): HypothesisResult | null {
  const arrays = groups.map((group) => group.values.filter(Number.isFinite));
  const k = arrays.length;
  const n = arrays.reduce((sum, values) => sum + values.length, 0);
  if (k < 2 || n <= k) return null;
  const combined = arrays.flat();
  const ranks = rankWithTies(combined);
  let offset = 0;
  let numerator = 0;
  arrays.forEach((values) => {
    const rSum = ranks.slice(offset, offset + values.length).reduce((sum, rank) => sum + rank, 0);
    numerator += (rSum ** 2) / values.length;
    offset += values.length;
  });
  const h = (12 / (n * (n + 1))) * numerator - 3 * (n + 1);
  const df = k - 1;
  const p = Math.max(0, Math.min(1, 1 - chiSquareCdf(h, df)));
  const eps2 = (n - k) > 0 ? (h - k + 1) / (n - k) : 0;
  return { test: 'kruskal_wallis', statLabel: 'H', stat: h, df, p, effectLabel: 'epsilon^2', effect: eps2 };
}

export function compareDistributionGroups(groups: DistributionGroup[], mode: HypothesisMode): HypothesisResult | null {
  const valid = groups.filter((group) => group.values.filter(Number.isFinite).length >= 2);
  if (valid.length < 2) return null;
  if (mode === 'nonparametric') {
    return valid.length === 2 ? mannWhitney(valid[0].values, valid[1].values) : kruskalWallis(valid);
  }
  if (mode === 'parametric') {
    return valid.length === 2 ? welchTTest(valid[0].values, valid[1].values) : oneWayAnova(valid);
  }
  return valid.length === 2 ? welchTTest(valid[0].values, valid[1].values) : oneWayAnova(valid);
}
