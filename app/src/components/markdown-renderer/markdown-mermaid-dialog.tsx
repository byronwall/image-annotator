import { Show, splitProps } from "solid-js";
import { XIcon } from "lucide-solid";
import * as Dialog from "~/components/ui/dialog";
import { MarkdownMermaidDialogActions } from "./markdown-mermaid-dialog-actions";
import { markdownStyles } from "./markdown-styles";
import type { JSX } from "solid-js";

type DialogOpenChangeDetails = {
  open?: boolean;
};

type MarkdownMermaidDialogProps = {
  isOpen: boolean;
  isCopied: boolean;
  scale: number;
  cursor: string;
  transform: string;
  svg: string | null;
  onOpenChange: (details: DialogOpenChangeDetails) => void;
  onCopy: () => void;
  onDownload: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
  onZoomIn: () => void;
  onViewportRef: (element: HTMLDivElement) => void;
  onWheel: JSX.EventHandler<HTMLDivElement, WheelEvent>;
  onPointerDown: JSX.EventHandler<HTMLDivElement, PointerEvent>;
  onPointerMove: JSX.EventHandler<HTMLDivElement, PointerEvent>;
  onPointerUp: JSX.EventHandler<HTMLDivElement, PointerEvent>;
};

export function MarkdownMermaidDialog(props: MarkdownMermaidDialogProps) {
  const [local] = splitProps(props, [
    "isOpen",
    "isCopied",
    "scale",
    "cursor",
    "transform",
    "svg",
    "onOpenChange",
    "onCopy",
    "onDownload",
    "onZoomOut",
    "onFit",
    "onReset",
    "onZoomIn",
    "onViewportRef",
    "onWheel",
    "onPointerDown",
    "onPointerMove",
    "onPointerUp",
  ]);

  return (
    <Dialog.Root open={local.isOpen} onOpenChange={local.onOpenChange}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content class={markdownStyles.mermaidDialogContent}>
          <Dialog.Header class={markdownStyles.mermaidDialogHeader}>
            <div class={markdownStyles.mermaidDialogHeaderTop}>
              <Dialog.Title>Mermaid Diagram</Dialog.Title>
              <MarkdownMermaidDialogActions
                isCopied={local.isCopied}
                onCopy={local.onCopy}
                onDownload={local.onDownload}
                onZoomOut={local.onZoomOut}
                onFit={local.onFit}
                onReset={local.onReset}
                onZoomIn={local.onZoomIn}
              />
            </div>
            <Dialog.Description class={markdownStyles.mermaidDialogDescription}>
              Scroll to zoom • drag to pan • {Math.round(local.scale * 100)}%
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.CloseTrigger aria-label="Close expanded mermaid diagram">
            <XIcon />
          </Dialog.CloseTrigger>
          <Dialog.Body class={markdownStyles.mermaidDialogBody}>
            <div
              ref={local.onViewportRef}
              class={markdownStyles.mermaidDialogViewport}
              style={{ cursor: local.cursor }}
              onWheel={(event) => local.onWheel(event)}
              onPointerDown={(event) => local.onPointerDown(event)}
              onPointerMove={(event) => local.onPointerMove(event)}
              onPointerUp={(event) => local.onPointerUp(event)}
              onPointerCancel={(event) => local.onPointerUp(event)}
            >
              <Show when={local.svg}>
                {(svg) => (
                  <div class={markdownStyles.mermaidDialogCanvas}>
                    <div
                      class={markdownStyles.mermaidDialogPanZoom}
                      style={{ transform: local.transform }}
                      innerHTML={svg()}
                    />
                  </div>
                )}
              </Show>
            </div>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
