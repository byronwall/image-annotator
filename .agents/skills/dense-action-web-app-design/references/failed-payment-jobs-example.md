# Failed Payment Jobs Example

Use this worked example as a model for dense screen design output.

## User Request

Design a dense work queue for reviewing failed payment jobs. Users need to retry jobs, assign owners, inspect errors, filter by status, and bulk close resolved jobs.

## Design Rationale

The primary workflow is triaging failed jobs. Retry is visible because it is high frequency. Assignment is available inline and in bulk. Advanced diagnostics live in the inspector and command palette. Bulk close requires impact preview.

## Structural Wireframe

```txt
+--------------------------------------------------------------------+
| [Retry selected] [Assign] | Search jobs... | [Filter] [Sort] [View] |
|                                                    [More v]        |
+--------------------------------------------------------------------+
| [Status: Failed x] [Owner: Unassigned x] [+ Filter]                |
+-----------------------------------------------+--------------------+
| Jobs table                                    | Inspector          |
| [] Job ID       Status   Owner      Actions   | Error summary      |
| [] pay_1042     Failed   -          Retry ... | Timeline           |
| [] pay_1043     Failed   Maya       Retry ... | Payload            |
| [] pay_1044     Retried  Byron      Open  ... | Advanced           |
+-----------------------------------------------+--------------------+
```

## Action Hierarchy

| Action | Frequency | Context | Placement |
| --- | ---: | --- | --- |
| Retry job | High | Row | Inline row button |
| Retry selected | High | Bulk selection | Bulk action bar |
| Assign owner | Medium | Row or bulk | Row menu and bulk bar |
| Inspect error | High | Selected row | Side inspector |
| Export CSV | Low | Current view | More > Data |
| Create automation | Low | Global | More > Automation |
| Close selected | Medium risk | Bulk | Bulk menu with confirmation |

## More Menu

```txt
More
|- View
|  |- Customize columns
|  |- Density
|  `- Save current view
|- Data
|  |- Export CSV
|  `- Refresh
|- Automation
|  |- Create retry rule
|  `- View automations
`- Danger zone
   `- Close selected jobs
```

## State Model

- Default view: failed jobs.
- Default filter: `Status = Failed`.
- Default sort: `Last failed desc`.
- Default selection: none.
- Inspector: closed until row selection on narrow screens; open after row selection on desktop.
- Loading: fixed-height skeleton table rows.
- Empty: `No failed jobs match these filters. Clear filters.`
- Bulk action bar appears when one or more rows are selected.

## Implementation Notes

- Use virtualized table for large queues.
- Use sticky table headers and sticky filter chips.
- Use tabular numbers for IDs, timestamps, counts, and retry attempts.
- Truncate long error messages in the table and show full detail in inspector.
- Use `Cmd/Ctrl+K` for `Retry selected`, `Assign owner`, and `Create retry rule`.
- Confirm bulk close with an impact preview.
- Use inline row feedback for retry status and toast feedback for completed bulk operations.
