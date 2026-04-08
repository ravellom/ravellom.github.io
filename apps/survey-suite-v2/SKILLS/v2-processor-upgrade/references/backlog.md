# Processor V2 Backlog

## Must Have

- Phase 2.1: raise import parity and accepted-format guidance.
- Phase 2.2: improve dataset inspection and schema visibility.
- Phase 2.3: complete storage ergonomics and active dataset clarity.
- Restore practical file support parity with v1 for the formats used in current workflows.
- Match the storage flow: save dataset, list stored datasets, activate dataset, and show active dataset clearly.
- Add stronger dataset status feedback for loading, success, empty state, and parse failure.
- Expose column and shape information with enough visibility for users to trust what was imported.
- Keep processor controls grouped in a clearer sequence: import, inspect, transform, store.

## Should Have

- Column preview with data type hints and null/empty summaries.
- Better normalization options and guided cleanup actions.
- Contextual help for accepted files and expected schema.
- Clearer success/error copy near the affected control rather than generic messaging.

## Nice To Have

- Saved transformation presets.
- Reusable import profiles.
- Inline sample datasets for quick testing.
- More detailed operation history or undo-like checkpoints.

## Expected V2 Touchpoints

- `apps/survey-suite-v2/src/features/processor/view.ts`
- `apps/survey-suite-v2/src/features/processor/`
- `apps/survey-suite-v2/src/main.ts`

## Validation Checklist

- Importing a dataset updates the active dataset state.
- Saving to storage creates a visible reusable entry.
- Activating a stored dataset refreshes downstream modules.
- Error states remain readable and actionable.
- The processor panel still feels usable at normal desktop width.
