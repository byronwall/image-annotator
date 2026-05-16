# Data And Forms

Use this reference for dense data grids, table behavior, selection, bulk actions, forms, inspectors, drawers, and panes.

## Data Grids and Tables

Prefer tables when users compare many records across shared attributes.

Include sticky column headers, compact row height, resizable columns when useful, sortable columns with visible active sort, column customization, row selection, bulk action bar, inline status, contextual row menus, and side inspector support.

Rules:

- Use tabular numbers for prices, counts, dates, durations, metrics, percentages, IDs, and status counts (`font-variant-numeric: tabular-nums` or `tabular-nums`).
- Truncate long text with ellipsis; show full values in tooltip, detail panel, or inspector.
- Set max widths for names, descriptions, emails, URLs, labels, and error messages.
- Do not let long text push critical controls off-screen or unexpectedly expand rows.
- For tree tables, use chevrons, indentation, aligned columns, preserved selection state, and no repeated child headers.
- Avoid more than three visible hierarchy levels when possible.
- Consider a side inspector for deep child detail.
- Use virtualization for massive continuous workflows.
- Use pagination when stable page boundaries, exports, or audit navigation matter.
- Keep headers, filters, and bulk action bars sticky.
- Preserve scroll position when opening and closing inspectors.

Tree table example:

```txt
v Project Alpha
    |- Task 1
    |- Task 2
    `- Task 3
```

## Selection and Bulk Actions

Reveal a selection-aware bar only when items are selected.

```txt
3 selected | Assign | Change status | Export | More v | Clear
```

Rules:

- Show count, top bulk actions, overflow for rare bulk actions, and clear selection.
- Confirm destructive or high-impact bulk actions.
- Preview impact before complex or destructive bulk changes: affected record count, exceptions, unresolved blockers, permission effects, and final confirmation.

Bulk impact preview example:

```txt
Change status to "Closed"

This will affect:
- 142 records
- 18 records assigned to other users
- 6 records with unresolved blockers

[Cancel] [Apply changes]
```

## Dense Forms

Do not treat heavy data entry like a marketing page.

- Use multi-column layouts for short related fields: names, IDs, dates, statuses, owners, short selects, numeric inputs, toggles.
- Avoid multi-column layouts for long text, rich text, complex expressions, lengthy help text, and heavy validation messages.
- Group related inputs with compact headers, subtle panels, or bordered sections.
- Show inline validation near fields, preserve values, reserve summary errors for submit failures, and focus the first invalid field on submit.
- Use progressive form disclosure: advanced accordion, conditional fields, expert mode, or drawer for complex configuration.

Dense form example:

```txt
General
[Name              ] [Status       ]
[Owner             ] [Priority     ]

Scheduling
[Start date        ] [Due date     ]
[Timezone          ] [Reminder     ]
```

## Inspectors, Drawers, and Panes

Use inspectors for object-level depth without leaving the main workflow.

Inspector sections can include summary, properties, activity, comments, relationships, permissions, history, and advanced actions.

Rules:

- Preserve table/list context and keep the selected object visible or highlighted.
- Allow closing the inspector and carefully handle unsaved edits.
- Avoid forcing full-page navigation for quick details.
- Use drawers for advanced filters, rule builders, automation setup, bulk edit previews, import mapping, and permission configuration.
- Drawers can contain forms and sticky footers with clear Cancel/Apply actions.
- Drawers should not hide critical context unless necessary.
- Avoid nested drawers unless absolutely necessary.
- Use resizable panes for expert workflows such as table/inspector, editor/preview, nav tree/content, logs/details, query/results.
- Provide sensible min/max widths, remember preferences, and avoid pixel-perfect layout dependencies.
- Include double-click reset for pane sizes when appropriate.
