# Survey Suite v2 Visual Audit

## Conclusion

v1 and v2 do not use different charting libraries. Both suites render charts directly on native HTML canvas. The visual gap comes from renderer maturity, layout geometry, spacing defaults, legend behavior, palette application, and the amount of chart-specific polish.

## Evidence

- v2 dependencies in `apps/survey-suite-v2/package.json` only include `vite`, `typescript`, and `playwright`.
- v1 renderers draw directly with `canvas.getContext('2d')` in:
  - `apps/likert-charts/charts/StackedChart.js`
  - `apps/likert-charts/charts/DivergingChart.js`
  - `apps/likert-charts/charts/SplitChart.js`
  - `apps/distribution-lab/charts/*.js`
- v2 renderers also draw directly on canvas in:
  - `apps/survey-suite-v2/src/features/likert/chart.ts`
  - `apps/survey-suite-v2/src/features/distribution/chart.ts`

## Main Gaps

### Likert

- Legend layout in v2 was simpler than v1:
  - weaker spacing
  - no swatch border
  - no row wrapping for top/bottom legends
- Title hierarchy is flatter in v2.
- Split and diverging are functional, but still need more micro-adjustments around axis labels and neutral-column visual balance.
- v1 still feels denser and more deliberate in typography and frame composition.

### Distribution

- v2 used mostly fixed blue tones, while v1 feels more intentionally colored and chart-type aware.
- Errorbar, violin, and raincloud still need more refinement in stroke hierarchy and density.
- v1 has more chart-specific polish per renderer, especially around labels, caps, whiskers, and composition.
- Analysis and annotations are present in v2 now, but overall chart styling still needs another pass to match v1 quality.

## Improvements Already Applied In This Pass

- `distribution` style panel reorganized into grouped tabs like `likert`.
- checkbox alignment normalized across local module controls.
- `likert` legend improved with:
  - wrapped horizontal layout
  - dynamic margin reservation
  - bordered swatches
- `distribution` now uses the shared palette as the visual base instead of hardcoded blue-only fills.

## Next High-Impact Tasks

1. Refine `likert` split/diverging axis labels and central balance.
2. Add chart-specific legend or key treatment for `distribution` where useful.
3. Improve `errorbar` and `raincloud` stroke hierarchy to better match v1.
4. Tune default spacing and typography presets module by module instead of relying only on global defaults.
