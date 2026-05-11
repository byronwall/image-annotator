# Context Pack: Problems

Project: image-annotation-real
Root node: page-problems
Nodes: 7

# Node Context: Problems

Path: Problems
Status: planned
Type: page

## Ancestor Requirements

None.

## Current Node

### Problems

ID: page-problems
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
- No direct or inherited context is available; inspect nearby nodes or ask for clarification before broad changes.

# Node Context: Arrow head is goofy looking - adjust shapes

Path: Problems > Arrow head is goofy looking - adjust shapes
Status: implemented
Type: page

## Ancestor Requirements

### Problems

ID: page-problems
Type: page
Status: planned

Metadata:
none

Context:
none

Raw context:
none

Images: none

## Current Node

### Arrow head is goofy looking - adjust shapes

ID: page-arrow-head-is-goofy-looking-adjust-shapes
Type: page
Status: implemented

Metadata:
- implementation: Adjusted arrow rendering to stop the shaft before a smaller centered triangular head and expanded arrow bounds for selection/export.

Context:
none

Raw context:
none

Images: image.png

## Implementation Notes For Agent

# Node Context: Doing "copy PNG" and then starting with that context pasted loses all the steps?  They should be available in the PNGDATA.

Path: Problems > Doing "copy PNG" and then starting with that context pasted loses all the steps?  They should be available in the PNGDATA.
Status: implemented
Type: page

## Ancestor Requirements

### Problems

ID: page-problems
Type: page
Status: planned

Metadata:
none

Context:
none

Raw context:
none

Images: none

## Current Node

### Doing "copy PNG" and then starting with that context pasted loses all the steps?  They should be available in the PNGDATA.

ID: page-doing-copy-png-and-then-starting-with-that-context-pasted-loses-all-the-steps-they-should-be-available-in-the-pngdata
Type: page
Status: implemented

Metadata:
- implementation: Copy PNG now writes a PNGDATA text fallback, and paste restores it with full history/step entries when clipboard PNG chunks are stripped.

Context:
none

Raw context:
none

Images: none

## Implementation Notes For Agent

# Node Context: I still see a scroll bar on the main image viewer... should be no overflow, instead we use middle mouse pan to move around

Path: Problems > I still see a scroll bar on the main image viewer... should be no overflow, instead we use middle mouse pan to move around
Status: implemented
Type: page

## Ancestor Requirements

### Problems

ID: page-problems
Type: page
Status: planned

Metadata:
none

Context:
none

Raw context:
none

Images: none

## Current Node

### I still see a scroll bar on the main image viewer... should be no overflow, instead we use middle mouse pan to move around

ID: page-i-still-see-a-scroll-bar-on-the-main-image-viewer-should-be-no-overflow-instead-we-use-middle-mouse-pan-to-move-around
Type: page
Status: implemented

Metadata:
- implementation: The main viewer now hides visible overflow/scrollbars while keeping wheel zoom and middle/space drag panning through programmatic scroll.

Context:
none

Raw context:
none

Images: image.png

## Implementation Notes For Agent

# Node Context: Image crop shows a grey area when being dragged out - need to just show a border -- also we need some way to change/review the crop without undoing and drawing again -- some comp that shows the pre-crop state with the crop boundary so it can be moved.

Path: Problems > Image crop shows a grey area when being dragged out - need to just show a border -- also we need some way to change/review the crop without undoing and drawing again -- some comp that shows the pre-crop state with the crop boundary so it can be moved.
Status: implemented
Type: page

## Ancestor Requirements

### Problems

ID: page-problems
Type: page
Status: planned

Metadata:
none

Context:
none

Raw context:
none

Images: none

## Current Node

### Image crop shows a grey area when being dragged out - need to just show a border -- also we need some way to change/review the crop without undoing and drawing again -- some comp that shows the pre-crop state with the crop boundary so it can be moved.

ID: page-image-crop-shows-a-grey-area-when-being-dragged-out-need-to-just-show-a-border-also-we-need-some-way-to-change-review-the-crop-without-undoing-and-drawing-again-some-comp-that-shows-the-pre-crop-state-with-the-crop-boundary-so-it-can-be-moved
Type: page
Status: implemented

Metadata:
- implementation: Crop now previews as a border-only movable/resizable draft with Apply crop and Cancel controls before committing the crop.

Context:
none

Raw context:
none

Images: none

## Implementation Notes For Agent

# Node Context: Text preview needs to match the styles it will use when rendered -- still feels like a random text box being rendered

Path: Problems > Text preview needs to match the styles it will use when rendered -- still feels like a random text box being rendered
Status: implemented
Type: page

## Ancestor Requirements

### Problems

ID: page-problems
Type: page
Status: planned

Metadata:
none

Context:
none

Raw context:
none

Images: none

## Current Node

### Text preview needs to match the styles it will use when rendered -- still feels like a random text box being rendered

ID: page-text-preview-needs-to-match-the-styles-it-will-use-when-rendered-still-feels-like-a-random-text-box-being-rendered
Type: page
Status: implemented

Metadata:
- implementation: Matched inline text editing preview to the canvas text renderer: shared metrics, scaled font/padding/background styles, and hidden canvas duplicate while editing.

Context:
none

Raw context:
none

Images: image.png, image.png

## Implementation Notes For Agent

# Node Context: We should increase the size of the image viewport as objects drag around outside it -- do not wait until mouse release to update

Path: Problems > We should increase the size of the image viewport as objects drag around outside it -- do not wait until mouse release to update
Status: implemented
Type: page

## Ancestor Requirements

### Problems

ID: page-problems
Type: page
Status: planned

Metadata:
none

Context:
none

Raw context:
none

Images: none

## Current Node

### We should increase the size of the image viewport as objects drag around outside it -- do not wait until mouse release to update

ID: page-we-should-increase-the-size-of-the-image-viewport-as-objects-drag-around-outside-it-do-not-wait-until-mouse-release-to-update
Type: page
Status: implemented

Metadata:
- implementation: Move, resize, keyboard nudge, and non-crop drawing flows now expand project bounds live instead of waiting for mouse release/commit.

Context:
none

Raw context:
none

Images: none

## Implementation Notes For Agent
