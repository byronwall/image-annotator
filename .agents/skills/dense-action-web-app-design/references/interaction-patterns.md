# Interaction Patterns

Use this reference for density, toolbar, disclosure, menu, keyboard, layering, and responsive decisions.

## Density Principles

- Prefer compact toolbars, tables for record comparison, inline row actions, selection-aware bulk actions, split panes, sticky headers, compact filter chips, command palettes, and contextual overflow menus.
- Avoid sparse marketing layouts, giant cards for small controls, excessive whitespace, hidden primary actions, junk-drawer menus, hover-only critical actions, and toolbars that wrap unpredictably.
- Group controls by workflow intent: view controls, search and filters, selection controls, row actions, bulk actions, import/export, automation, admin, and danger zone.

Recommended desktop density targets:

| Element | Dense size |
| --- | --- |
| Toolbar | 36-44px |
| Button | 28-36px |
| Input | 30-36px |
| Icon button | 28-36px |
| Table row | 32-40px |
| Menu item | 30-36px |
| Filter chip | 24-30px |

Do not shrink below comfortable interaction size. For touch, increase targets, reduce simultaneous controls, and prefer sheets or simplified menus.

## Progressive Disclosure

- Show frequent actions directly: create, save, run, search, filter, assign, retry, approve, publish, edit.
- Disclose occasional actions nearby with menus, split buttons, and popovers: duplicate, export, save as template, customize columns, change density, view history, archive.
- Put deep functionality in structured drawers, inspectors, advanced panels, or command palettes: rule builders, permission matrices, bulk transformations, automation workflows, complex filters, audit logs, environment configuration, import mapping, diagnostics.
- Make significant hidden actions searchable through command palette, keyboard shortcut, searchable menu, help, or shortcut overlay. Default command palette shortcut: `Cmd/Ctrl+K`.

## Toolbar Pattern

Standard dense toolbar:

```txt
[Primary Action] [Secondary Action] | [Search...] [Filter] [Sort] [Group] | [View: Name v] [More v]
```

Rules:

- Keep primary action visible.
- Keep search visible when central.
- Show active filters as chips.
- Collapse lower-frequency actions into overflow.
- Do not allow chaotic wrapping.
- Make toolbar and filter rows sticky for large datasets.

Adaptive collapse order:

1. Keep the primary action visible.
2. Keep search or current view visible.
3. Collapse secondary actions into overflow.
4. Collapse labels to icons only when icons are obvious.
5. Move advanced controls into a drawer or sheet.
6. Do not wrap controls into accidental rows.

## Menus and Split Buttons

Menus must be structured by intent, not dumped into "More".

```txt
More
|- View
|  |- Customize columns
|  |- Density
|  `- Show archived
|- Data
|  |- Import
|  |- Export CSV
|  `- Refresh
|- Automation
|  |- Create rule
|  `- Run workflow
`- Danger zone
   |- Archive selected
   `- Delete selected
```

Rules:

- Use sections, dividers, direct verbs, and scannable labels.
- Put destructive actions last and visually separated.
- Prefer one level of nesting.
- Use nested menus sparingly: only for obvious categories with many children and strong keyboard support.
- Avoid nested menus for destructive actions, comparison tasks, form flows, mobile-heavy interfaces, or menus deeper than two levels.
- Use split buttons only for one safe default action plus related variants. Do not mix unrelated actions into split-button menus.

Split button example:

```txt
[Run] [v]

Run now
Run with parameters
Schedule run
Dry run
View run history
```

## Keyboard and Power Users

Dense apps must support:

- Tab navigation, arrow-key menus, Escape to close overlays, Enter to activate.
- `Cmd/Ctrl+K` for command palette, `/` for search when appropriate, `?` for shortcut help.
- Shift-click range selection, keyboard-accessible row selection, and focus restoration after overlays close.

Do not trap focus accidentally. Move focus into modals/drawers when opened and return it to the trigger when closed.

## Layering and Z-Index

Define a consistent layering model:

| Layer | Example | Priority |
| --- | --- | --- |
| Base | Page content | Lowest |
| Sticky | Headers, toolbars, frozen columns | Above content |
| Dropdown | Menus, selects | Above sticky |
| Popover | Filters, column pickers | Above dropdown |
| Drawer | Side workflows | Above popovers |
| Modal | Confirmations, blocking decisions | Above drawers |
| Toast | Global notifications | Near top |
| Command palette | Global command UI | Highest or modal-level |
| Tooltip | Local helper text | Above local surface, below blocking modal if needed |

Rules:

- Do not let menus render under sticky headers or be clipped by table containers.
- Use portals for overlays when necessary.
- Avoid multiple competing overlays.
- Close lower-priority overlays when opening a higher-priority one.

## Responsive Behavior

- Desktop can support dense toolbars, data grids, split panes, side inspectors, hover affordances, keyboard shortcuts, multi-select, and resizable panes.
- Tablet should reduce toolbar density, use larger controls, collapse side panels, show fewer columns, and use drawers instead of permanent inspectors where needed.
- Mobile should use bottom sheets, sticky primary actions, larger touch targets, simplified menus, fewer simultaneous panels, and step-based flows for complex tasks.
- Do not port desktop toolbar clusters directly to mobile. Avoid hover-only actions and keep destructive actions separated.
