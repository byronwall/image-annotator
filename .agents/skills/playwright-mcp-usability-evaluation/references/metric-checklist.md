# Usability Metric Checklist

Sample from this checklist during evaluations. Do not force every metric into every report; prioritize metrics relevant to the task, flow type, device, and observed friction.

## Task Completion

- Task success: full, partial, failure, blocked, unsafe to continue.
- Completion correctness: correct entity, fields, settings, user, permissions, or state.
- Success confidence: high with explicit confirmation, medium with weak confirmation, low with ambiguity.
- First-attempt success.
- Critical path completion.
- Task abandonment risk.

## Time And Efficiency

- Total time on task.
- Time to first meaningful action.
- Time to locate primary action.
- Time per step, screen, form, modal, or page.
- Time waiting for UI response.
- Time spent scanning, reading, comparing, deciding, correcting, or recovering.
- Time after submit until confirmation.
- Time lost to animation, slow network, spinners, or late content.

## Clicks, Pointer, And Target Acquisition

- Total clicks, useful clicks, unnecessary clicks, dead clicks, misclicks, repeated clicks.
- Clicks on disabled, wrong, hidden, tiny, edge-adjacent, or unrelated controls.
- Clicks to reveal hidden controls, dismiss overlays, or close interruptions.
- Clicks required before first progress and after perceived completion.
- Average clicks per successful step.
- Click depth to primary action and maximum click depth.
- Pointer travel, backtracking, zigzag, overshoot, and large-distance target acquisition.
- Distance between label/control, cause/effect, error/field, summary/action.
- Fitts's Law risks: small targets, precise positioning, poor proximity.

## Scrolling

- Total scroll count and distance.
- Vertical depth and horizontal scroll.
- Scroll reversals.
- Scrolls before finding target.
- Nested container scrolling.
- Hidden below-fold primary actions.
- Sticky header/footer usefulness.
- Loss of context, scroll-jacking, infinite scroll friction, pagination friction.
- Scroll-to-error behavior and position preservation after navigation.

## Keyboard And Text Entry

- Total keystrokes, characters typed, backspaces, corrections.
- Tab and shift-tab presses.
- Keyboard-only task completion.
- Keyboard traps, unexpected focus loss, caret jumps, selection jumps, field resets, remounts on each character, or dropped characters.
- Shortcut discoverability/usefulness.
- Auto-focus, autocomplete, auto-formatting, input masks, copy/paste need.
- Typing latency, debounce behavior that fights input, validation that interrupts entry, and input state preserved after errors or navigation.
- Duplicate data entry.
- Unclear expected input formats.

## Navigation And Information Architecture

- Page transitions, route changes, modal transitions, tab/window switches.
- Breadcrumb, back button, search, filter, sort, and menu usage.
- Screens visited and irrelevant screens visited.
- Menus opened, nested menu levels, settings sections inspected.
- Dead ends, reversals, lost-location events, unexpected route changes.
- URL shareability, state preservation, context preservation after save/cancel.
- Expected location match, label scent, category fit, terminology consistency.
- Object-action ordering, action grouping, disclosure predictability, help/status findability.

## Visual Search And Scan Burden

- Primary action visibility, prominence, location predictability, and CTA label clarity.
- Competing CTA count.
- Visual hierarchy, grouping, whitespace, clutter density.
- Similar-looking controls and ambiguous icons.
- Icon-label pairing.
- Color-coding clarity.
- Affordance clarity for buttons, links, inputs, selected state, disabled state, hover/focus/loading/error/success state.
- Elements, text blocks, menu items, rows, cards, fields, icons, tabs, and filters scanned before action.
- Repeated scanning, distant comparison, memory burden, hidden-state inference.
- Jargon, dense paragraphs, tooltip dependence, help/docs dependence, browser find use.

## Space Usage And Workspace Fit

- Visible area devoted to the active task versus headers, navigation, sidebars, banners, helper panels, toolbars, empty gutters, decorative regions, and persistent controls.
- Large static page elements that are useful once but remain prominent: hero headers, onboarding copy, instructional blocks, examples, empty-state text, product tours, setup banners, confirmation panels, and welcome cards.
- Giant copy, headings, summaries, cards, or status regions that push the real work below the fold or force a cramped workspace.
- Side chrome value: whether nav rails, inspectors, filters, legends, palettes, chat/help panels, preview panes, tables of contents, and property panels are actively useful for the current task.
- Main workspace size, shape, and stability for the task type: form entry, table scanning, chart inspection, visual editing, document review, comparison, file management, or configuration.
- Whether completed steps, low-frequency controls, helper text, and secondary context can collapse, hide, become a compact summary, or move into a drawer/popover/details disclosure.
- Whether the layout supports focus modes, resizable panes, collapsible sidebars, sticky local toolbars, or task-specific workspaces when sustained work area matters.
- Whether rearranging content would reduce scroll, scanning, pointer travel, or memory burden: move primary actions closer to the work, put secondary info after the work, keep controls near the affected object, and reserve persistent space for persistent value.
- Responsive workspace fit: whether mobile/tablet layouts preserve enough working area after headers, browser chrome, sticky bars, virtual keyboards, and panels are present.

## General-Purpose Fit

- Whether the solution can repeat the same workflow with a different dataset, measure, dimension, filter, chart type, encoding, label set, or style preset.
- Data flexibility: import/switch data, map fields, handle renamed fields, stable internal ids separate from display labels, and visible validation when input data does not match expectations.
- Chart/model flexibility: configurable measures, categories, time grains, aggregations, filters, encodings, scales, legends, labels, colors, annotations, and chart or layer presets.
- Robustness across ordinary variation: missing values, empty states, long labels, many/few categories, different row counts, mixed types, alternate measures, and multiple charts created from the same pattern.
- Reuse affordances: templates, saved specs, duplication, presets, reusable style tokens, share/export paths, reset/versioning, and repeatable setup.
- One-off warning signs: fixed demo data, fixed metric/category/chart type, controls or copy tied to one dataset, uneditable axes/legends/colors, brittle assumptions about row counts or categories, static examples that do not update the model, and no path to create a second chart.

## Forms

- Number of fields, required/optional fields, unclear requiredness.
- Field order, grouping, label clarity, placeholder dependence.
- Help text, defaults, autofill/autocomplete.
- Dropdown clarity/count, searchable select availability.
- Radio/checkbox clarity, date/time picker usability, file upload clarity.
- Validation timing, message clarity/location, recovery cost, error prevention.
- Error summary, field-level success feedback, save/cancel/reset behavior.
- Unsaved changes warning, multi-step progress, review/confirmation step.
- Input constraints explained before error.
- Submission confidence and post-submit confirmation clarity.

## Content And Microcopy

- Button/link label specificity.
- Heading/page title clarity.
- Empty, error, success, warning, confirmation, tooltip, and inline help usefulness.
- Jargon density and domain-term ambiguity.
- Verb/noun consistency.
- Instruction brevity and completeness.
- Privacy, billing, legal, destructive-action, undo/recovery copy clarity.
- Human-readable formatting for dates, times, numbers, currency, pluralization.
- Truncation, abbreviation, localization, and internationalization risks.

## Feedback And System Status

- Immediate click feedback.
- Button/page loading state.
- Skeleton/spinner usefulness and duration.
- Optimistic update clarity.
- Delayed result explanation.
- Toast visibility, duration, and content usefulness.
- Inline/persistent confirmation.
- Save/autosave state clarity.
- Network failure state and retry affordance.
- Progress indicators, steppers, selected item visibility.
- Current location, applied filters, result counts, empty result explanation.
- Permission denied, session timeout, background job, and long-running action status.
- Notification overload and animation usefulness/delay.

## Interaction Quality And Jank

- Layout overflow, horizontal scrolling, clipped content, hidden controls, and content escaping containers.
- Text, icons, buttons, popovers, tooltips, dialogs, tables, charts, and sticky regions overlapping each other.
- Modals, drawers, menus, dropdowns, and panels that exceed the viewport, trap scrolling unexpectedly, or cannot be dismissed naturally.
- Layout shift before, during, or after a click, including controls moving under the pointer.
- Focus loss while typing, focus not returning after overlay close, unexpected autofocus, tab order jumps, and keyboard focus landing on hidden/offscreen elements.
- Input jank: dropped characters, duplicated characters, caret jumps, field resets, selection loss, masked input surprises, slow keystroke response, and debounced search/filter updates that interrupt typing.
- Dead clicks, repeated clicks required, delayed pressed/loading states, hover-only affordances, unexpected popover/menu closure, and unclear disabled/loading states.
- Scroll jank: position loss after updates, body/panel scroll conflicts, nested scroll traps, scroll-to-error failures, sticky headers covering anchors, and mobile keyboard overlap.
- Visual instability: flicker, jumpy transitions, late content insertion, skeleton/spinner layout mismatch, animation that delays control, and state changes too subtle to perceive.
- Recovery burden: whether a normal user can recover without retyping data, resizing the window, using browser find, opening dev tools, or guessing hidden state.

## Error, Recovery, And Safety

- Error count, critical errors, recoverable/unrecoverable errors.
- Validation, system, user-caused, and UI-induced errors.
- Error prevention, specificity, actionability, and location clarity.
- Recovery steps, data preservation, undo/redo/cancel/back safety.
- Confirmation for destructive actions and separation from safe actions.
- Accidental submission, deletion, permission change, purchase, or irreversible-action risk.
- Recovery from wrong navigation, wrong form value, modal close, timeout, upload failure, duplicate submission.
- Draft preservation, autosave reliability, conflict resolution.

## Accessibility

- Logical tab order and visible focus.
- Modal focus trapping and focus return.
- Escape, enter, and space behavior.
- Keyboard access to menus and custom widgets.
- Skip links and focus after route changes.
- Accessible names for buttons, links, icons, and controls.
- Programmatic form labels.
- Error messages associated with fields.
- Logical headings and landmarks.
- Table headers, image alt text, status/live regions.
- Required, disabled, selected, expanded/collapsed states announced.
- Duplicate accessible names causing ambiguity.
- Text and non-text contrast, touch/click target size, target spacing.
- Text resizing, zoom, responsive layout, no color-only meaning, reduced motion support.

## Mobile And Responsive

- Viewport fit and horizontal scrolling.
- Thumb reach, tap target size, tap target spacing.
- Sticky controls and bottom-sheet usability.
- Virtual keyboard overlap and field visibility while typing.
- Collapsed navigation, mobile filter/sort, mobile table/card usability.
- Modal fit, viewport height issues, orientation support.
- Gesture discoverability and accidental gesture risk.
- Safe area handling, content reflow, truncated labels, hidden primary action.
- Controls hidden by virtual keyboard, sticky bars, browser chrome, safe areas, or fixed-position overlays.

## Performance-Adjacent UX

- Initial page usable time.
- Primary action visible/clickable time.
- Interaction, input, route, modal, dropdown, search, filter, save, and upload latency.
- Layout shift causing misclicks.
- Late-loading content.
- Perceived speed versus communicated wait.
- Slow action cancellation, retry, offline or poor-network behavior.
- Interaction delay, input delay, render thrash, flicker, repeated remounting, and state updates that interrupt active user input.

## Trust, Confidence, And Decision Quality

- Confidence before and after action.
- Decision, tradeoff, pricing, permission, privacy, security, data sharing, ownership, role/access, billing, trial, cancellation clarity.
- Confirmation before irreversible action.
- Review before submission.
- Receipt/proof after completion.
- Audit trail and support/contact availability.
- Policy link placement.
- Dark pattern risks: forced continuity, hidden cost, confirmshaming, obstruction, misdirection.

## Heuristic Review

- Visibility of system status.
- Match between system and real-world language.
- User control and freedom.
- Consistency and standards.
- Error prevention.
- Recognition rather than recall.
- Flexibility and efficiency.
- Aesthetic and minimalist design.
- Help users recognize, diagnose, and recover from errors.
- Help and documentation.
- Affordance clarity, information scent, progressive disclosure.
- Mapping between controls and outcomes.
- Proximity, grouping, chunking.
- Fitts's Law and Hick's Law friendliness.
- Cognitive load minimization.
- Spatial economy and task-appropriate workspace size.
- Platform convention consistency.
