# Rectangle Label Text Evaluation - 2026-05-16

- Product URL: `http://localhost:3003/`
- Task: add text to a rectangle, control label font size, and control label position inside the shape.
- Viewport: in-app browser default viewport.
- Outcome: passed after changes.

## Evidence

- Screenshot: `assets/rectangle-label-text-2026-05-16/rectangle-label-size-align.png`
- Edit preview screenshot: `assets/rectangle-label-text-2026-05-16/rectangle-label-edit-preview.png`
- Final-after-edit screenshot: `assets/rectangle-label-text-2026-05-16/rectangle-label-final-after-edit.png`
- Console warnings/errors: none.

## Observed Flow

1. Loaded the sample image.
2. Drew a rectangle annotation.
3. Opened the selected layer menu and chose `Edit label`.
4. Entered `Status copy` as attached rectangle text.
5. Increased label font size from `28px` to `32px`.
6. Opened `Align` and set horizontal `Right`, then vertical `Bottom`.

## Result

- Rectangle text can now be edited from the selected-layer menu with shape-specific `Edit label` wording.
- Label font size is controlled separately from rectangle stroke/fill styling.
- Label alignment is controlled separately with horizontal and vertical options.
- Changing label size/alignment no longer routes through rectangle fill/background style updates.
- Edit preview now keeps the underlying rectangle visible and uses the same text layout helper as final canvas rendering for font, padding, wrapping, and alignment.

## Further Improvements

1. Show the active label alignment state on the closed `Align` trigger.
2. Add label-specific text color/background controls if users need label styling independent from shape styling.
3. Debounce repeated label size/alignment changes into one history entry instead of one entry per click.
4. Add direct resize handles for the label text box when users need padding or precise line wrapping inside large shapes.
