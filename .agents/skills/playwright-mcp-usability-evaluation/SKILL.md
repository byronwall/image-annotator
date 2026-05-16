---
name: playwright-mcp-usability-evaluation
description: Evaluate product UI usability by completing a defined task through Playwright MCP or the Browser plugin, collecting behavioral evidence, scoring effectiveness, efficiency, cognitive load, accessibility, confidence, visual design, workspace fit, interaction jank, and general-purpose fit, and producing a prioritized UX improvement backlog. Use when Codex is asked to audit, review, score, compare, or improve a web UI based on a realistic task walkthrough.
---

# Playwright MCP Usability Evaluation

## Goal

Evaluate whether a specified user can complete a specified product task in a specified context. Treat the run as an observed usability session: interact through the UI, collect behavioral evidence, score the experience, and turn findings into concrete product/design/engineering recommendations.

Ground the evaluation in classic usability framing:

- Effectiveness: whether the user can complete the right task.
- Efficiency: effort, time, steps, clicks, scrolling, and recovery cost.
- Satisfaction/confidence: whether the UI feels clear, trustworthy, and predictable.
- Interaction quality: whether the UI behaves like a stable, polished product under ordinary user input, including focus retention, typing reliability, layout stability, overflow handling, and responsive feedback.
- Workspace fit: whether the current task gets enough usable space, with headers, copy, navigation, side panels, helper chrome, and persistent controls proportionate to their current value.
- General-purpose fit: whether the proposed solution can support reusable workflows across realistic data, chart, or task variations instead of only producing one hard-coded result.

Treat visible jank as product evidence even when automation can still complete the task. Do not let Playwright precision, fast typing, selector targeting, or internal knowledge hide problems a real user would hit.

## Required Inputs

Collect or infer these before acting:

- Product URL or local target.
- Task goal.
- Persona. If missing, assume a reasonably competent first-time user.
- Success criteria. If missing, infer visible proof of completion and disclose the assumption.
- Constraints: viewport/device, auth state, test account, allowed data changes, forbidden areas, time/step budget.
- Risk level:
  - Low: harmless navigation or read-only review.
  - Medium: creates or edits test data.
  - High: payment, deletion, production data, privacy, legal, security, account, or irreversible change.

Ask a short clarifying question only if URL/task are missing or if continuing could perform a high-risk action without explicit authorization.

## Safety Rules

- Use Playwright MCP or the Browser plugin to interact with the actual UI.
- Behave like a realistic user, not a test script.
- Prefer visible controls and ordinary navigation over direct DOM manipulation, guessed URLs, or internal APIs.
- Do not inspect source code, call internal APIs, or bypass UI flows unless the user explicitly authorizes that mode.
- Do not compensate for UX defects with automation-only behavior. Avoid selector-only interaction with hidden/offscreen controls, unnatural input speed, direct value setting, forced focus, scripted DOM events, or viewport changes that mask overflow unless explicitly testing a recovery path.
- If a human would have to stop, reread, resize, scroll awkwardly, re-click, retype, recover focus, or guess what happened, log that friction instead of silently working around it.
- Stop before harmful, destructive, irreversible, financial, privacy-invasive, or production-impacting actions unless explicitly authorized.
- If blocked by auth, permission, missing data, or unsafe continuation, report the block with evidence rather than inventing results.

## Artifact Location

- Save generated reports, run logs, screenshots, traces, and image evidence under repo-root `tmp/evals/`.
- Prefer `tmp/evals/<run-slug>.md` for the final report and `tmp/evals/assets/<run-slug>/` for screenshots referenced from that report.
- Do not place generated evaluation artifacts under `docs/` or `docs/assets/` unless the user explicitly asks for commit-ready documentation.
- Keep reusable test plans and checklists in `docs/` when they are meant to be source guidance rather than run output.

## Core Workflow

### 1. Establish Baseline

1. Set the requested viewport, or default to desktop unless the user asks for mobile.
2. Navigate to the start URL.
3. Capture an initial screenshot under `tmp/evals/` and an accessibility snapshot when available.
4. Identify:
   - apparent primary action
   - likely navigation paths
   - predicted shortest successful path
   - expected success state
   - assumptions and risk boundaries

Use `references/run-log-template.md` to structure the evidence ledger.

### 2. Attempt The Task Naturally

Proceed through the interface as the persona would:

- click, type, hover, scroll, select, drag, upload, open menus, and navigate as needed
- use human-plausible pacing for typing/clicking when interaction quality matters; observe intermediate states rather than only the final DOM value
- record each meaningful action, target, expected result, actual result, friction, and screenshot reference
- capture screenshots at key moments: initial state, before major decisions, page transitions, error states, confusing regions, and final state
- count objective metrics as you go: clicks, useful/dead/unnecessary clicks, scrolls, page transitions, screens visited, backtracks, form fields, corrections, waits, and keyboard interactions
- approximate pointer effort from action target coordinates when available; use qualitative notes when exact distance is impractical

Flag friction immediately when the next action is unclear, labels are ambiguous, controls are hidden, feedback is weak, scrolling/backtracking is excessive, a click has no visible response, errors appear, or success is uncertain.

### 2a. Probe Interaction Quality And Jank

While staying within the task path, deliberately notice issues that a real user cannot ignore:

- layout overflow: horizontal scrolling, clipped text, controls outside the viewport, sticky headers/footers covering content, modal/popup overflow, nested scroll traps, content hidden behind panels, and responsive breakage
- focus and keyboard stability: focus loss while typing, caret jumps, dropped characters, field resets, remounts on each character, unexpected selection changes, tab order jumps, Escape/Enter surprises, and focus not returning after dialogs or menus
- input behavior: slow keystroke response, debounced search that fights typing, masks/autocomplete that rewrite unexpectedly, copy/paste failures, duplicate submissions, disabled controls accepting focus, and validation that interrupts normal entry
- pointer and state feedback: dead clicks, delayed or missing pressed/loading states, controls moving under the pointer, layout shift during click/submit, hover-only affordances, tiny or overlapping targets, and popovers/menus closing unexpectedly
- scrolling and viewport behavior: scroll position loss after updates, scroll-to-error failures, body and panel scroll conflicts, mobile keyboard overlap, full-height panels that cannot be dismissed, and content that can only be reached by awkward scrolling
- visual polish defects that affect use: overlapping text, truncation without recovery, unreadable density, inconsistent spacing/alignment, flicker, jumpy transitions, distracting animation, and state changes that are hard to perceive

When a jank issue appears, record the exact trigger, whether it repeats, how a normal user would recover, whether data is preserved, and whether the issue merely annoys, slows, causes mistakes, or blocks completion.

### 2b. Evaluate Space Usage And Workspace Fit

Assess whether the screen is arranged around the user's current job, not around static page furniture:

- estimate how much visible space is available for the active task versus headers, nav rails, sidebars, banners, helper panels, empty gutters, decorative regions, persistent copy, and tool chrome
- flag large static elements that are only useful once, such as hero headers, onboarding text, explanatory copy blocks, example panels, setup banners, product tours, empty-state copy, or confirmation blocks that remain after they have served their purpose
- flag side chrome that competes with the task, such as permanently expanded navigation, inspectors, filters, legends, palettes, chat/help panels, tables of contents, or preview panes that shrink the main work area without clear current value
- note when oversized headings, dense instructions, cards, toolbars, or status panels push the real work below the fold, force cramped editing, or create needless scrolling while the user is trying to complete the task
- compare the workspace fit to the task: reading, form entry, visual editing, table scanning, chart inspection, comparison, document review, file management, and configuration flows need different amounts and shapes of working area
- evaluate whether completed or low-frequency UI can collapse, become a compact summary, move to a drawer/popover, live behind a details disclosure, or disappear after use while preserving a clear way to recover it

When space usage harms the task, recommend concrete rearrangements: shorten or collapse headers after the first action, replace persistent instructions with contextual help, move secondary chrome to drawers or tabs, make side panels resizable/collapsible, use split panes only when both panes are actively needed, pin primary actions near the work area, convert one-time copy to dismissible onboarding, and provide focused/full-screen modes for workspace-heavy tasks.

### 2c. Evaluate General-Purpose Solution Fit

Assess whether the UI is a reusable product capability or a one-off demo. Calibrate this to the stated product/task scope: a deliberately narrow workflow can be good, but a chart builder, analysis workspace, or authoring tool should generalize beyond a single canned chart.

- reward configurable foundations: dataset import/switching, field mapping, selectable dimensions/measures, filters, grouping, aggregation, chart or layer presets, editable encodings/scales/labels/colors, saved templates/specs, stable internal ids separate from display labels, and reproducible export/share paths
- reward robustness across ordinary variation: different row counts, missing values, long labels, multiple categories, alternate measures, time granularities, empty states, renamed fields, and more than one chart created from the same pattern
- penalize one-off behavior: fixed demo data, fixed metric/category/chart type, copy or controls tied to one dataset, uneditable axes/legends/colors, static examples that do not update the underlying model, brittle row-count/category assumptions, and no visible path to repeat the workflow with new data
- when safe and in scope, probe one variation beyond the happy path: change a metric/category, apply a filter, switch chart type or encoding, rename a field, load/sample another dataset, or create a second chart from the same setup
- if the UI cannot support a reasonable variation, record that as evidence rather than guessing future extensibility

When general-purpose fit is weak, recommend concrete abstractions: schema/field mapping, reusable chart specs or layer models, preset libraries, tokenized style controls, validation across representative datasets, templates that can be edited, and compact defaults that reveal extensibility without overwhelming the first run.

### 3. Include An Accessibility Pass

At minimum, evaluate:

- keyboard path feasibility for the task
- visible focus indicators and logical focus order
- accessible names for key buttons, links, inputs, and icons
- form label association and error message association
- headings, landmarks, modal semantics, selected/expanded/disabled states
- target size, spacing, contrast risk, color-only meaning, responsive stability

Use accessibility snapshots where available, but do not substitute snapshots for user-path evidence.

### 4. Complete, Fail, Or Stop

End when one condition is met:

- task is completed and verified against success criteria
- task is partially completed but final success cannot be verified
- task is blocked by auth, permissions, broken UI, missing data, or unsafe continuation
- task is impossible within the requested constraints
- time or step budget is reached

Record outcome as `Full success`, `Partial success`, `Failure`, `Blocked`, or `Unsafe to continue`.

### 5. Score The Experience

Use `references/scoring-and-reporting.md` for formulas and report shape.

Score:

- completion
- efficiency
- cognitive load
- error/recovery
- interaction quality/jank
- accessibility
- confidence/trust
- visual design/workspace fit
- general-purpose fit
- overall goodness
- overall badness
- badness by category

Keep scores defensible: tie penalties to observed evidence and disclose when a score is a heuristic estimate.

### 6. Generate The Backlog

Produce concrete fixes, not generic UX advice. Tie major recommendations to observed evidence.

Include:

- critical fixes for blockers, unsafe states, missing confirmation, broken navigation, and task-preventing accessibility issues
- high-priority fixes that reduce steps, scanning, ambiguity, errors, and weak feedback
- medium-priority fixes for workspace fit, layout hierarchy, grouping, defaults, empty states, tooltips, filtering, and progressive disclosure
- low-priority polish for spacing, icon consistency, animation, secondary states, and microcopy
- quick wins, larger redesign ideas, product experiments, and instrumentation recommendations

When enough issues exist, generate at least 30 prioritized recommendations.

## Minimum Evidence To Finalize

Do not finalize until you have:

- attempted the task through the UI
- captured screenshots at important points
- logged meaningful interactions
- verified success/failure/blocker state
- counted objective metrics where possible
- considered accessibility
- evaluated workspace fit and whether static chrome/copy is proportionate to the active task
- evaluated whether the solution is reusable across realistic task, data, or chart variations instead of only fitting one canned output
- computed scores with rationale
- prioritized recommendations
- disclosed limitations

## References

- `references/run-log-template.md`: evidence ledger for actions, timing, navigation, errors, and screenshots.
- `references/metric-checklist.md`: expanded metric categories to sample from during audits.
- `references/scoring-and-reporting.md`: formulas, severity rating, issue template, and final report format.
