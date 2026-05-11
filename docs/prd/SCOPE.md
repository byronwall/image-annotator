Hi, here’s a detailed market scan centered on **Shottr** and **ShareX**, then a synthesized feature plan for a new screenshot app.

## Source notes

I prioritized official product/docs pages:

| App         |        Platform focus | Positioning                                                                               |
| ----------- | --------------------: | ----------------------------------------------------------------------------------------- |
| Shottr      |                 macOS | Fast, pixel-focused screenshot utility for designers, frontend engineers, and developers. |
| ShareX      |               Windows | Free/open-source power-user capture, upload, automation, and productivity tool.           |
| CleanShot X |                 macOS | Polished capture + recording + cloud sharing workflow.                                    |
| Snagit      |         macOS/Windows | Professional capture, editing, documentation, and AI-assisted workflow.                   |
| Lightshot   | macOS/Windows/browser | Fast, simple selected-area capture and sharing.                                           |
| Flameshot   |   Windows/macOS/Linux | Free/open-source, simple capture with strong in-place annotation.                         |
| Greenshot   |         Windows/macOS | Lightweight productivity-oriented capture, annotation, and export.                        |

Shottr’s page emphasizes lightweight performance, annotations, beautiful backgrounds, scrolling screenshots, and S3 uploads. It also lists advanced pixel-focused utilities like OCR/QR recognition, measurement, color picking, object removal, pinned screenshots, overlays, and screenshot combining. ([Shottr][1])

ShareX’s official page is much broader: capture modes, screen recording, GIF capture, scrolling capture, after-capture tasks, region tools, annotation tools, upload methods, after-upload tasks, custom uploader support, workflow automation, and many productivity utilities. ([ShareX][2])

---

# Exhaustive feature inventory

## Shottr feature inventory

- **Core positioning**
  - Tiny, fast native macOS screenshot app.
  - Built for designers, frontend engineers, mobile developers, and people who care about pixels.
  - Optimized for Apple Silicon.
  - Lightweight app size.
  - Very fast capture and preview latency. ([Shottr][1])

- **Capture**
  - Standard screenshot capture.
  - Long-page / scrolling screenshot capture.
    - Works for long web pages.
    - Works for chat conversations.
    - Advertised as working in “any app, any window.” ([Shottr][1])

  - Multi-screenshot canvas via **Combine Screenshots**.
    - Add multiple captures to one canvas.

  - Overlay image capture/editing.
    - Paste images on top of screenshots.
    - Make overlays semi-transparent.
    - Generate before/after two-frame animations. ([Shottr][1])

- **Annotation and markup**
  - Text.
  - Freehand drawing.
  - Highlights.
  - Spotlights.
  - Visual effects.
  - Rectangle/oval/arrow/text styling improvements in newer versions.
  - Hand-drawn annotation style.
  - Bendable arrows.
  - Configurable object snapping. ([Shottr][1])

- **Privacy / redaction**
  - Pixelate objects.
  - Remove objects.
  - Hide sensitive information.
  - Text mode that hides text without corrupting surrounding content. ([Shottr][1])

- **OCR / recognition**
  - OCR for non-selectable text.
  - Area selection hotkey for text parsing.
  - Copies recognized text to clipboard.
  - Reads QR codes. ([Shottr][1])

- **Design and presentation**
  - Beautiful backgrounds.
  - Gradient backgrounds.
  - Shadows.
  - Rounded corners.
  - Resize screenshots inside the app.
  - Zoom into screenshots.
  - Magnifier tool / zoomed-in callout. ([Shottr][1])

- **Pixel inspection / frontend tools**
  - Screen ruler.
  - Measure vertical size with arrow keys.
  - Measure horizontal size with arrow keys.
  - Imprint measurement onto screenshot.
  - Measure distance between objects.
  - Logical vs physical Retina pixel measurement.
  - Screen magnifier.
  - Color picker.
  - Copy color under cursor.
  - Copy text color from a 20×20 px area.
  - Copy average color of a selected area.
  - Smart monotone-object selection.
  - Smart selection auto-adjustment.
  - 1px / 10px keyboard nudge.
  - 1px / 10px keyboard resize. ([Shottr][1])

- **Reference / workspace features**
  - Pin screenshots as floating always-on-top borderless windows.
  - Use pinned screenshots as temporary storage or visual reference.
  - Dedicated screenshot save folder.
  - Quick zoom on selection.
  - Crop by selecting an area and pressing Enter.
  - Pan with mouse / keyboard shortcut. ([Shottr][1])

- **Export / upload**
  - S3 upload.
  - S3-compatible storage support.
  - Expanded support for providers like Tencent, Yandex, Minio, and other compatible services.
  - Upload image online and copy link, behind activation.
  - Save screenshots to a dedicated folder.
  - Print dialog support, including orientation changes. ([Shottr][1])

- **Product / platform**
  - macOS Catalina 10.15+ support.
  - Free use with occasional activation reminders.
  - One-time paid activation.
  - Telemetry can be turned off in preferences. ([Shottr][1])

---

## ShareX feature inventory

- **Core positioning**
  - Free.
  - Open source.
  - No ads.
  - Lightweight.
  - Long-running active development.
  - Designed for power users.
  - Quick screen capture and sharing.
  - Easy GIF recording.
  - Wide destination support.
  - Advanced custom uploader support.
  - Customizable workflow system. ([ShareX][2])

- **Capture methods**
  - Fullscreen.
  - Active window.
  - Active monitor.
  - Window menu.
  - Monitor menu.
  - Region.
  - Region Light.
  - Region Transparent.
  - Last region.
  - Custom region.
  - Screen recording.
  - Screen recording as GIF.
  - Scrolling capture.
  - Auto capture. ([ShareX][2])

- **Scrolling capture**
  - Captures full webpages or documents extending beyond the visible screen.
  - Automatically combines multiple screenshots into one image.
  - Can be triggered from the Capture menu.
  - Can be bound to a custom hotkey.
  - Starts after region selection.
  - Scrolls and captures until the end of the scrollable content. ([ShareX][3])

- **Region capture**
  - Rectangle region.
  - Ellipse region.
  - Freehand region.
  - Multi-region workflow support.
  - Keyboard-assisted region movement.
  - Proportional resizing.
  - Snap selection to preset sizes.
  - Switch between last region and last drawing tool.
  - Capture specific monitor by number.
  - Active monitor capture.
  - Fullscreen capture from region mode.
  - Magnifier size control with mouse wheel. ([ShareX][4])

- **Annotation tools**
  - Rectangle.
  - Ellipse.
  - Freehand.
  - Freehand arrow.
  - Line.
  - Arrow.
  - Text with outline.
  - Text with background.
  - Speech balloon.
  - Step marker.
  - Magnify.
  - Image from file.
  - Image from screen.
  - Sticker.
  - Cursor.
  - Smart eraser.
  - Blur.
  - Pixelate.
  - Highlight.
  - Crop image.
  - Cut out. ([ShareX][2])

- **After-capture tasks**
  - Show quick task menu.
  - Show after-capture window.
  - Beautify image.
  - Add image effects.
  - Open in image editor.
  - Copy image to clipboard.
  - Pin to screen.
  - Print image.
  - Save image to file.
  - Save image as.
  - Save thumbnail image to file.
  - Perform actions.
  - Copy file to clipboard.
  - Copy file path to clipboard.
  - Show file in Explorer.
  - Scan QR code.
  - Recognize text with OCR.
  - Show before-upload window.
  - Upload image to host.
  - Delete local file. ([ShareX][2])

- **Image effects / beautification**
  - Downloadable `.sxie` image effects.
  - Effects can be enabled and edited.
  - Effects can be automatically applied after every screenshot.
  - Examples include background gradients, borders, OS-themed effects, taskbar effects, and decorative styles. ([ShareX][5])

- **Upload methods**
  - Upload file.
  - Upload folder.
  - Upload from clipboard.
  - Upload text.
  - Upload from URL.
  - Drag-and-drop upload.
  - Shorten URL.
  - Tweet message.
  - Watch folder. ([ShareX][2])

- **After-upload tasks**
  - Show after-upload window.
  - Shorten URL.
  - Share URL.
  - Copy URL to clipboard.
  - Open URL.
  - Show QR code window. ([ShareX][2])

- **Custom uploader system**
  - Upload images, text, and files to hosting services.
  - Shorten URLs.
  - Share URLs.
  - Support self-hosted services.
  - Custom request URL.
  - Custom parameter values.
  - Custom header values.
  - Custom body arguments.
  - Response URL parsing.
  - Thumbnail URL parsing.
  - Deletion URL parsing.
  - Error message parsing.
  - Response parsing using raw response, response URL, headers, JSONPath, regex, XML, and input substitution. ([ShareX][6])

- **Workflow automation**
  - Customizable workflow system.
  - After-capture task chains.
  - After-upload task chains.
  - Hotkey-driven actions.
  - Watch-folder automation.
  - External actions after capture/upload. ([ShareX][2])

- **Productivity tools**
  - Color picker.
  - Screen color picker.
  - Ruler.
  - Pin to screen.
  - Image editor.
  - Image beautifier.
  - Image effects.
  - Image viewer.
  - Image combiner.
  - Image splitter.
  - Image thumbnailer.
  - Video converter.
  - Video thumbnailer.
  - OCR.
  - QR code.
  - Hash checker.
  - Metadata viewer.
  - Directory indexer.
  - Clipboard viewer.
  - Borderless window.
  - Inspect window.
  - Monitor test. ([ShareX][2])

- **Distribution / platform**
  - Windows-oriented.
  - Installer.
  - Portable build.
  - Development build.
  - Microsoft Store distribution.
  - Steam distribution.
  - Source available on GitHub. ([ShareX][2])

---

## Other popular app feature patterns

### CleanShot X

- **Capture / annotation**
  - Screenshot capture.
  - Annotation.
  - Scrolling capture.
  - Capture any scrollable content.
  - Works in every app. ([CleanShot][7])

- **Recording**
  - Screen recording.
  - Save as video or optimized GIF.
  - Webcam overlay.
  - Microphone and macOS audio recording.
  - Mouse click and keystroke highlighting.
  - Auto-hide notifications.
  - Built-in trimming. ([CleanShot][7])

- **Presentation**
  - Background tool.
  - Included backgrounds.
  - Custom background support.
  - Social-media-ready visuals. ([CleanShot][7])

- **Utility**
  - OCR / text recognition.
  - Pin screenshots.
  - Resize and opacity controls for pinned screenshots.
  - Hide desktop icons.
  - Self-timer.
  - Retina scale-down.
  - Crosshair mode.
  - Custom wallpaper for screenshots/recordings.
  - Workflow customization. ([CleanShot][7])

- **Cloud / teams**
  - Upload and get a link in one click.
  - CleanShot Cloud.
  - Custom domain and branding on Pro.
  - Team management on Pro. ([CleanShot][7])

### Snagit

- **Capture**
  - Screen capture.
  - Screen recording.
  - Scrolling capture.
  - Delayed screenshots.
  - Custom capture presets.
  - Custom keyboard shortcuts.
  - Webcam capture.
  - Menu and object capture.
  - Exact capture dimensions.
  - Time-lapse capture.
  - Multiple-area capture.
  - Printer capture. ([TechSmith][8])

- **Recording**
  - Cursor highlight.
  - Animated clicks.
  - Draw while recording.
  - Webcam video.
  - Picture-in-picture recording.
  - Webcam shape editing.
  - Swap between screen and webcam.
  - Video from images.
  - Combine clips.
  - Trim video.
  - Create GIFs.
  - Capture video frames.
  - Microphone and system audio. ([TechSmith][8])

- **AI / smart editing**
  - AI step capture.
  - AI smart redact.
  - AI background noise removal.
  - AI image simplification.
  - Smart move for detected UI elements.
  - Text recognition.
  - AI background remover. ([TechSmith][8])

- **Annotation / documentation**
  - Arrows.
  - Callouts.
  - Shapes.
  - Step tool.
  - Stamps.
  - Spotlight.
  - Magnify.
  - Capture info.
  - Templates.
  - Quick styles and themes. ([TechSmith][8])

- **Editing**
  - Crop.
  - Resize.
  - Rotate.
  - Cut out.
  - Borders.
  - Edge effects.
  - Blur.
  - Remove or edit screenshot text.
  - Simplified graphics for documentation. ([TechSmith][8])

### Lightshot

- **Core**
  - Fast selected-area screenshot.
  - Two-click capture flow.
  - Simple UI.
  - Upload screenshot and get a short link.
  - Edit immediately or later in online editor.
  - Similar-image search from selected screen content.
  - Windows, Mac, Chrome, Firefox, IE, and Opera support. ([app.prntscr.com][9])

### Flameshot

- **Core**
  - Free/open-source.
  - Cross-platform.
  - Simple capture by dragging a selection box.
  - In-place annotation before saving. ([Flameshot][10])

- **Customization**
  - Interface color.
  - Button selection.
  - Keyboard shortcuts.
  - Save behavior.
  - Accessible configuration dialog. ([Flameshot][10])

- **Annotation**
  - Arrow.
  - Highlight.
  - Blur.
  - Pixelate.
  - Text.
  - Free drawing.
  - Rectangle border.
  - Circle border.
  - Incrementing counter.
  - Solid color box. ([Flameshot][10])

- **Sharing / automation**
  - Upload directly to Imgur.
  - Copy/share URL.
  - CLI.
  - Scriptable behavior.
  - Usable in key bindings.
  - DBus interface. ([Flameshot][10])

### Greenshot

- **Capture**
  - Selected region.
  - Window.
  - Fullscreen.
  - Last region.
  - Scrolling web page capture for Internet Explorer. ([Wikipedia][11])

- **Editing**
  - Built-in image editor.
  - Rectangles.
  - Ellipses.
  - Lines.
  - Arrows.
  - Freehand drawing.
  - Text.
  - Highlight.
  - Blur.
  - Pixelize.
  - Tool settings such as line color/thickness and shadows. ([Wikipedia][11])

- **Export**
  - Copy to clipboard.
  - Print.
  - Save to file with user-defined filename pattern.
  - Attach to email.
  - Dynamic destination picker.
  - Plugins for Microsoft Office, Paint.NET, Dropbox, JIRA, and other destinations. ([Wikipedia][11])

---

# Synthesis: product feature set for your new app

Below is the feature map I’d use for a serious new screenshot app. It blends:

- Shottr’s **fast, pixel-perfect, designer/dev utility** angle.
- ShareX’s **workflow automation and uploader power**.
- CleanShot’s **polished Mac-like UX and sharing flow**.
- Snagit’s **documentation and AI-assisted editing**.
- Flameshot/Greenshot/Lightshot’s **fast, simple capture-first ergonomics**.

## 1. Capture system

- **Basic capture modes**
  - Region capture.
    - Rectangle.
    - Freeform.
    - Fixed aspect ratio.
    - Fixed dimensions.
    - Last region.
    - Multi-region capture.

  - Window capture.
    - Active window.
    - Hover-to-select window.
    - Specific app window.
    - Window-with-shadow option.
    - Window-without-shadow option.

  - Screen capture.
    - Fullscreen.
    - Active monitor.
    - Specific monitor.
    - All monitors.

  - Menu/object capture.
    - Dropdown menus.
    - Context menus.
    - Tooltips.
    - Popovers.
    - Dialogs.

  - Delayed capture.
    - 3s / 5s / 10s presets.
    - Custom delay.
    - Countdown overlay.

  - Repeat capture.
    - Last region.
    - Last window.
    - Scheduled interval.
    - Time-lapse capture.

- **Advanced capture modes**
  - Scrolling capture.
    - Web pages.
    - Documents.
    - Chats.
    - Code panes.
    - Tables.
    - Horizontal scrolling for spreadsheets.
    - Manual stitch correction.
    - Auto-stitch preview.

  - Multi-step process capture.
    - Click tracking.
    - Automatic step numbering.
    - Generate guide from clicks.

  - Clipboard capture.
    - Create editable screenshot from clipboard image.
    - Create screenshot from copied HTML/image content.

  - Camera/webcam still capture.
  - OCR-only area capture.
  - QR/barcode-only area capture.

- **Capture UX**
  - Crosshair with pixel dimensions.
  - Magnifier around cursor.
  - Edge snapping.
  - Window snapping.
  - UI-element snapping.
  - Preset sizes.
    - Social post sizes.
    - App Store sizes.
    - Browser viewport sizes.
    - Device screenshot sizes.

  - Keyboard nudging.
    - Move selection by 1px.
    - Move selection by 10px.
    - Resize by 1px.
    - Resize by 10px.

  - Capture cursor toggle.
  - Hide desktop icons toggle.
  - Hide notifications while capturing.
  - Temporary clean wallpaper.
  - Capture sound toggle.

## 2. Screen recording

- **Recording modes**
  - Region recording.
  - Window recording.
  - Fullscreen recording.
  - Active monitor recording.
  - Webcam-only recording.
  - Picture-in-picture webcam recording.
  - GIF recording.
  - Short clip recording.

- **Audio**
  - Microphone audio.
  - System audio.
  - Separate audio tracks.
  - Mute mic shortcut.
  - Noise reduction.
  - Audio level meter.

- **Recording overlays**
  - Cursor highlight.
  - Click animation.
  - Keystroke display.
  - Draw while recording.
  - Step markers while recording.
  - Webcam shape options.
    - Circle.
    - Rounded rectangle.
    - Square.

  - Webcam background blur.
  - Virtual webcam background.
  - Auto-hide notifications.

- **Recording editing**
  - Trim start/end.
  - Cut middle sections.
  - Combine clips.
  - Export frame as image.
  - Convert video to GIF.
  - Optimize GIF size.
  - Compress video.
  - Add intro/outro frame.
  - Add watermark/branding.
  - Generate share link.

## 3. Annotation and markup

- **Core drawing tools**
  - Arrow.
  - Bendable arrow.
  - Line.
  - Rectangle.
  - Rounded rectangle.
  - Ellipse.
  - Freehand pen.
  - Highlighter.
  - Spotlight.
  - Magnifier callout.
  - Blur.
  - Pixelate.
  - Smart eraser.
  - Crop.
  - Cut out.
  - Text.
  - Text with background.
  - Text with outline.
  - Speech bubble.
  - Callout with pointer.
  - Step marker.
  - Stickers.
  - Cursor marker.
  - Emoji/stamps.

- **Editing behavior**
  - Non-destructive annotation layers.
  - Editable objects after save.
  - Object snapping.
  - Alignment guides.
  - Smart distribute.
  - Bring forward/send backward.
  - Group/ungroup.
  - Copy/paste annotations.
  - Reusable annotation styles.
  - Recent colors.
  - Brand palette.
  - Arrow/shape presets.
  - Hand-drawn style.
  - Professional style.
  - Low-fidelity wireframe style.

- **Privacy tools**
  - Blur selected area.
  - Pixelate selected area.
  - Remove object / content-aware fill.
  - Smart redact.
    - Detect emails.
    - Detect names.
    - Detect phone numbers.
    - Detect API keys.
    - Detect tokens.
    - Detect credit cards.
    - Detect addresses.

  - Redaction verification warning.
    - “This is destructive and cannot be recovered.”

  - Metadata stripping.
  - Local-only privacy mode.
  - Disable cloud upload per capture.

## 4. Pixel, design, and frontend-dev tools

- **Measurement**
  - Screen ruler.
  - Distance between objects.
  - Element dimensions.
  - Logical vs physical pixels.
  - Retina scale awareness.
  - CSS pixel readout.
  - Device pixel ratio readout.
  - Annotate measurements onto screenshot.
  - Measure spacing between detected UI elements.

- **Inspection**
  - Magnifier.
  - Color picker.
  - Copy HEX.
  - Copy RGB.
  - Copy HSL.
  - Copy CSS variable-ish format.
  - Copy average color from selected area.
  - Copy darkest text color near cursor.
  - Palette extraction from screenshot.
  - Contrast ratio checker.
  - WCAG pass/fail indicator.
  - Font/OCR-assisted text inspection.
  - UI element detection.
  - Compare two screenshots.

- **Comparison / QA**
  - Overlay two screenshots.
  - Adjustable opacity.
  - Difference highlighting.
  - Before/after animation.
  - Pixel diff mode.
  - Side-by-side mode.
  - Slider comparison mode.
  - Export comparison artifact.
  - Bug-report template generation.

## 5. OCR, QR, and content extraction

- **OCR**
  - Select area and copy text.
  - Full screenshot OCR.
  - Preserve line breaks.
  - Preserve table-ish layout.
  - Copy as Markdown.
  - Copy as plain text.
  - Copy as JSON.
  - Search text inside screenshot history.
  - Local OCR option.
  - Cloud OCR option for better accuracy.

- **QR / barcode**
  - Detect QR codes.
  - Decode QR from selected area.
  - Decode QR from full screenshot.
  - Generate QR for uploaded URL.
  - Show QR after upload.
  - Barcode detection.
  - Copy decoded value.
  - Open decoded URL safely.

- **Structured extraction**
  - Extract table from screenshot.
  - Extract list from screenshot.
  - Extract code block from screenshot.
  - Detect programming language.
  - Copy code as text.
  - Optional formatting cleanup.

## 6. Screenshot presentation / beautification

- **Backgrounds**
  - Solid backgrounds.
  - Gradient backgrounds.
  - Image backgrounds.
  - Custom wallpaper.
  - Brand backgrounds.
  - Transparent background.
  - Social-media presets.

- **Framing**
  - Rounded corners.
  - Shadows.
  - Borders.
  - Browser frame.
  - Device frame.
  - macOS window frame.
  - Windows window frame.
  - Terminal frame.
  - Padding/margins.
  - Auto-center on canvas.
  - Resize canvas.

- **Output polish**
  - Watermark.
  - Logo.
  - Caption.
  - Title.
  - Auto-generated alt text.
  - Compress for web.
  - Retina scale-down.
  - Export @1x/@2x/@3x.
  - Export for Slack/GitHub/Jira/Linear/Notion.

## 7. Pinning, reference, and workspace

- **Pinned screenshots**
  - Always-on-top image windows.
  - Borderless mode.
  - Resize.
  - Opacity.
  - Click-through mode.
  - Lock position.
  - Multiple pinned screenshots.
  - Collapse to thumbnail.
  - Temporary shelf.

- **Workspace**
  - Screenshot tray.
  - Recent captures.
  - Drag captures into editor.
  - Combine captures into canvas.
  - Split image.
  - Image viewer.
  - Lightweight gallery.
  - Search by OCR text.
  - Tags.
  - Favorites.
  - Project folders.
  - Auto-clean old screenshots.

## 8. Export and sharing

- **Local export**
  - Copy image to clipboard.
  - Copy file to clipboard.
  - Copy file path.
  - Save to file.
  - Save as.
  - Auto-save.
  - Custom filename pattern.
  - Save thumbnail.
  - Print.
  - Open containing folder.
  - Drag image out of app.
  - Export PNG.
  - Export JPG.
  - Export WebP.
  - Export SVG for annotations where possible.
  - Export PDF.
  - Export GIF.
  - Export MP4/WebM.

- **Cloud upload**
  - One-click upload.
  - Copy link after upload.
  - Short link.
  - Expiring link.
  - Password-protected link.
  - Private/public toggle.
  - Deletion URL.
  - Thumbnail URL.
  - Custom domain.
  - Team branding.
  - View analytics.
  - Disable downloads.
  - Commenting.
  - Link revocation.

- **Destinations**
  - Built-in app cloud.
  - S3.
  - S3-compatible storage.
  - Cloudflare R2.
  - Google Cloud Storage.
  - Azure Blob.
  - FTP/SFTP.
  - WebDAV.
  - Imgur.
  - Dropbox.
  - Google Drive.
  - OneDrive.
  - GitHub issues.
  - GitLab issues.
  - Jira.
  - Linear.
  - Slack.
  - Discord.
  - Microsoft Teams.
  - Notion.
  - Email.
  - Custom webhook.
  - Custom uploader.

## 9. Automation and workflows

- **Hotkeys**
  - Global hotkeys.
  - Per-action hotkeys.
  - Per-preset hotkeys.
  - Conflict detection.
  - Import/export hotkey profile.

- **Presets**
  - Capture preset.
  - Annotation preset.
  - Export preset.
  - Upload preset.
  - Workflow preset.
  - Per-app preset.
  - Per-monitor preset.

- **Workflow chains**
  - After capture:
    - Open editor.
    - Copy to clipboard.
    - Save.
    - Beautify.
    - OCR.
    - Redact.
    - Upload.
    - Pin.
    - Print.
    - Run external action.

  - Before upload:
    - Confirm.
    - Strip metadata.
    - Compress.
    - Apply watermark.
    - Apply privacy scan.

  - After upload:
    - Copy URL.
    - Shorten URL.
    - Show QR.
    - Open URL.
    - Post to webhook.
    - Delete local file.

  - Conditional workflows:
    - If GIF, save locally.
    - If image, upload.
    - If work profile, use company S3.
    - If personal profile, use local-only.

- **Advanced automation**
  - Watch folder.
  - CLI.
  - URL scheme.
  - Apple Shortcuts support.
  - Windows command palette integration.
  - Shell context menu.
  - Drag-and-drop upload target.
  - API for plugins.
  - Scriptable post-processing.
  - JSON workflow config.
  - Import/export settings.

## 10. AI-assisted features

- **Capture intelligence**
  - Detect UI elements.
  - Snap to UI element.
  - Auto-crop to content.
  - Auto-straighten.
  - Auto-remove empty margins.
  - Detect duplicate screenshots.

- **Editing intelligence**
  - Smart redact.
  - Background removal.
  - Object removal.
  - Text removal.
  - Move detected UI elements.
  - Simplify UI into documentation-friendly shapes.
  - Generate alt text.
  - Generate screenshot title.
  - Generate changelog-style caption.
  - Generate bug-report summary.
  - Generate step-by-step guide from captures.
  - Generate release-note image from screenshot.

- **Developer-specific AI**
  - Extract code from screenshot.
  - Explain error screenshot.
  - Detect stack trace.
  - Parse browser console errors.
  - Create GitHub issue draft.
  - Create Jira/Linear ticket draft.
  - Identify likely component/selector from UI screenshot.
  - Compare screenshot to previous version and summarize differences.

## 11. Collaboration and team features

- **Shared assets**
  - Team workspace.
  - Shared screenshot library.
  - Shared brand styles.
  - Shared annotation presets.
  - Shared export presets.
  - Shared upload destinations.

- **Review**
  - Comments on screenshot.
  - Region comments.
  - Mentions.
  - Resolve threads.
  - Reactions.
  - Approval stamps.
  - Version history.
  - Before/after comparisons.
  - Link access control.

- **Admin**
  - Team management.
  - Roles.
  - SSO.
  - Audit log.
  - Retention policy.
  - Domain restriction.
  - Default privacy settings.
  - Disable public links.
  - Enforce metadata stripping.
  - Enforce local-only mode for sensitive teams.

## 12. File management and history

- **Library**
  - Recent captures.
  - Search.
  - OCR text search.
  - Filter by app/window.
  - Filter by date.
  - Filter by tag.
  - Filter by upload status.
  - Filter by media type.
  - Favorites.
  - Archive.
  - Trash.

- **Organization**
  - Project folders.
  - Auto-folder by app.
  - Auto-folder by date.
  - Auto-folder by workflow.
  - Custom naming templates.
  - Duplicate detection.
  - Bulk delete.
  - Bulk export.
  - Bulk upload.
  - Bulk metadata strip.

- **Metadata**
  - View capture metadata.
  - Strip metadata.
  - Add capture info overlay.
  - Include OS/app/window/date.
  - Hash/checksum.
  - File size.
  - Dimensions.
  - Color profile.

## 13. Platform and native integration

- **macOS**
  - Native menu bar app.
  - Apple Silicon optimized.
  - Shortcuts integration.
  - Finder extension.
  - Quick Look support.
  - Screen recording permission helper.
  - Hide desktop icons.
  - Custom wallpaper during capture.
  - Retina-aware scaling.

- **Windows**
  - System tray app.
  - Portable build.
  - Microsoft Store build.
  - Shell context menu.
  - Explorer “Send to.”
  - Snipping Tool replacement hotkey.
  - Multi-monitor DPI handling.
  - Window/object capture.

- **Linux**
  - Wayland support.
  - X11 support.
  - AppImage.
  - Flatpak.
  - Snap.
  - Package-manager builds.
  - DBus interface.
  - CLI-first support.

- **Browser extension**
  - Page capture.
  - Element capture.
  - Full-page capture.
  - DOM-aware screenshot.
  - Copy selector.
  - Capture hidden overflow areas.
  - Send to desktop editor.

## 14. Settings, personalization, and ergonomics

- **Customization**
  - Toolbar customization.
  - Annotation tool order.
  - Default save path.
  - Default export format.
  - Default upload destination.
  - Default background.
  - Default shadow/corner radius.
  - Default redaction style.
  - Theme.
  - Accent color.
  - Compact mode.
  - Power-user mode.
  - Beginner mode.

- **Accessibility**
  - Keyboard-only capture.
  - Screen-reader-friendly controls.
  - High-contrast annotation colors.
  - Large handles.
  - Reduced motion.
  - Configurable cursor size.
  - Accessible color palette warnings.

- **Reliability**
  - Offline mode.
  - Upload retry.
  - Upload queue.
  - Failed upload recovery.
  - Local backup before upload.
  - Crash recovery.
  - Autosave drafts.
  - Undo/redo history.

## 15. Security and privacy

- **Privacy controls**
  - Local-only mode.
  - Per-capture upload confirmation.
  - Auto-strip EXIF/metadata.
  - Sensitive data detection.
  - Redaction warning.
  - Private-by-default links.
  - Expiring links.
  - Password-protected links.
  - Disable telemetry.
  - Transparent telemetry settings.

- **Enterprise controls**
  - SSO.
  - SCIM.
  - Admin policy.
  - Data retention.
  - Audit logs.
  - Region selection.
  - Bring-your-own-storage.
  - S3/R2/GCS storage.
  - Self-hosted upload endpoint.
  - Encryption at rest.
  - Encryption in transit.
  - Legal hold / eDiscovery export.

---

# Recommended MVP

For a focused v1, I’d avoid trying to clone ShareX completely. Build the opinionated center first:

- **Fast capture**
  - Region, window, fullscreen, last region, scrolling capture.
  - Excellent keyboard/mouse ergonomics.
  - Pixel-perfect selection, magnifier, and snapping.

- **Best-in-class annotation**
  - Arrows, text, shapes, blur, pixelate, crop, step markers, spotlight, magnify.
  - Non-destructive editable annotations.
  - Beautiful default styles.

- **Designer/dev utilities**
  - Ruler.
  - Color picker.
  - OCR.
  - QR decode.
  - Screenshot overlay/diff.
  - Pinned screenshots.

- **Polished sharing**
  - Copy image.
  - Save file.
  - Upload and copy link.
  - S3-compatible upload.
  - Custom webhook/uploader.

- **Presentation**
  - Gradients.
  - Rounded corners.
  - Shadows.
  - Device/browser frames.
  - Social export presets.

- **Workflow presets**
  - Capture → annotate → copy.
  - Capture → beautify → upload → copy URL.
  - Capture → OCR → copy text.
  - Capture → redact → upload.
  - Capture → pin.

# Differentiators worth betting on

- **“Screenshot app for builders”**
  - Pixel ruler.
  - CSS-ready color picking.
  - UI diff.
  - Component/spacing measurement.
  - OCR-to-Markdown.
  - Bug-report generation.

- **“Private by default”**
  - Local-first.
  - Explicit upload.
  - Metadata stripping.
  - Smart redaction.
  - Bring-your-own-storage.

- **“Beautiful without effort”**
  - Great default annotations.
  - One-click backgrounds.
  - Smart crop.
  - Auto-padding.
  - Export presets for Slack, GitHub, Linear, docs, and social.

- **“Power-user workflows without ShareX complexity”**
  - Presets and automation.
  - But keep the core UI simple.
  - Hide advanced workflow builder behind a command palette or settings screen.

[1]: https://shottr.cc/ "Shottr – Screenshot Annotation App For Mac"
[2]: https://getsharex.com/ "ShareX - The best free and open source screenshot tool for Windows"
[3]: https://getsharex.com/docs/scrolling-screenshot "Scrolling screenshot - ShareX"
[4]: https://getsharex.com/docs/region-capture "Region capture - ShareX"
[5]: https://getsharex.com/image-effects "Image effects - ShareX"
[6]: https://getsharex.com/docs/custom-uploader "Custom uploader - ShareX"
[7]: https://cleanshot.com/ "CleanShot X for Mac"
[8]: https://www.techsmith.com/snagit/features/ "Snagit Features - Screen Capture and Editing Tools | TechSmith"
[9]: https://app.prntscr.com/ "Lightshot — screenshot tool for Mac & Win"
[10]: https://flameshot.org/ "Flameshot | Open Source Screenshot Software"
[11]: https://en.wikipedia.org/wiki/Greenshot?utm_source=chatgpt.com "Greenshot"
