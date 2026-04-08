# Likert V2 Backlog

## Must Have

- Phase 3.1: remove placeholder chart UX or implement the missing modes.
- Phase 3.2: improve dense-chart readability and default layout behavior.
- Phase 3.3: make export options match real output behavior.
- Remove the gap between visible controls and actual supported chart modes.
- Reach parity for the main v1 style panels: colors, typography, bars, legend, axes and grid, canvas.
- Ensure grid toggles, axis labels, frame, and canvas sizing work reliably.
- Improve long-label readability and spacing for dense item sets.
- Make export usable for production output, not only for preview.

## Should Have

- Shared chart toolbar patterns with distribution.
- Better presets for common likert looks.
- Stronger comparison or alternate view support if already present in v1 workflows.
- Faster reset-to-default actions for style-heavy sessions.

## Nice To Have

- Batch export variants.
- Named style profiles.
- Better annotation or callout support for reporting contexts.

## Expected V2 Touchpoints

- `apps/survey-suite-v2/src/features/likert/view.ts`
- `apps/survey-suite-v2/src/features/likert/`

## Validation Checklist

- Each visible control has a real visible effect.
- Dense charts remain readable without obvious overlap.
- Grid and frame appear in the correct visual layer.
- Exported output preserves the same structure users see on screen.
