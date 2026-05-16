---
name: dense-action-web-app-design
description: Design or implement dense, high-action web app interfaces for enterprise SaaS, internal tools, admin panels, data grids, work queues, editors, dashboards, automation builders, developer tools, operations consoles, and configuration-heavy applications. Use when users need fast action across many records, controls, filters, workflows, or advanced surfaces without clutter.
---

# Dense Action Web App Design

Use this skill for dense web application screens where users need to inspect, configure, filter, compare, and act quickly across rich data or workflows.

Core rule: surface the common path, disclose the deep path, search the expert path.

Dense does not mean cluttered. A good dense interface shows frequent actions directly, keeps related controls close, uses progressive disclosure for deeper functionality, preserves context, and separates risky actions.

## Required Workflow

Before designing or coding, classify the interface:

1. Identify the primary workflow.
   - What is the user mainly trying to accomplish?
   - What object or dataset are they acting on?
   - What actions happen many times per session?
   - What actions are occasional but important?
   - What actions are advanced, risky, or administrative?
2. Classify every action by layer.
3. Choose the smallest disclosure surface that can handle each task.
4. Define the initial UI state.
5. Produce either the required design output or implement the screen with those decisions reflected in code.

## Action Layers

| Layer | Description | UI treatment |
| --- | --- | --- |
| Primary | Constantly used, central to task | Visible button or control |
| Secondary | Common but not constant | Toolbar button, split button, or nearby menu |
| Contextual | Applies to a selected object or row | Row menu, context menu, inspector action |
| Bulk | Applies to selected items | Selection-aware action bar |
| Advanced | Rare, complex, or expert-level | Drawer, advanced panel, command palette |
| Dangerous | Destructive, irreversible, external side effect | Separated, confirmed, or undoable |

## Disclosure Surfaces

| Surface | Use for | Avoid for |
| --- | --- | --- |
| Dropdown menu | Simple action lists | Forms or complex configuration |
| Split button | Default action plus variants | Unrelated actions |
| Popover | Small configuration | Long workflows |
| Side inspector | Object details and metadata | Full-screen tasks |
| Drawer | Advanced configuration | Tiny one-click actions |
| Modal | Blocking confirmation or focused decision | Routine settings |
| Command palette | Large action sets and expert navigation | Visual browsing |
| Context menu | Target-specific actions | Global app actions |
| Full page | Deep workflows requiring focus | Quick edits |

## Initial State Requirements

Always specify active tab, selected row or empty selection state, default filters, default density, open or closed panels, visible columns, default sort, loading behavior, and empty-state behavior.

## Required Design Output

When asked to design a dense web app screen, produce:

1. **Design rationale**: primary workflow, main user actions, visible versus disclosed actions, advanced surfaces, and safety handling.
2. **Structural wireframe**: ASCII or concise layout notation.
3. **Action hierarchy**: table with action, frequency, context, and placement.
4. **Menu structures**: exact menu contents.
5. **State model**: selected item, panels, active tab, filters, loading, empty, error, and responsive collapse behavior.
6. **Implementation notes**: component names, state variables, keyboard shortcuts, accessibility notes, overlay layering, data-loading behavior, and virtualization or pagination choice.

When producing code, prefer explicit state names, clear component boundaries, compact readable layout, and short comments only for complex disclosure behavior.

## Reference Files

Read only the reference files needed for the task:

- [interaction-patterns.md](references/interaction-patterns.md): density principles, toolbar collapse, progressive disclosure, menus, split buttons, keyboard, layering, and responsive behavior.
- [data-and-forms.md](references/data-and-forms.md): data grids, tables, virtualization, selection, bulk actions, dense forms, inspectors, drawers, and panes.
- [states-safety-accessibility.md](references/states-safety-accessibility.md): loading, empty, error, feedback, safety, accessibility, labeling, icons, final review checklist, and anti-patterns.
- [failed-payment-jobs-example.md](references/failed-payment-jobs-example.md): worked example for a dense work queue output.
