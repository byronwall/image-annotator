# Usability Run Log Template

Use this as a working ledger while running a Playwright MCP usability evaluation. Keep it factual and evidence-oriented.

## Evaluation Setup

- Report path: `tmp/evals/<run-slug>.md`
- Screenshot directory: `tmp/evals/assets/<run-slug>/`
- Product URL:
- Task:
- Persona:
- Success criteria:
- Viewport/device:
- Auth/data assumptions:
- Risk level:
- Time/step budget:
- Areas/actions to avoid:

## Baseline

- Initial screenshot: `tmp/evals/...`
- Initial URL:
- Apparent primary action:
- Likely navigation paths:
- Predicted shortest path:
  1. 
  2. 
  3. 
- Expected success state:
- Assumptions:

## Interaction Log

For each meaningful action:

```text
step:
timestamp_or_delta:
action_type:
target:
visible_label_or_accessible_name:
coordinates_if_available:
why_this_action:
expected_result:
actual_result:
helped_progress: yes/no/partial
friction:
metrics_delta:
screenshot_reference:
```

Track action types such as click, type, hover, scroll, select, drag, upload, menu open, modal open, route transition, back/forward, keyboard navigation, and wait.

## Navigation Log

```text
event:
from:
to:
trigger:
route_or_url_change:
modal_dialog_or_tab_change:
breadcrumb_or_location_change:
state_preserved:
notes:
```

## Error And Recovery Log

```text
error_or_friction:
step_reference:
type: misclick / dead click / validation / system / ambiguity / dead end / unsafe
cause:
recovery_attempted:
recovery_steps:
data_preserved:
final_result:
```

## Metrics Counters

Task:

- outcome:
- success confidence:
- first-attempt success:
- correctness:
- abandonment risk:

Efficiency:

- total time:
- time to first meaningful action:
- time to locate primary action:
- time waiting:
- time scanning/reading/deciding:
- clicks:
- useful clicks:
- unnecessary clicks:
- dead clicks:
- repeated clicks:
- scroll count:
- scroll distance/depth:
- page transitions:
- screens visited:
- irrelevant screens visited:
- backtracks:
- keyboard entries:
- corrections/backspaces:
- pointer travel estimate:

Cognitive load:

- ambiguous decisions:
- hidden controls:
- labels questioned:
- dense regions scanned:
- memory burden:
- jargon issues:
- similar-looking controls:
- help/tooltips opened:

Space usage and workspace fit:

- active workspace area:
- space consumed by headers/nav/side chrome:
- large static one-time elements:
- giant copy/headings/instructions:
- side panels or helper chrome value:
- primary work pushed below fold:
- cramped workspace or unnecessary scrolling:
- elements that could collapse/hide after use:
- rearrangement/progressive disclosure opportunities:
- focused/full-screen workspace need:

Forms, if relevant:

- fields completed:
- required/optional fields:
- unclear requiredness:
- validation errors:
- duplicate data entry:
- defaults/autocomplete helpfulness:
- post-submit confirmation:

Accessibility:

- keyboard-only feasibility:
- tab order issues:
- focus visibility issues:
- accessible name issues:
- form label issues:
- heading/landmark issues:
- target-size/spacing issues:
- contrast/color-only risks:
- responsive/mobile issues:

Interaction quality and jank:

- layout overflow or clipped content:
- overlapping text/controls:
- modal/menu/panel viewport fit:
- focus loss/caret jump/field reset:
- dropped/duplicated characters:
- typing/input latency:
- layout shift or moving targets:
- dead/repeated clicks:
- missing/delayed feedback:
- scroll traps or scroll position loss:
- flicker/jumpy transitions:
- recovery burden/data preserved:

Trust and safety:

- confidence before final action:
- confidence after final action:
- consequence clarity:
- destructive/financial/privacy risk:
- confirmation or receipt quality:

## Screenshot Index

```text
id:
moment:
file_or_tool_reference: tmp/evals/...
why_captured:
notable_observations:
```
