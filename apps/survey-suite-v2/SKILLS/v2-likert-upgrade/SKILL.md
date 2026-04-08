---
name: v2-likert-upgrade
description: Use this skill when upgrading survey-suite-v2 likert charts toward v1 parity in chart modes, style controls, grid behavior, layout, labels, and export workflow.
---

# V2 Likert Upgrade

## Overview

Use this skill when working on the likert module in `apps/survey-suite-v2/`.
It focuses on closing the gap with `apps/likert-charts/` while keeping the v2 configuration model coherent.

## When To Use

Use this skill when the task involves:

- `apps/survey-suite-v2/src/features/likert/`
- likert chart modes
- style panels and canvas controls
- labels, legends, grid, axes, or typography
- export behavior for likert visualizations

## Working Workflow

### 1. Check v1 parity first

Use `apps/likert-charts/` as the reference for:

- chart types
- panel controls
- canvas behavior
- export expectations

### 2. Avoid placeholder UX

If a control says "proximo", "coming soon", or behaves as a no-op:

- implement it, or
- hide it until it is real

Do not leave partial controls in visible production paths.

### 3. Keep controls consistent

Match the mental model users already know from v1:

- color and typography together
- bars, legend, axes, and canvas grouped clearly
- immediate visual response after control changes

### 4. Validate on dense datasets

Likert regressions often only appear on real-world labels and many items.
Always verify:

- grid visibility
- label clipping or overlap
- legend legibility
- export readability

## Parity Rules

- Functional chart mode parity beats style polish.
- Dense-label readability beats decorative spacing tweaks.
- Export parity matters because likert is often a final-output module.

## Backlog Reference

Use `references/backlog.md` as the current implementation backlog.
