---
name: v2-processor-upgrade
description: Use this skill when adding or refining processor features in survey-suite-v2 to match v1 data-processor capabilities, storage flows, file support, and dataset ergonomics.
---

# V2 Processor Upgrade

## Overview

Use this skill when working on the processor module in `apps/survey-suite-v2/`.
It defines the migration path from `apps/data-processor/` and keeps processor work scoped to parity-first outcomes.

## When To Use

Use this skill when the task touches:

- `apps/survey-suite-v2/src/features/processor/`
- dataset import or parsing
- dataset storage and activation
- column metadata, schema preview, or normalization
- processor panel UX and feedback states

## Working Workflow

### 1. Start from the v1 behavior

Check how the same flow works in:

- `apps/data-processor/index.html`
- `apps/data-processor/app.js`

Treat v1 behavior as the baseline unless the user asks to intentionally redesign it.

### 2. Map the v2 touchpoints

Before editing, identify:

- view layer
- state/config
- import/transform helpers
- storage hooks

### 3. Implement vertical slices

Prefer slices that include:

1. control or action
2. state update
3. visible feedback
4. verification

Avoid adding controls that do nothing yet.

### 4. Verify the whole processor flow

After each slice, check:

- file load
- parsed dataset availability
- storage save/list/activate behavior
- error and empty-state messaging

## Parity Rules

- File support beats cosmetic polish.
- Storage clarity beats secondary layout cleanup.
- Column understanding beats decorative UI.
- If v1 already solves a workflow cleanly, reuse that interaction model.

## Backlog Reference

Read `references/backlog.md` before implementation and keep work aligned with the current highest-priority open item.
