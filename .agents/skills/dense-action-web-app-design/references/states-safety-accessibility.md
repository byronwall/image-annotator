# States, Safety, and Accessibility

Use this reference for loading, empty, error, feedback, notification, safety, accessibility, labeling, review, and anti-pattern checks.

## Loading, Empty, and Error States

- Prefer skeleton rows, inline button spinners, small local loading text, and fixed-height placeholders.
- Avoid full-page spinners for local updates and avoid layout shift as nested content loads.
- Reserve predictable space where possible when expanding menus, panels, rows, or drawers.
- Keep compact empty states useful: `No results match these filters. [Clear filters]`.
- Explain whether empty state is due to filters, permissions, or no data.
- Show errors near the failed interaction: row save inline, export toast with retry, filter field error, permission explanation on disabled action.

Compact empty-state examples:

```txt
No results match these filters. [Clear filters]
```

```txt
No rules yet. [Create rule]
```

## Feedback and Notifications

Use subtle micro-feedback:

- `Saved`
- `Saved at 10:42 AM`
- `3 filters active`
- `12 rows updated`
- `Retrying...`
- `Copied`
- `Draft autosaved`

Use toasts for global results like export started, import complete, bulk update complete, background job failure, workflow published, and permission change saved.

Avoid toast spam for every field edit, hover, autosave, or polling update. Prefer inline feedback for row-level update status, field validation, per-record sync status, and small saved indicators in panel footers.

## Safety

- Put dangerous actions last, separated, clearly labeled, and distinct when appropriate.
- Confirm actions that delete data, affect many records, trigger external side effects, modify permissions, publish content, change billing, run automation, or cannot be easily undone.
- Prefer undo for low-risk reversible actions: `Item archived. Undo`.
- Disable unavailable actions with an explanation and suggested requirement when possible.

Danger-zone menu example:

```txt
Duplicate
Export
Archive
---
Delete permanently
```

Disabled action example:

```txt
Publish disabled: resolve 2 validation errors first.
```

## Accessibility

Requirements:

- Icon buttons have accessible names and tooltips when useful.
- Menus are keyboard navigable.
- Focus order matches visual order and focus is visible.
- Escape closes overlays.
- State is not color-only.
- Tooltips are not the only access to critical information.
- Touch targets are large enough on touch devices.
- Error messages are associated with fields.
- Disabled actions explain why when possible.

## Labeling and Icons

Prefer specific verbs:

- Create rule
- Export CSV
- Duplicate view
- Retry failed jobs
- Assign selected
- Hide archived
- Schedule run
- View audit log

Avoid vague labels: manage, configure, advanced, options, tools, more stuff.

Use icons as accelerators, not replacements. Important actions usually need text labels. Icon-only controls need accessible labels and tooltips. Do not reuse the same icon for unrelated concepts.

## Final Review Checklist

Visibility:

- Primary actions visible, secondary nearby, advanced discoverable, deep actions searchable, current state visible.

Density:

- Controls compact but usable, related controls grouped, tables use appropriate row density, toolbars do not wrap accidentally, long text truncates, numeric data uses tabular alignment.

Disclosure:

- Menus grouped by intent, split buttons contain true variants, popovers handle small configuration, drawers handle complex configuration, inspectors preserve context, command palette exposes deep actions.

Workflow:

- Bulk actions appear only when relevant, selection state is obvious, sticky headers preserve context, loading states avoid layout shift, empty states offer next actions, errors appear near failed interactions.

Safety:

- Destructive actions separated, risky actions confirmed, low-risk reversible actions use undo, bulk changes preview impact, disabled actions explain why.

Accessibility:

- Icon buttons named, menus keyboard navigable, focus managed across overlays, Escape closes disclosures, state is not color-only, mobile touch targets are large enough.

Responsiveness:

- Desktop supports density and expert speed, tablet reduces simultaneous controls, mobile uses sheets and simplified menus, primary action remains accessible, advanced controls collapse predictably.

## Anti-Patterns

Avoid:

- Giant unstructured More menus.
- Primary actions hidden in overflow.
- Ambiguous icon-only toolbars.
- Critical multi-level nested menus.
- Full-page spinners for local loading.
- Huge empty-state illustrations inside compact tools.
- Modals for routine configuration.
- Dense forms with no grouping.
- Tables where long text breaks layout.
- Hover-only actions with no keyboard alternative.
- Destructive actions next to frequent safe actions.
- Advanced features that cannot be searched.
- Toolbars that wrap unpredictably.
- Drawers that lose context.
- Layouts that fail with localized or long labels.
