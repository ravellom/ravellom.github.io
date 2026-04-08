---
name: v2-distribution-upgrade
description: Use this skill when upgrading survey-suite-v2 distribution charts toward v1 parity in chart types, layout controls, labels, zoom, export, and analysis ergonomics.
---

# V2 Distribution Upgrade

## Overview

Use this skill when working on the distribution module in `apps/survey-suite-v2/`.
It is the main guide for closing the largest parity gap between v1 and v2.

## When To Use

Use this skill when the task touches:

- `apps/survey-suite-v2/src/features/distribution/`
- boxplot, violin, raincloud, error bar, or combined chart modes
- chart toolbar, zoom, fullscreen, export, or canvas behavior
- label wrapping, layout, spacing, or orientation
- stats and analysis UX around the distribution chart

## Working Workflow

### 1. Use v1 as the feature map

Review `apps/distribution-lab/` to identify:

- available chart modes
- panel groups
- toolbar actions
- layout and label controls

### 2. Move in parity slices

Implement in this order:

1. missing controls that users notice immediately
2. missing chart types
3. missing export and fullscreen behavior
4. stats and analysis extras

### 3. Design for dense labels

Distribution charts fail quickly when labels are long.
Every slice should consider:

- wrap lines
- plot margins
- row height
- zoom behavior

### 4. Reuse shared chart patterns when possible

If likert and distribution need the same toolbar or canvas control, prefer a shared helper after the second use case is proven.

## Parity Rules

- Readability beats compactness.
- Chart-type coverage beats secondary polish.
- Toolbar ergonomics are part of core functionality, not optional sugar.

## Backlog Reference

Use `references/backlog.md` as the working backlog for implementation order.
