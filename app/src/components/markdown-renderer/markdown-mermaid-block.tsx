import {
  Show,
  createEffect,
  createSignal,
  onCleanup,
  splitProps,
} from "solid-js";
import { loadMermaid } from "./markdown-code-utils";
import { MarkdownMermaidActionTray } from "./markdown-mermaid-action-tray";
import { MarkdownMermaidDialog } from "./markdown-mermaid-dialog";
import { markdownStyles } from "./markdown-styles";
import { useMermaidViewport } from "./use-mermaid-viewport";
import type { JSX } from "solid-js";

type DialogOpenChangeDetails = {
  open?: boolean;
};

type MarkdownMermaidBlockProps = JSX.HTMLAttributes<HTMLPreElement> & {
  children?: JSX.Element;
  codeText: string;
  isHydrated: boolean;
};

export function MarkdownMermaidBlock(props: MarkdownMermaidBlockProps) {
  const [local, rest] = splitProps(props, [
    "children",
    "codeText",
    "isHydrated",
  ]);
  const [isCopied, setIsCopied] = createSignal(false);
  const [isDialogCopied, setIsDialogCopied] = createSignal(false);
  const [isDialogOpen, setIsDialogOpen] = createSignal(false);
  const [mermaidSvg, setMermaidSvg] = createSignal<string | null>(null);
  const [mermaidError, setMermaidError] = createSignal<string | null>(null);
  const copyTimeouts: number[] = [];
  const viewport = useMermaidViewport();

  const registerTimeout = (id: number) => {
    copyTimeouts.push(id);
  };

  createEffect(() => {
    const rawText = local.codeText;
    if (!rawText) {
      setMermaidSvg(null);
      setMermaidError(null);
      return;
    }

    let active = true;
    setMermaidError(null);
    console.log("Markdown:mermaid:renderStart", { length: rawText.length });
    void (async () => {
      try {
        const module = await loadMermaid();
        module.default.initialize({
          startOnLoad: false,
          securityLevel: "loose",
        });
        const renderId = `mermaid-${crypto.randomUUID()}`;
        const result = await module.default.render(renderId, rawText);
        if (!active) return;
        setMermaidSvg(result.svg);
        console.log("Markdown:mermaid:renderSuccess", { renderId });
      } catch (error) {
        if (!active) return;
        console.error("Markdown:mermaid:renderFailed", error);
        setMermaidError(String(error));
      }
    })();

    onCleanup(() => {
      active = false;
    });
  });

  onCleanup(() => {
    copyTimeouts.forEach((id) => window.clearTimeout(id));
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(local.codeText);
      setIsCopied(true);
      registerTimeout(
        window.setTimeout(() => {
          setIsCopied(false);
        }, 1500),
      );
    } catch (error) {
      console.error("Markdown:copyMermaidCode:error", error);
    }
  };

  const handleDialogCopy = async () => {
    try {
      await navigator.clipboard.writeText(local.codeText);
      setIsDialogCopied(true);
      registerTimeout(
        window.setTimeout(() => {
          setIsDialogCopied(false);
        }, 1500),
      );
    } catch (error) {
      console.error("Markdown:copyMermaidDialogCode:error", error);
    }
  };

  const handleDownload = () => {
    const svg = mermaidSvg();
    if (!svg) return;
    const blob = new Blob([svg], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mermaid-diagram.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDialogOpen = () => {
    console.log("Markdown:mermaid:openExpanded");
    setIsDialogOpen(true);
    viewport.scheduleFitToViewport();
  };

  const handleDialogOpenChange = (details: DialogOpenChangeDetails) => {
    if (typeof details?.open !== "boolean") return;
    console.log("Markdown:mermaid:openChange", details.open);
    setIsDialogOpen(details.open);
    if (details.open) {
      viewport.scheduleFitToViewport();
    }
  };

  return (
    <>
      <MarkdownMermaidDialog
        isOpen={isDialogOpen()}
        isCopied={isDialogCopied()}
        scale={viewport.state.scale}
        cursor={viewport.cursor()}
        transform={viewport.transform()}
        svg={mermaidSvg()}
        onOpenChange={handleDialogOpenChange}
        onCopy={handleDialogCopy}
        onDownload={handleDownload}
        onZoomOut={viewport.zoomOut}
        onFit={viewport.fitToViewport}
        onReset={viewport.reset}
        onZoomIn={viewport.zoomIn}
        onViewportRef={viewport.setViewportRef}
        onWheel={viewport.handleWheel}
        onPointerDown={viewport.handlePointerDown}
        onPointerMove={viewport.handlePointerMove}
        onPointerUp={viewport.handlePointerUp}
      />

      <Show when={local.isHydrated && mermaidSvg()}>
        <MarkdownMermaidActionTray
          isCopied={isCopied()}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onExpand={handleDialogOpen}
        />
      </Show>

      <Show
        when={mermaidSvg()}
        fallback={
          <pre class={markdownStyles.pre} {...rest}>
            {local.children}
          </pre>
        }
      >
        {(svg) => <div class={markdownStyles.mermaid} innerHTML={svg()} />}
      </Show>

      <Show when={mermaidError()}>
        {(value) => (
          <div class={markdownStyles.mermaidError}>
            Mermaid render failed: {value()}
          </div>
        )}
      </Show>
    </>
  );
}
