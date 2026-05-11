# Text Preview Editor Work Summary

## 1) Scope and Context

- Request: resolve the Product Grid issue for the image annotation text tool where the inline text preview looked like a generic input box instead of the final rendered annotation.
- Product Grid node implemented: `page-text-preview-needs-to-match-the-styles-it-will-use-when-rendered-still-feels-like-a-random-text-box-being-rendered` in project `image-annotation-real`.
- Downloaded Product Grid context pack: `tmp/product-grid-text-preview-context/`, including the two reference screenshots showing the white bordered edit box and the expected blue text rendering.
- Changed area: Solid image editor text annotation rendering and inline editing overlay.
- Constraints: preserve Solid reactivity, use existing ParkUI/Panda wrappers, avoid editing generated `app/styled-system/`, keep canvas export behavior unchanged.

## 2) Major Changes Delivered

- `app/src/components/image-editor/image-editor.render.ts`
  - Added shared text render metrics for padding, line height, font family, font weight, and radius.
  - Reused those metrics in canvas text drawing and text bounds calculation.
  - Switched text bounds to browser canvas text measurement when available, keeping an SSR-safe fallback.
- `app/src/components/image-editor/InlineAnnotationEditor.tsx`
  - Restyled the text editing textarea to match annotation rendering: color, fill, opacity, font, padding, line height, radius, and no input border/focus chrome.
  - Preserved the existing textarea editing model, focus behavior, blur commit, Escape cancel, and Enter commit behavior.
- `app/src/components/image-editor/ImageEditorCanvas.tsx`
  - Hid the actively edited text annotation from canvas rendering so the styled editor is the single visible preview.
  - Sized and positioned the text editor from current annotation bounds, scaled to the displayed canvas frame.
  - Fixed the local Solid lint warning by reading `activeTool` in the tracked memo scope.
- Intentionally unchanged: step marker editing still uses the existing compact input styling; PNG export and final canvas rendering behavior remain on the same render pipeline.

## 3) Design Decisions and Tradeoffs

- Decision: keep the textarea for text editing rather than replacing it with contenteditable.
  - Alternative: use a contenteditable element to get natural text sizing.
  - Why chosen: the current textarea path already owns keyboard, focus, commit, cancel, and controlled value behavior.
  - Tradeoff: textarea sizing still depends on annotation bounds, but those bounds now use the same measured text metrics as the canvas renderer.
- Decision: share render metrics from `image-editor.render.ts`.
  - Alternative: duplicate the CSS values in `InlineAnnotationEditor.tsx`.
  - Why chosen: canvas drawing, hit bounds, and edit overlay now move together when text styling changes.
  - Tradeoff: the editor imports a render helper, but this module is already used by `ImageEditorCanvas`.
- Decision: omit the actively edited annotation from the canvas while editing.
  - Alternative: make the textarea transparent over the live canvas text.
  - Why chosen: transparent overlay would double-render text and make weight/opacity look wrong.
  - Tradeoff: selection handles are not drawn during active text entry, which is consistent with focusing the text editor.

## 4) Problems Encountered and Resolutions

- Symptom: `pgm issue view` and direct node view for the URL node slug returned `Node not found`.
  - Root cause: the URL contained a stale or non-node slug (`page-text-tool-feedback-see-context`).
  - Resolution: listed the compact project tree, identified the matching current problem node by title, then downloaded its context pack.
  - Preventative action: update the Product Grid context workflow to mention searching compact siblings when URL node slugs are stale.
- Symptom: the dev server failed inside the sandbox with `Unable to find a random port on any host`.
  - Root cause: localhost binding was blocked by sandboxing.
  - Resolution: reran the dev server with approved escalation; it started on `http://localhost:3001/` because `3000` was occupied.
  - Preventative action: for browser verification, escalate localhost dev-server binding immediately after a sandbox port failure.
- Symptom: lint reported a Solid reactivity warning in the touched canvas file.
  - Root cause: `props.activeTool` was read inside a nested callback passed from a tracked memo.
  - Resolution: captured `activeTool` in the memo before creating the callback.
  - Preventative action: rerun lint after UI changes even when type-check passes.

## 5) Verification and Validation

- `pnpm -C app type-check`: passed.
- `pnpm -C app lint`: passed with warnings only in pre-existing `app/src/middleware.ts` import alias lines; no touched-file warnings remain.
- `pnpm -C app build`: passed. Build emitted existing Rollup warnings about Panda generated `/* @__PURE__ */` comments.
- Browser verification at `http://localhost:3001/`:
  - Pasted a generated PNG into the editor.
  - Added a text annotation with the text `testing`.
  - Confirmed the active editing preview renders as blue annotation text with translucent fill and no white box or black textarea border.
  - Checked browser error logs: no errors.
- Product Grid update: marked the matching node `implemented` with an implementation note.

## 6) Process Improvements

- Current pain/problem: a Product Grid URL can point at a stale node slug, blocking the documented fast path.
- Proposed change: after `pgm issue view` or direct `pgm node view` returns `Node not found`, search the project compact tree before asking the user.
- Expected benefit: preserves momentum and still respects targeted context instead of falling back to a full project dump.
- Suggested owner/place: add this fallback sequence to the `product-grid-context` skill.

- Current pain/problem: type-check alone would not catch a visual editor mismatch or Solid lint warning.
- Proposed change: for image editor UI changes, run type-check, lint, build, and one browser smoke test that exercises the changed tool.
- Expected benefit: catches visual regressions and local quality warnings before handoff.
- Suggested owner/place: add to an image editor verification checklist or `AGENTS.md`.

## 7) Agent/Skill Improvements

- Missing instruction discovered: the Product Grid URL fast path does not describe path-style project URLs with stale or indirect `node` query values.
- Proposed update: extend `product-grid-context` with a fallback: list compact nodes with ancestors, identify the closest title match, then fetch context pack for that node.
- Why it reduces churn: avoids repeated failed node lookups and avoids unnecessarily broad project exports.

- Missing instruction discovered: browser verification may need clipboard-based image import when file upload APIs are not available in the in-app browser surface.
- Proposed update: add a short recipe for creating a small PNG, writing it to browser clipboard, and triggering paste for this app.
- Why it reduces churn: makes visual smoke tests for paste-first editor workflows faster and repeatable.

## 8) Follow-ups and Open Risks

- Follow-up: consider applying the same visual parity treatment to step marker inline editing if users report the step editor feeling inconsistent.
- Follow-up: decide whether Product Grid context packs under `tmp/` should be ignored or cleaned after issue resolution; this run left the requested context pack local and untracked.
- Open risk: textarea content sizing still depends on measured annotation bounds rather than true DOM intrinsic width; current verification matches the expected single-line case from the issue.
