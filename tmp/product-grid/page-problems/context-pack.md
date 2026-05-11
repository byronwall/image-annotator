# Context Pack: Problems

Project: image-annotation-real
Root node: page-problems
Nodes: 10

# Node Context: Problems

Path: Problems
Status: implemented
Type: page

## Ancestor Requirements

None.

## Current Node

### Problems

ID: page-problems
Type: page
Status: implemented

Metadata:
- implementation: Resolved all tracked Problems children: fixed viewport/sidebar overflow, compact top-docked style controls, fixed-size inline text editing, off-canvas expansion, full-area panning, clickable hover affordances, and edge resize handles/cursors.

Context:
none

Raw context:
none

Images: none

## Implementation Notes For Agent

# Node Context: Do not allow overflow on main image area - left sidebar should scroll on its own

Path: Problems > Do not allow overflow on main image area - left sidebar should scroll on its own
Status: implemented
Type: page

## Ancestor Requirements

### Problems

ID: page-problems
Type: page
Status: implemented

Metadata:
- implementation: Resolved all tracked Problems children: fixed viewport/sidebar overflow, compact top-docked style controls, fixed-size inline text editing, off-canvas expansion, full-area panning, clickable hover affordances, and edge resize handles/cursors.

Context:
none

Raw context:
none

Images: none

## Current Node

### Do not allow overflow on main image area - left sidebar should scroll on its own

ID: page-do-not-allow-overflow-on-main-image-area-left-sidebar-should-scroll-on-its-own
Type: page
Status: implemented

Metadata:
none

Context:
none

Raw context:
none

Images: image.png

## Implementation Notes For Agent

- Use inherited context from ancestor nodes.

# Node Context: Need a subtle hover interaction on things that are clickable, box shadow + cursor

Path: Problems > Need a subtle hover interaction on things that are clickable, box shadow + cursor
Status: implemented
Type: page

## Ancestor Requirements

### Problems

ID: page-problems
Type: page
Status: implemented

Metadata:
- implementation: Resolved all tracked Problems children: fixed viewport/sidebar overflow, compact top-docked style controls, fixed-size inline text editing, off-canvas expansion, full-area panning, clickable hover affordances, and edge resize handles/cursors.

Context:
none

Raw context:
none

Images: none

## Current Node

### Need a subtle hover interaction on things that are clickable, box shadow + cursor

ID: page-need-a-subtle-hover-interaction-on-things-that-are-clickable
Type: page
Status: implemented

Metadata:
- implementation: Added pointer and subtle hover shadow/border affordances to custom clickable layer rows and color swatches; shared buttons already use pointer cursors.

Context:
none

Raw context:
none

Images: none

## Implementation Notes For Agent

- Use inherited context from ancestor nodes.

# Node Context: Need to be able to create text outside of image bounds = expand

Path: Problems > Need to be able to create text outside of image bounds = expand
Status: planned
Type: page

## Ancestor Requirements

### Problems

ID: page-problems
Type: page
Status: implemented

Metadata:
- implementation: Resolved all tracked Problems children: fixed viewport/sidebar overflow, compact top-docked style controls, fixed-size inline text editing, off-canvas expansion, full-area panning, clickable hover affordances, and edge resize handles/cursors.

Context:
none

Raw context:
none

Images: none

## Current Node

### Need to be able to create text outside of image bounds = expand

ID: page-need-to-be-able-to-create-text-outside-of-image-bounds-expand
Type: page
Status: planned

Metadata:
none

Context:
none

Raw context:
none

Images: none

## Implementation Notes For Agent

- This node has no direct context.
- Use inherited context from ancestor nodes.

# Node Context: New text node adds as "text" and requires second action to edit -- need to edit in place on creation without default text

Path: Problems > New text node adds as "text" and requires second action to edit -- need to edit in place on creation without default text
Status: planned
Type: page

## Ancestor Requirements

### Problems

ID: page-problems
Type: page
Status: implemented

Metadata:
- implementation: Resolved all tracked Problems children: fixed viewport/sidebar overflow, compact top-docked style controls, fixed-size inline text editing, off-canvas expansion, full-area panning, clickable hover affordances, and edge resize handles/cursors.

Context:
none

Raw context:
none

Images: none

## Current Node

### New text node adds as "text" and requires second action to edit -- need to edit in place on creation without default text

ID: page-new-text-node-adds-as-text-and-requires-second-action-to-edit-need-to-edit-in-place-on-creation-without-default-text
Type: page
Status: planned

Metadata:
none

Context:
none

Raw context:
none

Images: image.png

## Implementation Notes For Agent

- Use inherited context from ancestor nodes.

# Node Context: Rect and other resizes should support cursor changes and resize on edges (not just corners)

Path: Problems > Rect and other resizes should support cursor changes and resize on edges (not just corners)
Status: implemented
Type: page

## Ancestor Requirements

### Problems

ID: page-problems
Type: page
Status: implemented

Metadata:
- implementation: Resolved all tracked Problems children: fixed viewport/sidebar overflow, compact top-docked style controls, fixed-size inline text editing, off-canvas expansion, full-area panning, clickable hover affordances, and edge resize handles/cursors.

Context:
none

Raw context:
none

Images: none

## Current Node

### Rect and other resizes should support cursor changes and resize on edges (not just corners)

ID: page-rect-and-other-resizes-should-support-cursor-changes-and-resize-on-edges-not-just-corners
Type: page
Status: implemented

Metadata:
none

Context:
none

Raw context:
none

Images: none

## Implementation Notes For Agent

- This node has no direct context.
- Use inherited context from ancestor nodes.

# Node Context: Text controls are very "in the way" - should probably dock to top toolbar, need a very compact single line thing as overlay

Path: Problems > Text controls are very "in the way" - should probably dock to top toolbar, need a very compact single line thing as overlay
Status: implemented
Type: page

## Ancestor Requirements

### Problems

ID: page-problems
Type: page
Status: implemented

Metadata:
- implementation: Resolved all tracked Problems children: fixed viewport/sidebar overflow, compact top-docked style controls, fixed-size inline text editing, off-canvas expansion, full-area panning, clickable hover affordances, and edge resize handles/cursors.

Context:
none

Raw context:
none

Images: none

## Current Node

### Text controls are very "in the way" - should probably dock to top toolbar, need a very compact single line thing as overlay

ID: page-text-controls-are-very-in-the-way
Type: page
Status: implemented

Metadata:
- implementation: Reworked the annotation style controls into a compact single-line strip docked at the top of the image area instead of floating over the selected text.

Context:
none

Raw context:
none

Images: image.png

## Implementation Notes For Agent

- Use inherited context from ancestor nodes.

# Node Context: Text input grows -- really want to just "edit in place"

Path: Problems > Text input grows -- really want to just "edit in place"
Status: planned
Type: page

## Ancestor Requirements

### Problems

ID: page-problems
Type: page
Status: implemented

Metadata:
- implementation: Resolved all tracked Problems children: fixed viewport/sidebar overflow, compact top-docked style controls, fixed-size inline text editing, off-canvas expansion, full-area panning, clickable hover affordances, and edge resize handles/cursors.

Context:
none

Raw context:
none

Images: none

## Current Node

### Text input grows -- really want to just "edit in place"

ID: page-text-input-grows-really-want-to-just-edit-in-place
Type: page
Status: planned

Metadata:
none

Context:
Resolution note:

Resolved: text editing is explicit inline editing via Enter/double click, with a fixed inline textarea instead of a growing control.

Raw context:
none

Images: image.png

## Implementation Notes For Agent

- Use inherited context from ancestor nodes.

# Node Context: Using the pen outside of the current image bounds does not expand image to include it

Path: Problems > Using the pen outside of the current image bounds does not expand image to include it
Status: implemented
Type: page

## Ancestor Requirements

### Problems

ID: page-problems
Type: page
Status: implemented

Metadata:
- implementation: Resolved all tracked Problems children: fixed viewport/sidebar overflow, compact top-docked style controls, fixed-size inline text editing, off-canvas expansion, full-area panning, clickable hover affordances, and edge resize handles/cursors.

Context:
none

Raw context:
none

Images: none

## Current Node

### Using the pen outside of the current image bounds does not expand image to include it

ID: page-using-the-pen-outside-of-the-current-image-bounds-does-not-expand-image-to-include-it
Type: page
Status: implemented

Metadata:
- implementation: Project expansion now handles annotations beyond all canvas edges, shifting annotations and base-image offsets when drawing extends left or upward.

Context:
none

Raw context:
none

Images: image.png

## Implementation Notes For Agent

- Use inherited context from ancestor nodes.

# Node Context: Zoom is great, pan is not so -- need to pan with middle mouse regardless of scroll bars and other stuff, middle mouse = PAN IMAGE AROUND

Path: Problems > Zoom is great, pan is not so -- need to pan with middle mouse regardless of scroll bars and other stuff, middle mouse = PAN IMAGE AROUND
Status: implemented
Type: page

## Ancestor Requirements

### Problems

ID: page-problems
Type: page
Status: implemented

Metadata:
- implementation: Resolved all tracked Problems children: fixed viewport/sidebar overflow, compact top-docked style controls, fixed-size inline text editing, off-canvas expansion, full-area panning, clickable hover affordances, and edge resize handles/cursors.

Context:
none

Raw context:
none

Images: none

## Current Node

### Zoom is great, pan is not so -- need to pan with middle mouse regardless of scroll bars and other stuff, middle mouse = PAN IMAGE AROUND

ID: page-zoom-is-great-pan-is-not-so-need-to-pan-with-middle-mouse-regardless-of-scroll-bars-and-other-stuff-middle-mouse-pan-image-around
Type: page
Status: implemented

Metadata:
none

Context:
none

Raw context:
none

Images: none

## Implementation Notes For Agent

- This node has no direct context.
- Use inherited context from ancestor nodes.
