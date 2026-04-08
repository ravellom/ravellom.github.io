# Distribution V2 Backlog

## Must Have

- Phase 1.1: add toolbar parity with zoom, reset, fullscreen, and export.
- Phase 1.2: add label containment controls and make long labels readable.
- Phase 1.3: add canvas and layout controls needed for practical chart tuning.
- Phase 1.4: implement real chart-type expansion beyond the current minimal renderer.
- Add parity for the core chart controls users already rely on in v1.
- Support the key chart types needed for real analysis workflows: at minimum boxplot, violin, box plus violin, raincloud, and error bar.
- Add zoom, reset zoom, fullscreen, and practical export actions.
- Add label wrapping and line-count controls so long item text does not break the chart.
- Improve chart layout controls for margins, plot size, and row spacing.

## Should Have

- Better stats and summary panels near the chart.
- Shared toolbar behavior with likert.
- Better orientation handling and smarter spacing defaults.
- Export presets for presentation and report use.

## Nice To Have

- Saved viewport and layout presets.
- Rich annotations or callouts.
- More advanced statistical overlays when already justified by the data model.

## Expected V2 Touchpoints

- `apps/survey-suite-v2/src/features/distribution/view.ts`
- `apps/survey-suite-v2/src/features/distribution/chart.ts`
- `apps/survey-suite-v2/src/features/distribution/`
- `apps/survey-suite-v2/src/main.ts`

## Validation Checklist

- Long labels remain readable at normal desktop width.
- Zoom and fullscreen improve analysis instead of breaking layout.
- Each chart mode renders with correct spacing and axis logic.
- Exported output is legible and close to the on-screen result.
