# Image Editor Initial Slice Work Summary

## 1) Scope and Context

- Request: implement an initial set of image annotation features from `docs/prd/SCOPE.md`, with primary focus on the image editor.
- Changed area: replaced the starter homepage with a working SolidStart editor at `/`, backed by reusable feature modules under `app/src/components/image-editor/`.
- Key constraints:
  - Use existing SolidStart, Panda, Park UI wrapper conventions.
  - Support paste as a first-class import path.
  - Make operations visible through history.
  - Embed editable project data into exported PNGs using PNG metadata keyed as `PNGDATA`.
  - Verify against the already-running dev server at `http://localhost:3001/`.

## 2) Major Changes Delivered

- Replaced the starter landing page in `app/src/routes/index.tsx` with an `ImageEditor` feature island and route-level `ErrorBoundary`.
- Added editor state, history, import/export, drawing, selection, undo/redo, and clipboard workflows in `app/src/components/image-editor/ImageEditor.tsx`.
- Added canvas rendering in `app/src/components/image-editor/image-editor.render.ts` for:
  - base image display
  - arrows
  - rectangles
  - ellipses
  - pen paths
  - highlighter paths
  - text labels
  - step markers
  - pixelation regions
  - crop previews and crop application
- Added PNG metadata round-trip support in `app/src/components/image-editor/image-editor.png-data.ts`.
  - Exports render a normal PNG and insert a `tEXt` chunk with keyword `PNGDATA`.
  - Imports parse `PNGDATA` from PNG files and restore the editable project.
- Added editor UI modules:
  - `ImageEditorToolbar.tsx`
  - `ImageEditorCanvas.tsx`
  - `ImageEditorContextBar.tsx`
  - `ImageEditorHistory.tsx`
  - `InlineAnnotationEditor.tsx`
  - `image-editor.types.ts`
- Reworked editing UX to be canvas-first:
  - removed the always-visible side inspector from the mounted UI
  - added contextual controls near the selected annotation
  - added an active-tool style dock that appears only while a drawing tool is selected
  - added inline text and step-marker editing directly on the canvas
  - added keyboard shortcuts for tool switching, undo/redo, delete, nudge, escape, enter-to-edit, and copy PNG
  - added resize handles for rectangle-like annotations
  - added duplicate and z-order actions in the contextual layer controls
- Intentionally unchanged:
  - Native screen capture, scrolling capture, OCR, uploaders, and workspace gallery remain future work.
  - The internal component explorer remains under its existing internal route.

## 3) Design Decisions and Tradeoffs

- Decision: store annotations as non-destructive JSON layers over a base image.
  - Alternative: draw directly into the base image after each operation.
  - Reason: editable layers are required for re-editing exported PNGs.
  - Tradeoff: metadata can become large because the base image data URL is embedded for round-trip editing.

- Decision: use a PNG `tEXt` chunk with keyword `PNGDATA`.
  - Alternative: custom four-byte PNG chunk type or sidecar JSON file.
  - Reason: PNG chunk types are four bytes, while the requested key is `PNGDATA`; using it as a text keyword keeps the PNG valid and easy to parse.
  - Tradeoff: text chunks are visible to metadata tooling and may be stripped by optimizers.

- Decision: keep the operation log visible and use snapshot-based undo/redo in memory.
  - Alternative: command inversion per operation.
  - Reason: snapshots are simpler and safer for the initial editor slice.
  - Tradeoff: restored PNGs preserve the visible operation log, but earlier restored log entries point at the current restored project snapshot rather than full historical snapshots.

- Decision: implement the first annotation tools directly with Canvas 2D.
  - Alternative: add a drawing library.
  - Reason: the initial slice is contained and does not need a dependency install.
  - Tradeoff: rotation, snapping, grouping, and advanced path editing are not implemented yet.

- Decision: use progressive disclosure instead of a persistent edit pane.
  - Alternative: keep a right-side inspector for all style and layer properties.
  - Reason: screenshot editors are fastest when users can work directly on the image and only see controls relevant to the active tool or selected object.
  - Tradeoff: the floating controls need careful placement to avoid blocking the drawing target; the active-tool dock was moved to the lower canvas edge after browser testing showed the first placement could block drawing.

## 4) Problems Encountered and Resolutions

- Symptom: `pnpm -C app type-check` rejected PNG byte arrays passed directly to `Blob`.
  - Root cause: this TypeScript/lib.dom combination expects `BlobPart` buffers backed by `ArrayBuffer`, while `Uint8Array` was inferred with `ArrayBufferLike`.
  - Resolution: added an `asArrayBuffer(...)` helper before constructing the PNG blob.
  - Preventative action: prefer explicit `ArrayBuffer` conversion when assembling binary browser blobs in this repo.

- Symptom: Panda `Box as="button"` rejected the native `type` prop.
  - Root cause: the generated `BoxProps` type does not include button-specific props.
  - Resolution: removed the `type` prop from color swatches because they are not inside a form.
  - Preventative action: use a shared `Button` or a typed styled button wrapper if swatches move into form contexts.

- Symptom: Solid `Show` branches in the inspector did not narrow text/step annotation unions.
  - Root cause: `annotation().type === "text"` inside `Show` did not carry narrowing to later `annotation()` calls.
  - Resolution: added small type-narrowing helpers that return `TextAnnotation | undefined` and `StepAnnotation | undefined`.
  - Preventative action: use `Show` function children with narrowed values for discriminated unions.

- Symptom: selecting a newly created text layer caused `Maximum call stack size exceeded`.
  - Root cause: the selected-layer style sync effect read from and wrote to the same `settings` signal, creating a reactive feedback loop.
  - Resolution: used `untrack(...)` and a `sameSettings(...)` guard before writing settings.
  - Preventative action: any effect that synchronizes selected object state into local controls should no-op guard before writing.

- Symptom: rectangle resize handles were visible but dragging a handle immediately after drawing could create another rectangle instead of resizing.
  - Root cause: active drawing tools handled pointer-down before selected resize handles.
  - Resolution: resize-handle hit testing now takes precedence over the active tool.
  - Preventative action: direct-manipulation affordances should win over tool modes when a selected object exposes handles.

## 5) Verification and Validation

- `pnpm -C app type-check`: passed.
- `pnpm -C app build`: passed.
  - Build emitted existing-style Rollup warnings about generated Panda pure annotations and large chunks from existing explorer/markdown assets; no build failure.
- Manual browser validation at `http://localhost:3001/`: passed.
  - Pasted an image from the clipboard into the editor.
  - Drew rectangle, arrow, step marker, and pixelate layers.
  - Confirmed each operation appeared in the visible history.
  - Confirmed text and step markers open inline editors on creation and commit edits into history.
  - Confirmed contextual controls appear for selected annotations and active tools.
  - Confirmed history can be collapsed and restored without losing operations.
  - Confirmed keyboard shortcut tool switching, keyboard nudge, duplicate, and resize-handle workflows.
  - Copied rendered PNG to clipboard and confirmed the PNG bytes contain `PNGDATA`.
  - Pasted the copied PNG back into the app and confirmed editable layers were restored.
  - Exercised undo/redo after PNGDATA restore.
- Browser console note: the session retained old pre-fix errors from the reactive-loop bug; after the fix, fresh visual checks showed no active error overlay and workflows completed.

## 6) Process Improvements

- A small deterministic editor fixture would speed future validation.
  - Current pain: manual browser testing required generating an image through browser clipboard automation.
  - Proposed change: add a local test fixture PNG and a short smoke-test script for import, draw, export, and PNGDATA parse.
  - Expected benefit: faster regression checks for editor round trips.
  - Suggested owner/place: add under `app/src/components/image-editor/__tests__` or a Playwright smoke script when e2e infrastructure is chosen.

- The editor verification path should include metadata round-trip, not just visual rendering.
  - Current pain: an exported PNG can look correct while silently losing editability.
  - Proposed change: document PNGDATA parse verification in the image editor checklist.
  - Expected benefit: prevents regressions that flatten editable exports.
  - Suggested owner/place: AGENTS image-editor section or a future local skill.

- Direct-manipulation UX needs explicit smoke steps.
  - Current pain: type-check does not catch pointer precedence issues where handles are visible but the active tool intercepts the gesture.
  - Proposed change: add manual or automated smoke checks for create -> select -> inline edit -> resize -> nudge -> copy -> re-import.
  - Expected benefit: better coverage of the app as a daily-use editor rather than a static renderer.
  - Suggested owner/place: future editor e2e checklist or local Playwright smoke script.

## 7) Agent/Skill Improvements

- Missing instruction discovered: browser-based editor validation needs direct clipboard/image fixture guidance.
  - Proposed update: add a repo note that image editor changes should verify paste/import, annotation history, PNGDATA presence, and PNGDATA re-import.
  - Why it helps: keeps future agents from stopping after type-check or visual rendering only.
  - Suggested place: `AGENTS.md` under a future "Image Editor Workflow" section.

- Missing instruction discovered: Solid discriminated unions inside `Show` should use explicit narrowing helpers.
  - Proposed update: add this example to `solid-reactivity-control-flow`.
  - Why it helps: avoids repeated type-check failures in inspector-like panels.
  - Suggested place: `.agents/skills/solid-reactivity-control-flow/SKILL.md`.

- Missing instruction discovered: reactive style sync effects should use `untrack` plus equality guards.
  - Proposed update: add this to `solid-props-state-patterns` under prop/state synchronization.
  - Why it helps: prevents settings panels and contextual toolbars from creating feedback loops.
  - Suggested place: `.agents/skills/solid-props-state-patterns/SKILL.md`.

## 8) Follow-ups and Open Risks

- P1: Extend resize handles to arrows, text bounds, and freehand paths.
- P1: Add a proper file-backed/project-backed persistence model if sessions need to survive browser refresh outside PNG export.
- P1: Add automated tests for PNGDATA encode/decode and a browser smoke test for re-import.
- P2: Add blur, spotlight, magnifier, ruler, and color picker tools from the MVP scope.
- P2: Store full normalized history snapshots in PNGDATA without duplicating base image data.
- P2: Add image overlay/import-as-layer support.
- P3: Add export presets and background/framing controls.
- Risk: PNG optimizers or external uploaders may strip `tEXt` chunks; exported images remain viewable but lose editability if metadata is removed.
