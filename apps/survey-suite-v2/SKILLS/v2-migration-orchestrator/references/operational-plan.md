# Survey Suite V2 Operational Plan

## How To Use This File

Use this plan to choose the next implementation slice in `survey-suite-v2`.
Each slice is designed to be small enough to complete, verify, and ship without mixing too many concerns.

## Phase 1: Distribution Baseline

### 1.1 Toolbar parity

Goal:
Add the basic chart actions users expect immediately.

Primary files:

- `apps/survey-suite-v2/src/features/distribution/view.ts`
- `apps/survey-suite-v2/src/main.ts`

Deliverables:

- Zoom in
- Zoom out
- Reset zoom
- Fullscreen
- Toolbar export button wired to the same export action
- Visible zoom state in the panel or chart header

Done when:

- The toolbar responds in the distribution view.
- The canvas scales without breaking the layout.

### 1.2 Label containment and layout controls

Goal:
Stop long labels from breaking the chart.

Primary files:

- `apps/survey-suite-v2/src/features/distribution/view.ts`
- `apps/survey-suite-v2/src/features/distribution/chart.ts`

Deliverables:

- Label wrap or truncation strategy selected and implemented
- `label max lines` control
- More realistic left or bottom margin handling
- Row spacing adjusted to label height

Done when:

- Long labels stay readable on normal desktop width.
- The chart does not overflow or overlap visibly.

### 1.3 Shared canvas controls

Goal:
Give distribution the same basic chart ergonomics already seen in likert.

Primary files:

- `apps/survey-suite-v2/src/features/distribution/view.ts`
- `apps/survey-suite-v2/src/main.ts`

Deliverables:

- Margin controls
- Chart width or min-height controls
- Grid or axis toggles if the renderer supports them
- Better export entry points from both panel and toolbar

Done when:

- Distribution has a coherent style or canvas area instead of only a minimal panel.

### 1.4 Chart type expansion

Goal:
Reduce the biggest functional gap against v1.

Primary files:

- `apps/survey-suite-v2/src/features/distribution/chart.ts`
- `apps/survey-suite-v2/src/features/distribution/`

Deliverables:

- Violin
- Box plus violin
- Raincloud
- Error bar

Done when:

- The visible selector matches actual supported renderers.

## Phase 2: Processor Baseline

### 2.1 Import parity

Goal:
Match the practical import flow of v1.

Primary files:

- `apps/survey-suite-v2/src/features/processor/view.ts`
- `apps/survey-suite-v2/src/main.ts`
- `apps/survey-suite-v2/src/features/processor/parser.ts`

Deliverables:

- Better file support based on real v1 usage
- Clear accepted-format guidance
- Better import status and failure messages
- Cleaner import panel grouping

Done when:

- A user can import the common dataset formats without guessing the flow.

### 2.2 Dataset inspection

Goal:
Make imported data easier to trust before analysis.

Primary files:

- `apps/survey-suite-v2/src/features/processor/view.ts`
- `apps/survey-suite-v2/src/main.ts`

Deliverables:

- Column list or schema summary
- Better record and column counts
- Preview enhancements beyond raw rows only

Done when:

- The processor communicates shape and health of the dataset clearly.

### 2.3 Storage parity

Goal:
Match the stronger storage ergonomics already present in v1.

Primary files:

- `apps/survey-suite-v2/src/features/processor/view.ts`
- `apps/survey-suite-v2/src/main.ts`

Deliverables:

- Stronger storage list UX
- Better active dataset indication
- More predictable save or activate behavior
- Safer delete flow if needed

Done when:

- Users can save, activate, and manage datasets confidently from processor.

## Phase 3: Likert Completion

### 3.1 Remove placeholder UX

Goal:
Stop exposing modes that are not implemented.

Primary files:

- `apps/survey-suite-v2/src/features/likert/view.ts`
- `apps/survey-suite-v2/src/main.ts`

Deliverables:

- Hide unsupported chart modes, or implement them
- Make selectors reflect real capabilities only

Done when:

- No visible chart option behaves like a dead end.

### 3.2 Dense-chart readability pass

Goal:
Improve real-world readability for long item sets.

Primary files:

- `apps/survey-suite-v2/src/features/likert/view.ts`
- `apps/survey-suite-v2/src/features/likert/chart.ts`

Deliverables:

- Better label wrapping
- Better default margins
- Reliable grid and frame layering
- Better legend placement on crowded charts

Done when:

- Dense likert charts remain legible without manual rescue.

### 3.3 Export parity pass

Goal:
Make likert output ready for reporting.

Primary files:

- `apps/survey-suite-v2/src/features/likert/view.ts`
- `apps/survey-suite-v2/src/main.ts`
- `apps/survey-suite-v2/src/features/likert/chart.ts`

Deliverables:

- Export format selector actually respected
- Better scale handling
- Shared export behavior aligned with distribution where possible

Done when:

- Export format and on-screen behavior feel coherent.

## Phase 4: Shared UX and Cross-Module Infrastructure

### 4.1 Shared chart toolbar

Goal:
Reduce duplication and make modules feel like one suite.

Primary files:

- `apps/survey-suite-v2/src/features/likert/`
- `apps/survey-suite-v2/src/features/distribution/`
- `apps/survey-suite-v2/src/shared/`

Deliverables:

- Common toolbar actions and conventions
- Shared zoom and fullscreen logic where practical
- Shared export trigger pattern

### 4.2 Shared presets and config polish

Goal:
Stabilize the suite after parity basics are in place.

Primary files:

- `apps/survey-suite-v2/src/shared/`
- `apps/survey-suite-v2/src/main.ts`

Deliverables:

- Shared presets
- Reset defaults by module
- Cleaner config boundaries

### 4.3 Release hardening

Goal:
Close the gap between "works locally" and "feels complete".

Primary files:

- `apps/survey-suite-v2/src/`

Deliverables:

- Regression pass on processor, likert, and distribution
- Sanity checks for dataset switching
- Export sanity checks
- UI cleanup for panel spacing and labels

## Recommended Next Slice

Start with `Phase 1.1` and `Phase 1.2` in distribution.
That is still the highest-value gap relative to the current v1 experience.
