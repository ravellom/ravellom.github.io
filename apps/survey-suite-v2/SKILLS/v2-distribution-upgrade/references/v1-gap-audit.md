# Distribution V1 vs V2 Gap Audit

Updated: 2026-03-17

## Implemented in V2

- Toolbar parity: zoom in, zoom out, reset, fullscreen, export.
- Core chart types: boxplot, violin, box + violin, raincloud, error bar.
- Shared style controls: palette, canvas, axes, grid, typography, margins, chart width.
- Label containment: wrapping, max lines, dynamic spacing.
- Group-level controls: outliers, jitter, sample size labels, marker style/metric/color/size.
- Analysis controls now exposed and wired:
  - overall mean line
  - mean label
  - stats panel
  - stats fields
  - stats position
  - hypothesis test visibility
  - hypothesis mode
  - custom annotation text and placement

## Still Missing or Incomplete vs V1

- Advanced exports:
  - clipboard copy
  - summary CSV
  - config JSON
  - batch export
- Richer export controls:
  - DPI selector
  - transparent background behavior review
- Dedicated Notes tab parity and more polished annotation UX.
- More refined visual parity in raincloud and error bar.
- Better axis logic for some vertical layouts.
- Full i18n coverage in module labels and options.

## Next High-Value Steps

1. Add advanced export actions to match v1 utility workflow.
2. Refine vertical axis and overlay placement in dense charts.
3. Improve raincloud/error bar visuals to approach v1 quality.
4. Finish i18n pass for distribution controls and messages.
