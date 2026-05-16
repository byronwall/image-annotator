# Screenshot Annotation Editing Experience Review

Review date: 2026-05-15

## Goal

Make this tool the best screenshot annotation editor for web development work: fast enough for repeated daily use, precise enough for UI review, private enough for real product screenshots, and integrated enough to turn a capture into a useful bug report, PR note, or design review artifact without switching tools.

This review incorporates the existing scope and work-summary docs:

- `docs/prd/SCOPE.md`
- `docs/image-editor-initial-slice-work-summary.md`
- `docs/image-editor-ux-audit-work-summary.md`
- `docs/text-preview-editor-work-summary.md`

It also compares the current app against the public feature sets of Shottr, CleanShot X, ShareX, and Snagit. The useful pattern across those products is clear: best-in-class screenshot tools are not only drawing tools. They are fast capture, precise pixel inspection, privacy cleanup, polished presentation, reliable export/share, and repeatable workflow automation.

## Current App Baseline

The current app is a browser-based SolidStart image editor mounted at `/` through `app/src/routes/index.tsx`. The active editor is concentrated in `app/src/components/image-editor/*` with server-backed saved image storage under `app/src/lib/image-editor/saved-images.ts` and `app/src/routes/api/image-editor/saved-images*`.

Strong current capabilities:

- Import starts from paste, drag-and-drop, or file choose.
- PNG exports include editable project metadata through the `PNGDATA` text chunk.
- Reopening a PNGDATA image restores editable layers and history.
- Core annotation tools exist: select, arrow, rectangle, ellipse, pen, highlighter, text, step marker, measure, pixelate, and crop.
- Image overlays exist by pasting an image into an existing project.
- Before/after mode can turn the current project plus a pasted image into a static two-panel comparison frame.
- Layer operations exist: select, hide/show, duplicate, bring forward, send backward, delete, copy/cut/paste, keyboard nudge.
- History is visible and jumpable.
- Measurement is already unusually interesting: edge-snap and point-to-point modes exist, and edge snapping is implemented from rendered pixel analysis.
- Canvas ergonomics exist: fit/actual zoom, wheel zoom around cursor, panning, pointer coordinates, draft size/length readout, crop apply/cancel, and inline text/step editing.
- Server save exists and keeps the newest 100 saved images in runtime data.

Important current limits:

- There is no native capture layer yet: no region/window/fullscreen/global hotkey, no scrolling capture, no last-region capture, no window/object capture.
- There is no OCR, QR decode, color picker, contrast checker, spotlight, magnifier callout, blur, object removal, or smart redaction.
- Pixelate is present, but privacy tooling is not yet defensible enough for sensitive product screenshots.
- Before/after is static. There is no overlay opacity mode, slider comparison, pixel diff, or animated export.
- Saved images are a simple server list. There is no rename/delete, open-back-into-editor, tagging, OCR search, or upload/share URL model.
- Export is PNG-only from the UI, with a fixed white background in rendered exports.
- Styling is useful but shallow: fixed swatches, fixed stroke/font/opacity steps, no quick styles, no brand palette, no recent colors, no hand-drawn or callout variants.
- There is no automated image editor smoke suite despite repeated docs calling out PNGDATA round-trip risk.

## Competitive Bar

Shottr sets the most relevant bar for a web-dev-oriented still screenshot tool. Its public positioning focuses on designers, front-end engineers, mobile developers, and pixel-focused users. Notable features include lightweight/native speed, scrolling screenshots, backgrounds, pixelate/remove objects, OCR/QR, screenshot combining, resize, pinning, markup, overlays, screen ruler, and color picker. Recent release notes add S3-compatible upload, magnifier callout, hand-drawn styles, bendable arrows, object snapping, OKLCH/APCA contrast support, gradient backdrop tooling, side-by-side screenshots, and advanced keyboard manipulation.

CleanShot X sets the bar for Mac workflow polish. Its feature set emphasizes a simple high-performance annotation editor, crop with aspect ratio and edge snapping, curved arrows, secure blur/pixelate, spotlight, step counters, pencil smoothing, highlighter, multiple text styles, editable project files, drag-and-drop image combining, background tool with auto balance, quick access overlay after capture, capture history, scrolling capture, OCR, floating screenshots, and screen recording.

ShareX sets the bar for power-user workflow breadth. It has many capture modes, after-capture tasks, region annotation tools, magnify, image-from-file/screen, smart eraser, blur, pixelate, crop/cut-out, OCR/QR, image effects, image combiner/splitter, upload destinations, and custom uploader definitions.

Snagit sets the bar for professional documentation. Its strongest differentiators are step capture, AI smart redact, scrolling capture, smart move, text recognition, templates, quick styles/themes, spotlight/magnify, capture info, cut-out, borders/edges, and recording workflows.

The current app has a promising core editing model, especially PNGDATA re-editability, but it is currently closer to a strong in-browser annotation prototype than to a best-in-class screenshot workflow tool.

## Category 1: Improve Existing Features To Be More Powerful

### 1. Make selection and direct manipulation feel pixel-grade

Current state: the editor supports selecting, moving, resizing rectangle-like layers, nudging by keyboard, duplicate/copy/paste, z-order, and panning/zooming.

Suggested upgrades:

- Add multi-select with group move, group duplicate, group delete, group z-order, and group style changes.
- Add alignment and distribution commands: align left/center/right/top/middle/bottom, distribute horizontal/vertical spacing.
- Add snap guides for canvas edges, image bounds, layer centers, equal spacing, and other layer edges.
- Add optional object snapping while drawing or moving, matching Shottr's recent configurable object snapping direction.
- Add keyboard resize for selected bounds: Cmd/Ctrl + Arrow for 1 px resize and Cmd/Ctrl + Shift + Arrow for 10 px resize.
- Add selection bounds grow/shrink shortcuts for all sides and for individual edges.
- Add selection zoom shortcuts: zoom to selected layer, zoom to top-left/bottom-right of selection, fit selected region.
- Add a smart selection/autoadjust command for monotone UI blocks and rectangles. For screenshots, this would speed crop, pixelate, measure, and callout placement.

Why it matters:

Web-dev annotation often means "point to this exact UI region" or "prove this spacing is off by 4 px." The existing model is already direct-manipulation based, so these features deepen the core instead of adding a separate workflow.

### 2. Turn the measure tool into a front-end inspection tool

Current state: measurement supports edge snapping and point-to-point mode, can render a label, and shows draft lengths.

Suggested upgrades:

- Show logical px, physical px, and device pixel ratio when the source/capture metadata is available.
- Let users toggle CSS px vs image px for retina/downscaled screenshots.
- Add horizontal/vertical forced modes directly in the context bar.
- Add a "measure nearest gap" interaction: hover between two detected edges and press an arrow key to place the measurement.
- Add measurement copy actions: copy length as `24px`, copy CSS gap token candidates, copy as Markdown note.
- Add endpoint confidence UI when edge snap is active so the user can see whether the snap found a real edge.
- Add persistent measurement styles: caliper, plain line, bracket, label above/below.
- Add a measurement inspector that lists all measurement layers and their values for quick review.
- Add contrast and color analysis adjacent to measurement: color under cursor, average selected color, darkest text pixel, WCAG/APCA score.

Why it matters:

Shottr's ruler and color picker are core to its developer positioning. The current edge-snap implementation is a strong foundation; the next move should make it a daily UI QA instrument.

### 3. Upgrade annotation styles from "functional" to "publication ready"

Current state: swatches, fill swatches, stroke width, font size, and opacity are fixed step controls in the floating context bar.

Suggested upgrades:

- Add quick style presets for each tool: product callout, bug highlight, docs style, hand-drawn review style, subtle QA mark.
- Add recent colors and custom colors.
- Add brand palettes loaded from settings or project presets.
- Add arrow styles: straight, elbow, curved/bendable, double-ended, line only, soft shadow, hand-drawn.
- Add rectangle styles: square, rounded, filled, outline-only, translucent, label badge attached.
- Add text styles: no background, pill background, dark label, light label, warning label, code label, numbered callout label.
- Add step marker variants: circle, square, pill, small badge, large tutorial marker.
- Add reusable style defaults per tool and "make current style default."
- Add one-click "copy style" and "paste style" between layers.

Why it matters:

Best-in-class apps make screenshots look polished without requiring graphic design work. The current editor is editable and useful, but the default output should look deliberate enough for PRs, docs, changelogs, and user-facing release notes.

### 4. Make privacy tools safe enough for real screenshots

Current state: pixelate exists as a resizable box annotation, but the app does not yet provide blur, smart redact, object removal, metadata stripping, or redaction warnings.

Suggested upgrades:

- Add blur with two modes: smooth blur for presentation and secure blur/pixelate for privacy.
- Randomize pixelation blocks or add noise so redacted text is harder to infer.
- Add a destructive "flatten redactions" export option that burns redactions into the image before sharing.
- Add warnings when exporting with non-flattened redaction layers and editable PNGDATA metadata still present.
- Add a "safe copy" command that strips PNGDATA and metadata, flattens redactions, and copies a clean image.
- Add automatic sensitive text detection once OCR exists: emails, API keys, tokens, phone numbers, credit card-like strings, IPs, URLs with secrets.
- Add a redaction review overlay that lists all detected sensitive regions and asks the user to confirm.

Why it matters:

Developers routinely screenshot logs, admin UIs, API responses, billing screens, user data, and auth flows. Pixelate alone is not enough if the exported PNG preserves editability or if weak pixelation leaks text structure.

### 5. Improve crop, canvas, and image sizing

Current state: crop exists; canvas can expand by fixed padding and trim to content; pasted images can become image layers; before/after mode creates a static frame.

Suggested upgrades:

- Add crop aspect ratios and fixed dimensions.
- Add crop edge snapping to image bounds, layers, and detected UI rectangles.
- Add crop presets for common web-dev outputs: GitHub comment width, Slack preview, docs hero, changelog image, social preview.
- Add canvas resize by exact width/height and by scale factor.
- Add image resize by exact dimensions and percent.
- Add export scaling at 1x, 2x, and 3x.
- Add transparent export and configurable background export.
- Add auto-padding controls with presets like 16, 24, 32, 48, 64 px.
- Add "fit to selected content" and "center content on canvas."

Why it matters:

The current canvas controls are useful but coarse. Screenshot tools win by eliminating the last manual step before sharing into GitHub, Slack, Linear, Notion, docs, or release notes.

### 6. Deepen image overlays and before/after workflows

Current state: pasted images become image layers, and before/after mode creates a static side-by-side frame.

Suggested upgrades:

- Add overlay comparison mode with adjustable opacity and a keyboard toggle between 0/50/100 percent.
- Add before/after slider export.
- Add pixel diff mode with threshold controls and changed-region highlighting.
- Add blinking before/after preview and GIF export.
- Add automatic alignment helpers: align image layer to base image by edges, centers, or detected content.
- Add side-by-side templates with labels, captions, and consistent padding.
- Add a "compare current export against new paste" flow that preserves the original project instead of replacing it.

Why it matters:

Web development review often asks "what changed?" A strong comparison workflow is more valuable for this product than generic photo-editing features.

### 7. Make text and step annotations better for tutorials and bug reports

Current state: text and step markers support inline editing. Step markers auto-increment based on existing step count.

Suggested upgrades:

- Add callouts with pointer tails.
- Add speech/caption boxes for explaining UI states.
- Add automatic step renumbering when markers are reordered or deleted.
- Add "convert step markers to ordered list" for issue/report text.
- Add step sequence templates: click path, bug repro, setup steps, expected/actual.
- Add editable text wrapping width and resize handles for text boxes.
- Add Markdown/code-aware text styles for snippets and error messages.
- Add larger hit areas and better handles for tiny step markers at high zoom.

Why it matters:

For web-dev workflows, screenshots are often communication artifacts. Text and steps should help create a bug reproduction or review note, not just decorate the image.

### 8. Turn history and PNGDATA into a durable project model

Current state: PNGDATA stores the project and history entries in PNG metadata. Server save stores rendered PNGs in runtime data.

Suggested upgrades:

- Add a first-class project save format alongside PNGDATA, even if it is JSON or `.iapng` internally.
- Add "open saved image in editor" from the saved images list.
- Add PNGDATA health checks on import/export with clear status: editable metadata present, missing, stripped, or invalid.
- Add history compaction so long sessions do not balloon exported PNG size.
- Add autosave drafts in IndexedDB/local storage before server save.
- Add crash/refresh recovery.
- Add tests for PNGDATA encode/decode, export, re-import, and history restoration.
- Add a "share-safe PNG" export that intentionally removes PNGDATA.

Why it matters:

PNGDATA is a strong differentiator: screenshots can carry their editable layers. But the same feature creates file-size and privacy risks, so it needs explicit product treatment.

### 9. Upgrade saved images from a list to a working library

Current state: the sidebar shows saved PNG thumbnails from a server-backed store capped at 100.

Suggested upgrades:

- Add rename, delete, duplicate, download, copy URL, copy Markdown image, and open in editor.
- Add sorting and filtering by created date, dimensions, file size, and project/editability status.
- Add search by name now, OCR text later.
- Add tags or folders for project/client/feature.
- Add persisted thumbnails instead of always rendering original images in the sidebar.
- Add retention settings and "clear old saves."
- Add a visible distinction between local runtime saves, exported files, and uploaded/shared links.

Why it matters:

A web-dev screenshot workflow produces many small artifacts. Without a usable library, people fall back to desktop clutter or third-party tools.

### 10. Improve keyboard, command, and power-user ergonomics

Current state: tool shortcuts, undo/redo, copy/cut/paste/duplicate, z-order, zoom, panning, stroke width changes, tab layer cycling, delete, enter edit, and crop apply exist.

Suggested upgrades:

- Add a command palette with fuzzy commands and visible shortcuts.
- Add customizable shortcuts.
- Add per-tool shortcut hints near the cursor or in the status bar while active.
- Add a "last used tool" toggle.
- Add temporary tool modifiers: hold Space for pan, hold Option for duplicate-drag, hold Shift for constrain, hold Cmd/Ctrl for snap/selection modes.
- Add toolbar customization and compact/power modes.
- Add a real shortcut reference page generated from the command registry.

Why it matters:

Shottr's appeal is speed. The current keyboard layer is good, but the command model should become explicit and discoverable before the app grows more tools.

### 11. Make rendering faster and safer for large screenshots

Current state: canvas rendering is straightforward Canvas 2D, image layers are cached by data URL, and measurement edge scanning samples pixels near the cursor.

Suggested upgrades:

- Cache pixelate results per annotation until the source/layer changes.
- Cache measurement edge buffers with better invalidation and optional downsampled indexes.
- Avoid storing duplicate base image data in every history snapshot.
- Add file-size estimates before PNGDATA export.
- Add a large-image mode that disables expensive live effects until pointer-up.
- Add performance benchmarks for long scrolling screenshots once capture exists.
- Add worker/offscreen rendering for exports if large images block the UI.

Why it matters:

The target user will paste full-page screenshots, high-DPI browser captures, and multiple image layers. Performance must remain predictable before adding scrolling capture or diffing.

### 12. Add export presets and destination-aware outputs

Current state: export downloads PNG; copy writes PNG to the clipboard when browser support allows; save writes server PNG.

Suggested upgrades:

- Add export formats: PNG, JPEG, WebP, PDF, SVG overlay data where feasible.
- Add destination presets: GitHub issue, GitHub PR, Linear, Jira, Slack, Notion, documentation, social.
- Add filename templates based on app/project/route/date/time.
- Add copy variants: image, Markdown image, HTML image, file path, rendered URL.
- Add background/frame presets per destination.
- Add compression quality controls and resulting file-size preview.

Why it matters:

The final user action is usually not "export a PNG"; it is "put this exact visual into the place where work is happening."

## Category 2: Powerful New Features To Add

### 1. Native or browser-extension capture pipeline

Add capture modes that feed directly into the editor:

- Region capture.
- Window capture.
- Fullscreen/monitor capture.
- Last region.
- Timed capture.
- Object/menu/popover capture.
- Clipboard-to-editor capture.
- Global hotkeys.

For a web app, this likely means one of three implementation paths:

- A browser extension for DOM/page/element capture.
- A small native shell using Tauri/Electron for global hotkeys, window capture, and always-on-top pinning.
- A hybrid path: web editor first, extension next, native shell when global capture becomes a hard requirement.

Why it matters:

The current app starts after an image already exists. Best-in-class screenshot tools win at the moment of capture.

### 2. Scrolling and DOM-aware web capture

Add web-dev-specific capture modes:

- Full-page scrolling capture.
- Element capture by hover/select.
- Capture a scrollable container, not only the full page.
- Capture hidden overflow areas.
- Capture with viewport/device presets.
- Capture route URL, viewport size, DPR, browser name, timestamp, and optionally git branch/build metadata.
- Capture DOM bounding boxes as optional editable guide layers.

Why it matters:

Shottr, CleanShot, ShareX, and Snagit all treat scrolling capture as a major feature. For this product, DOM-aware capture could be the real differentiator because web developers need page, component, container, and responsive-state captures.

### 3. OCR, QR, and code extraction

Add extraction workflows:

- Select area -> copy recognized text.
- Full-image OCR.
- QR/barcode decode.
- Copy OCR as plain text, Markdown, JSON, table, or code block.
- Detect programming language for code screenshots.
- Extract stack traces and console errors.
- Search saved captures by OCR text.
- Local OCR mode for privacy, with optional cloud-enhanced mode if configured.

Why it matters:

Shottr and CleanShot both emphasize OCR. Snagit goes further by letting users edit/copy/delete text inside screenshots. For web-dev work, OCR plus code extraction is a direct time saver.

### 4. Dev-focused color and accessibility inspector

Add inspection features around the screenshot:

- Cursor color picker with HEX/RGB/HSL/OKLCH copy formats.
- Average color picker over a selected region.
- Darkest text color picker in a small sampled region.
- WCAG and APCA contrast readout between sampled foreground/background.
- Palette extraction from a screenshot.
- Copy color as CSS custom property snippet.
- Flag likely insufficient contrast in selected text areas.

Why it matters:

Shottr already supports color picking, average color, text color sampling, OKLCH, and APCA. This is squarely aligned with front-end development and design QA.

### 5. Smart redaction and privacy scanner

Add a privacy pass before copy/export/upload:

- OCR-backed detection of emails, names, phone numbers, addresses, API keys, tokens, credit cards, URLs with query secrets, IPs, and account IDs.
- One-click redact all.
- "Review each" flow for sensitive detections.
- Metadata stripping.
- Local-only mode.
- Safe export presets that flatten redactions and strip PNGDATA.

Why it matters:

Snagit now advertises AI smart redact, and Shottr emphasizes hiding/removing sensitive information. A screenshot tool for developers must assume screenshots may include credentials and customer data.

### 6. Pixel diff and visual regression review

Add comparison modes for implementation review:

- Overlay two screenshots with opacity.
- Side-by-side comparison.
- Slider comparison.
- Pixel diff with threshold and anti-alias tolerance.
- Highlight bounding boxes around changed regions.
- Export a diff artifact.
- Add annotations to either source or the diff.
- Save comparison sessions.

Why it matters:

This product can become more valuable than generic screenshot apps by connecting annotation to visual QA and PR review.

### 7. Bug-report and PR-review artifact builder

Add a structured output flow:

- Generate a bug report from screenshot, annotations, URL, viewport, device, browser, timestamp, console logs, network errors, and user notes.
- Copy as GitHub issue Markdown.
- Copy as Linear/Jira-ready text.
- Export expected vs actual blocks from before/after or diff mode.
- Include a checklist of reproduction steps based on step markers.
- Attach saved image URL or embedded Markdown image.

Why it matters:

The user's stated workflow is web development. The most valuable output is often not the image itself but the issue, PR comment, or QA note the image supports.

### 8. Upload, sharing, and custom destinations

Add sharing beyond local server save:

- One-click upload and copy link.
- S3-compatible storage, including R2/Minio-style endpoints.
- Custom webhook uploader inspired by ShareX custom uploaders.
- GitHub/Linear/Jira/Slack/Discord/Notion destinations.
- Expiring/private links if a hosted service exists.
- Copy deletion URL or revoke link.
- Upload queue with retry.
- Per-destination privacy presets.

Why it matters:

Shottr has S3-compatible upload. ShareX's custom uploader system is a power-user standard. This app should combine simple defaults with bring-your-own-storage for privacy-conscious teams.

### 9. Pin/reference mode

Add a way to keep screenshots visible while building:

- In-browser reference tray for saved/pinned images.
- Always-on-top floating windows in a native shell.
- Opacity control.
- Click-through/lock mode.
- Resize and position with arrow keys.
- Quick pin from capture or editor.
- Pin before/after images while coding.

Why it matters:

Shottr and CleanShot both treat pinned screenshots as a core workflow. For web dev, pinned references help compare implementation against designs or previous states while editing code.

### 10. Screen recording and short bug GIFs

Add lightweight recording later, after still-image capture is strong:

- Region/window/fullscreen recording.
- GIF export for short bug repros.
- Cursor highlight and click animation.
- Keystroke display.
- Draw while recording.
- Trim start/end.
- Extract frame to image editor.
- Combine a short recording with annotated stills in a bug report.

Why it matters:

CleanShot and Snagit both expand beyond still screenshots. For web development, short recordings are essential for animation, loading, hover, drag, scroll, and timing bugs.

### 11. AI-assisted annotation and explanation

Add optional AI workflows that operate on screenshots:

- Suggest likely sensitive regions to redact.
- Generate alt text.
- Summarize a screenshot for a PR comment.
- Explain an error screenshot or stack trace.
- Generate reproduction steps from step markers and OCR.
- Suggest callouts for changed or suspicious UI regions.
- Convert a detailed screenshot into simplified documentation graphics.

Why it matters:

Snagit is moving AI into redaction, step capture, smart move, text recognition, and simplification. For this app, AI should support developer communication and privacy, not generic novelty.

### 12. Component-aware capture for local web apps

Build a feature specifically for local web development:

- Browser extension or dev-server integration that captures the selected DOM node.
- Include selector, component name if available, route, viewport, DPR, CSS box metrics, and computed spacing.
- Overlay DOM box model guides onto the screenshot as editable measurement layers.
- Copy a "review packet" with screenshot plus metadata.
- Optional integration with Playwright screenshots for repeatable captures.

Why it matters:

This is the highest-upside differentiator. Shottr is pixel-focused; this app can become component-aware.

### 13. Capture presets and workflow automation

Add repeatable flows:

- Capture -> annotate -> copy.
- Capture -> redact -> safe copy.
- Capture -> beautify -> upload -> copy URL.
- Capture -> OCR -> copy text.
- Capture -> compare with previous -> export diff.
- Capture -> bug report -> copy GitHub Markdown.
- Per-workspace and per-destination presets.
- Command palette access to workflows.

Why it matters:

ShareX proves that workflow customization is powerful, but it can become complex. This app should offer opinionated presets first, then expose advanced automation behind a clean command model.

## Suggested Roadmap

### Phase 1: Make the current editor excellent

Focus:

- Multi-select, alignment, snapping, keyboard resize.
- Better measure/color/contrast inspection.
- Blur/secure redaction and safe export.
- Style presets, recent/custom colors, text/callout improvements.
- Export presets and background/canvas controls.
- PNGDATA tests and safe metadata controls.

Success criteria:

- A user can paste a screenshot, annotate precisely, redact safely, export for GitHub/Slack/docs, and reopen the editable artifact later.

### Phase 2: Capture and web-dev workflows

Focus:

- Browser extension or native capture bridge.
- Region/window/fullscreen/last region capture.
- Full-page and scroll-container capture.
- DOM-aware element capture and metadata.
- Quick-access overlay after capture.

Success criteria:

- A user can capture a local web app state and land in the editor with no manual OS screenshot step.

### Phase 3: Compare, extract, and share

Focus:

- OCR/QR/code extraction.
- Color and accessibility inspector.
- Before/after overlay, slider, and pixel diff.
- Bug-report builder.
- Upload destinations and custom webhooks.

Success criteria:

- A screenshot becomes a complete development artifact: annotated image, measurements, extracted text, privacy-safe export, and issue/PR-ready context.

### Phase 4: Native/power-user layer

Focus:

- Global hotkeys.
- Always-on-top pinning.
- Screen recording/GIF.
- Workflow presets and automation.
- Team/library features.

Success criteria:

- The app can replace Shottr/CleanShot-style workflows for daily development use while adding web-specific intelligence they do not have.

## Highest-Leverage Next Slice

If only one product slice is chosen next, build this:

1. Add secure redaction: blur, secure pixelate, metadata/PNGDATA-safe export.
2. Add color picker plus contrast readout.
3. Add measurement copy and improved edge/gap measurement.
4. Add export presets for GitHub/Slack/docs with background, padding, and scale.
5. Add PNGDATA round-trip tests and an "open saved image in editor" path.

This slice directly improves existing features, supports web-dev review, reduces privacy risk, and creates a quality baseline before capture and AI features expand the surface area.

## Sources

Local sources:

- `docs/prd/SCOPE.md`
- `docs/image-editor-initial-slice-work-summary.md`
- `docs/image-editor-ux-audit-work-summary.md`
- `docs/text-preview-editor-work-summary.md`
- `app/src/components/image-editor/ImageEditor.tsx`
- `app/src/components/image-editor/ImageEditorCanvas.tsx`
- `app/src/components/image-editor/ImageEditorToolbar.tsx`
- `app/src/components/image-editor/ImageEditorContextBar.tsx`
- `app/src/components/image-editor/ImageEditorSidebar.tsx`
- `app/src/components/image-editor/image-editor.render.ts`
- `app/src/components/image-editor/image-editor.measure.ts`
- `app/src/components/image-editor/image-editor.png-data.ts`
- `app/src/lib/image-editor/saved-images.ts`

External product sources:

- [Shottr official site and release notes](https://shottr.cc/)
- [CleanShot X all features](https://cleanshot.com/features)
- [ShareX official feature page](https://getsharex.com/)
- [ShareX custom uploader docs](https://getsharex.com/docs/custom-uploader.html)
- [Snagit official features](https://www.techsmith.com/snagit/features/)
