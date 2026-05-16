import { Show, splitProps } from "solid-js";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-solid";
import { Button } from "~/components/ui/button";
import { markdownStyles } from "./markdown-styles";

type MarkdownMermaidDialogActionsProps = {
  isCopied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
  onZoomIn: () => void;
};

export function MarkdownMermaidDialogActions(
  props: MarkdownMermaidDialogActionsProps,
) {
  const [local] = splitProps(props, [
    "isCopied",
    "onCopy",
    "onDownload",
    "onZoomOut",
    "onFit",
    "onReset",
    "onZoomIn",
  ]);

  return (
    <div class={markdownStyles.mermaidDialogHeaderActions}>
      <Button size="sm" variant="outline" onClick={local.onCopy}>
        <Show when={local.isCopied} fallback={<CopyIcon size={14} />}>
          <CheckIcon size={14} />
        </Show>
        {local.isCopied ? "Copied" : "Copy"}
      </Button>
      <Button size="sm" variant="outline" onClick={local.onDownload}>
        <DownloadIcon size={14} />
        Download
      </Button>
      <Button size="sm" variant="outline" onClick={local.onZoomOut}>
        <ZoomOutIcon size={14} />
      </Button>
      <Button size="sm" variant="outline" onClick={local.onFit}>
        Fit
      </Button>
      <Button size="sm" variant="outline" onClick={local.onReset}>
        Reset
      </Button>
      <Button size="sm" variant="outline" onClick={local.onZoomIn}>
        <ZoomInIcon size={14} />
      </Button>
    </div>
  );
}
