---
name: v2-migration-orchestrator
description: Use this skill when planning or executing phased parity work between survey-suite v1 and survey-suite-v2 across processor, likert, distribution, export, storage, and shared UX.
---

# V2 Migration Orchestrator

## Overview

Use this skill when the task is about closing the gap between `apps/survey-suite/` and `apps/survey-suite-v2/`.
It provides the migration order, the decision rules, and the shared parity criteria for every module.

## When To Use

Use this skill when:

- The request mentions "paridad", "migracion", "v1 vs v2", "roadmap", or "fase".
- The work touches more than one module in `apps/survey-suite-v2/src/features/`.
- A module needs to copy behavior from `apps/data-processor`, `apps/likert-charts`, or `apps/distribution-lab`.
- You need to decide whether something is `Must have`, `Should have`, or `Nice to have`.

## Workflow

### 1. Confirm the parity target

Identify the v1 source of truth first:

- Processor: `apps/data-processor/`
- Likert: `apps/likert-charts/`
- Distribution: `apps/distribution-lab/`

Then identify the v2 target area:

- `apps/survey-suite-v2/src/features/processor/`
- `apps/survey-suite-v2/src/features/likert/`
- `apps/survey-suite-v2/src/features/distribution/`

### 2. Port behavior before polish

Prefer this order:

1. Missing controls and interactions
2. Rendering parity
3. Export and persistence
4. Layout polish

Do not start with visual cleanup if the v2 module still lacks core controls or actions already available in v1.

### 3. Keep v2 architecture intact

When porting features from v1:

- Reuse the v1 behavior, not the v1 file structure.
- Preserve the typed store, event flow, and shared config patterns already present in v2.
- Extract shared utilities when at least two modules need the same capability.

### 4. Validate after each slice

For every migration slice:

- Verify the panel control exists and updates state.
- Verify the chart or processor output actually changes.
- Verify dataset persistence or export still works when relevant.
- Verify no module-specific fix breaks the integrated shell in v2.

## Phase Order

Follow this sequence unless the user explicitly reprioritizes:

1. Distribution parity baseline
2. Processor parity baseline
3. Likert parity completion
4. Shared export, presets, storage, and cross-module UX

## Prioritization Rules

### Must have

Anything that blocks normal use of the module or creates obvious feature regression against v1.

### Should have

Anything that materially improves analysis flow, readability, or export quality, but has a workaround.

### Nice to have

Enhancements, automation, or polish that are valuable after parity is stable.

## Working Notes

- Read `references/roadmap.md` before starting a migration task.
- Read `references/operational-plan.md` when the goal is execution by iteration.
- Then open the module-specific skill and its backlog.
- If a user asks for a roadmap only, update the roadmap and backlogs before coding.
- If a user asks for implementation, use the roadmap only to choose the next highest-value slice and then implement it directly.
