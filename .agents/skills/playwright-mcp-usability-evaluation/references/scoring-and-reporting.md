# Scoring And Reporting Guide

Use this guide after completing the Playwright MCP walkthrough.

Save generated evaluation artifacts under repo-root `tmp/evals/`, which is git-ignored. Prefer `tmp/evals/<run-slug>.md` for the report and `tmp/evals/assets/<run-slug>/` for screenshots or image evidence. Keep image links relative to the report, for example `assets/<run-slug>/<screenshot>.png`.

## Completion Score

```text
100 = full success
70 = partial success with minor missing pieces
40 = partial progress but no final success
10 = blocked early
0 = impossible, broken, or unsafe
```

## Efficiency Score

Start at 100 and subtract observed penalties:

```text
efficiency_score = 100
  - excess_click_penalty
  - excess_scroll_penalty
  - excess_time_penalty
  - backtracking_penalty
  - unnecessary_screen_penalty
  - repeated_action_penalty
  - excessive_pointer_travel_penalty
```

Suggested bands:

- 0: close to expected path or no meaningful issue.
- 5: mildly inefficient.
- 10: noticeable friction.
- 20: heavy burden.
- 30: severe burden, timeout, or extreme waiting.

Backtracking:

- 0: none.
- 5: one minor backtrack.
- 15: multiple backtracks.
- 30: major wrong path.

## Cognitive Load Score

Start at 100 and subtract:

```text
cognitive_load_score = 100
  - visual_scan_penalty
  - ambiguous_label_penalty
  - memory_burden_penalty
  - jargon_penalty
  - choice_overload_penalty
  - hidden_control_penalty
  - instruction_complexity_penalty
```

Interpretation:

- 90-100: very low cognitive load.
- 75-89: reasonable.
- 60-74: noticeable friction.
- 40-59: high cognitive load.
- 0-39: severe comprehension burden.

## Error And Recovery Score

```text
error_recovery_score = 100
  - 10 * minor_errors
  - 20 * major_errors
  - 30 * unrecoverable_errors
  - recovery_cost_penalty
  + undo_bonus
  + clear_error_message_bonus
```

Cap the score between 0 and 100.

## Interaction Quality And Jank Score

Start at 100 and subtract observed penalties:

```text
interaction_quality_score = 100
  - overflow_penalty
  - focus_stability_penalty
  - input_reliability_penalty
  - layout_shift_penalty
  - scroll_jank_penalty
  - feedback_latency_penalty
  - overlap_truncation_penalty
  - recovery_burden_penalty
```

Suggested bands:

- 0: no meaningful interaction jank.
- 5: minor polish issue with little task impact.
- 10: noticeable friction or one repeatable rough edge.
- 20: heavy jank that slows or confuses the task.
- 30: severe issue such as focus loss on typing, unusable overflow, repeated dropped input, controls moving under the pointer, or data loss.

Any repeatable issue that causes data loss, prevents normal typing, blocks reachable content, or requires non-obvious recovery should cap this score at 60 or lower. Any task-blocking jank should cap this score at 40 or lower.

## Accessibility Score

```text
accessibility_score = 100
  - keyboard_penalties
  - semantic_penalties
  - focus_penalties
  - contrast_penalties
  - target_size_penalties
  - screen_reader_penalties
```

Any task-blocking keyboard or screen-reader issue should cap this score at 50 or lower.

## Confidence Score

```text
confidence_score = 100
  - ambiguous_confirmation_penalty
  - weak_status_penalty
  - unclear_consequence_penalty
  - destructive_action_penalty
  - trust_copy_penalty
```

## Visual Design And Workspace Fit Score

Start at 100 and subtract observed penalties:

```text
visual_design_score = 100
  - hierarchy_penalty
  - clutter_density_penalty
  - workspace_fit_penalty
  - static_chrome_penalty
  - oversized_copy_header_penalty
  - side_chrome_penalty
  - progressive_disclosure_penalty
  - responsive_space_penalty
```

Penalize visual design when layout uses too much space for low-current-value elements. Examples include giant headers, repeated explanatory copy, persistent onboarding panels, permanently expanded sidebars, decorative cards, oversized status regions, nonessential previews, or helper chrome that leaves the active workspace too small for the task.

Recommendations should say how to reclaim space, not just "make it smaller." Consider collapsing or shortening headers after first action, converting one-time guidance to dismissible onboarding or contextual help, moving secondary content to drawers/popovers/details sections, making side panels resizable or collapsible, placing primary controls near the working object, preserving a compact summary after a step is complete, and adding focused/full-screen modes for workspace-heavy tasks.

## General-Purpose Fit Score

Start at 100 and subtract observed penalties:

```text
general_purpose_score = 100
  - hardcoded_demo_penalty
  - missing_data_variation_penalty
  - missing_chart_variation_penalty
  - brittle_model_penalty
  - missing_reuse_template_penalty
  - missing_export_reproducibility_penalty
```

Reward solutions that expose a reusable model: data import or switching, field mapping, configurable dimensions/measures, filters, grouping, aggregation, editable encodings/scales/labels/colors, chart or layer presets, reusable templates/specs, stable internal ids separate from display labels, and repeatable export/share paths.

Penalize solutions that appear built only for one result: fixed demo data, fixed metric/category/chart type, copy or control labels tied to one dataset, uneditable axes/legends/colors, brittle row-count/category assumptions, static examples that do not update a real model, and no visible path to create a second chart from the same pattern.

Calibrate this score to product intent. A narrow single-purpose workflow should not be penalized just for being focused, but an authoring, analysis, dashboard, or chart-building tool should lose credit when it cannot handle ordinary variation.

## Overall Scores

```text
overall_goodness =
  0.25 * completion_score
+ 0.15 * efficiency_score
+ 0.12 * cognitive_load_score
+ 0.12 * error_recovery_score
+ 0.10 * interaction_quality_score
+ 0.10 * accessibility_score
+ 0.07 * confidence_score
+ 0.05 * visual_design_score
+ 0.04 * general_purpose_score

overall_badness = 100 - overall_goodness
```

Badness by category:

```text
completion_badness = 100 - completion_score
efficiency_badness = 100 - efficiency_score
cognitive_badness = 100 - cognitive_load_score
error_badness = 100 - error_recovery_score
interaction_badness = 100 - interaction_quality_score
accessibility_badness = 100 - accessibility_score
confidence_badness = 100 - confidence_score
visual_badness = 100 - visual_design_score
general_purpose_badness = 100 - general_purpose_score
```

Goodness interpretation:

- 90-100: excellent.
- 75-89: good with minor friction.
- 60-74: usable but friction-heavy.
- 40-59: poor and error-prone.
- 20-39: very poor; many users may fail or abandon.
- 0-19: critical; blocked, unsafe, inaccessible, or broken.

## Severity Rating

For every issue, rate each factor 1-5 and multiply:

```text
severity = impact * frequency * persistence * affected_user_scope * risk
```

Impact:

- 1: cosmetic.
- 2: minor annoyance.
- 3: slows task.
- 4: causes error or major confusion.
- 5: blocks task or risks harm.

Frequency:

- 1: rare.
- 2: occasional.
- 3: common.
- 4: frequent.
- 5: happens every time.

Persistence:

- 1: one-time.
- 2: easy to recover.
- 3: moderate recovery.
- 4: hard to recover.
- 5: no clear recovery.

Affected user scope:

- 1: edge case.
- 2: small segment.
- 3: meaningful segment.
- 4: most users.
- 5: nearly everyone.

Risk:

- 1: no material risk.
- 2: mild frustration.
- 3: data quality or productivity risk.
- 4: business, privacy, billing, or access risk.
- 5: security, legal, financial, destructive, or safety risk.

Labels:

- 1-50: low.
- 51-150: medium.
- 151-300: high.
- 301-625: critical.

## Final Report Format

Write the final report to `tmp/evals/<run-slug>.md` unless the user explicitly asks for a commit-ready doc elsewhere.

### 1. Executive Summary

Include task attempted, result, overall goodness, overall badness, biggest blockers, and highest-impact fixes.

### 2. Task And Context

Report URL, persona, task goal, success criteria, browser/device context, auth/data assumptions, constraints, and risk level.

### 3. Outcome

```text
Outcome: Full success / Partial success / Failure / Blocked / Unsafe to continue
Success confidence: High / Medium / Low
Final state observed:
Evidence:
```

### 4. Step-By-Step Walkthrough

For each step:

```text
Step:
Action:
Target:
Expected:
Observed:
Friction:
Metric impact:
Screenshot/evidence:
```

### 5. Metrics Summary

Include task, efficiency, cognitive, error/recovery, interaction quality/jank, accessibility, confidence, visual, workspace-fit, and general-purpose-fit metrics. Use measured counts when available and mark estimates clearly.

### 6. Scores

```text
Completion score:
Efficiency score:
Cognitive load score:
Error/recovery score:
Interaction quality/jank score:
Accessibility score:
Confidence score:
Visual design/workspace fit score:
General-purpose fit score:
Overall goodness:
Overall badness:
```

Add the top badness drivers.

### 7. Major Findings

For each finding:

```text
Finding:
Evidence:
Why it matters:
Affected users:
Severity:
Related metrics:
Recommendation:
```

### 8. Recommendation Backlog

Organize by priority:

- Critical: blockers, unsafe/irreversible confusion, task-preventing accessibility, missing confirmation, broken navigation.
- High: reduce unnecessary steps, reclaim task workspace, expose primary actions, improve labels, errors, scan burden, forms, feedback, and one-off flows that block realistic reuse.
- Medium: improve layout hierarchy, grouping, defaults, progressive disclosure, empty states, tooltips, search/filter, collapsible side chrome, templates, presets, field mapping, and reusable configuration.
- Low: polish spacing, icon consistency, animation timing, microcopy, and secondary states.

When enough issues exist, include at least 30 recommendations.

### 9. Quick Wins

Examples: rename buttons, move primary CTA, collapse a used-once header, convert static copy to contextual help, hide completed setup guidance, add inline help, add success toast, add loading state, preserve form state, add error summary, increase target size, label icons, explain disabled controls.

### 10. Bigger Redesign Suggestions

Examples: reorganize navigation, combine steps, split complex forms, add a wizard, add templates, add review step, add command palette, add contextual onboarding, redesign dashboard hierarchy, replace nested menus with task-based entry points, add collapsible/resizable side panels, add a focused workspace mode, move secondary context into progressive disclosure, add reusable chart specs or layer presets, add dataset/field mapping, add autosave/undo.

### 11. Suggested Product Experiments

For each:

```text
Hypothesis:
Experiment:
Primary metric:
Secondary metrics:
Guardrail metrics:
```

### 12. Instrumentation Recommendations

Suggest analytics events such as:

- `task_started`
- `primary_cta_seen`
- `primary_cta_clicked`
- `form_started`
- `field_error_shown`
- `form_submitted`
- `form_submit_failed`
- `task_completed`
- `task_abandoned`
- `modal_opened`
- `modal_closed`
- `backtracked`
- `search_used`
- `filter_used`
- `empty_state_seen`
- `permission_denied_seen`
- `undo_clicked`
- `help_opened`
- `rage_click_detected`
- `dead_click_detected`

For each event include:

```text
event_name:
trigger:
properties:
why_it_matters:
```

### 13. Confidence And Limitations

State access limits, whether the run covered one or multiple tasks, that scores are heuristic estimates unless backed by repeated testing/analytics, whether human validation is recommended, and which findings need analytics, user testing, or specialized accessibility tooling.

## Issue Template

```text
Issue:
Severity:
Category:
Evidence:
Metric impact:
Root cause:
Recommendation:
Expected improvement:
Effort estimate:
Validation method:
```

Effort estimates:

- XS: copy/config only.
- S: minor UI/layout change.
- M: component or flow change.
- L: multi-screen redesign.
- XL: cross-product/system redesign.

Recommendation quality bar:

- Prefer concrete fixes over generic advice.
- Tie major suggestions to observed evidence.
- Include tactical and strategic ideas.
- Include accessibility, copy, layout, flow, error prevention, recovery, confidence, instrumentation, and experiment ideas when relevant.
- Avoid advice like "make it intuitive"; rewrite as a specific UI change.
