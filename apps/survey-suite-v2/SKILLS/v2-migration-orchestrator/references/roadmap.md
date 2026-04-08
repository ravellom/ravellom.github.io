# Survey Suite V2 Migration Roadmap

## Goal

Bring `apps/survey-suite-v2/` to functional parity with the mature v1 suite while preserving the cleaner integrated architecture of v2.

## Current Diagnosis

### V1 strengths

- Mature, feature-rich modules already validated in real workflows.
- Better panel distribution and clearer interaction density.
- More complete export, storage, and chart controls.

### V2 strengths

- Unified app shell and shared state.
- More maintainable long-term architecture.
- Better base for shared settings and future reuse.

### Main gap

V2 is architecturally cleaner but still lacks the breadth, depth, and polish of the v1 modules.

## Delivery Principles

1. Port capabilities, not legacy structure.
2. Fix the most user-visible workflow gaps first.
3. Prefer small vertical slices that include UI, state, render, and verification.
4. Promote shared helpers only after the second concrete use case.

## Phase 1: Distribution Baseline

### Must have

- Match the main chart controls available in v1.
- Bring label handling, zoom, layout, and canvas controls to parity.
- Support the key chart types needed for normal exploratory analysis.
- Reduce visual regressions such as clipped labels or poor spacing.

### Should have

- Fast export actions from the chart toolbar.
- Better annotations and summary stats presentation.
- Shared chart toolbar patterns with likert.

### Nice to have

- Persisted viewport and chart presets.
- Smarter label wrapping based on available plot area.

## Phase 2: Processor Baseline

### Must have

- Match upload, parse, normalize, and storage flows from v1.
- Support the same practical dataset formats used in v1 workflows.
- Restore storage ergonomics and dataset management visibility.

### Should have

- Better schema preview and column diagnostics.
- Better recovery from parse errors and invalid files.

### Nice to have

- Reusable transformation presets.
- More guided onboarding and contextual help.

## Phase 3: Likert Completion

### Must have

- Remove or implement any placeholder chart modes.
- Reach parity in the style and canvas controls that users already expect from v1.
- Ensure grid, labels, legends, and export behave consistently.

### Should have

- Shared presets with distribution.
- Better comparison views and reusable style profiles.

### Nice to have

- Batch export and quick duplication of chart variants.

## Phase 4: Shared UX and Infrastructure

### Must have

- Unified export model across modules.
- Unified storage and active dataset behavior.
- Shared side panel conventions and toolbar patterns.

### Should have

- Cross-module presets and import/export of configuration.
- Better shell-level status and validation messaging.

### Nice to have

- Module templates and guided analysis flows.
- Internal migration helpers for adding future modules faster.
