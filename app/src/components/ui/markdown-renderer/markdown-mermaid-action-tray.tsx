import { Show, splitProps } from "solid-js";
import { CheckIcon, CopyIcon, DownloadIcon, ExpandIcon } from "lucide-solid";
import { markdownStyles } from "./markdown-styles";

type MarkdownMermaidActionTrayProps = {
  isCopied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onExpand: () => void;
};

export function MarkdownMermaidActionTray(
  props: MarkdownMermaidActionTrayProps,
) {
  const [local] = splitProps(props, [
    "isCopied",
    "onCopy",
    "onDownload",
    "onExpand",
  ]);

  return (
    <div class={markdownStyles.codeActionTray}>
      <button
        type="button"
        class={markdownStyles.copyButton}
        data-code-action="true"
        onClick={() => local.onCopy()}
      >
        <Show when={local.isCopied} fallback={<CopyIcon size={14} />}>
          <CheckIcon size={14} />
        </Show>
        <span>{local.isCopied ? "Copied" : "Copy"}</span>
      </button>
      <button
        type="button"
        class={markdownStyles.expandIconButton}
        data-code-action="true"
        aria-label="Download mermaid diagram"
        title="Download SVG"
        onClick={() => local.onDownload()}
      >
        <DownloadIcon size={14} />
      </button>
      <button
        type="button"
        class={markdownStyles.expandIconButton}
        data-code-action="true"
        aria-label="Open expanded mermaid diagram"
        title="Expand diagram"
        onClick={() => local.onExpand()}
      >
        <ExpandIcon size={14} />
      </button>
    </div>
  );
}
