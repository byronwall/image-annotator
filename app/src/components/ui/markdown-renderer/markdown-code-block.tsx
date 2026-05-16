import {
  Show,
  createSignal,
  onCleanup,
  onMount,
  splitProps,
  type JSX,
} from "solid-js";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExpandIcon,
  XIcon,
} from "lucide-solid";
import * as Drawer from "~/components/ui/drawer";
import { Button } from "~/components/ui/button";
import { HighlightedLineNumberedCode } from "./highlighted-line-numbered-code";
import { CODE_BLOCK_COLLAPSED_HEIGHT, markdownStyles } from "./markdown-styles";

type MarkdownCodeBlockProps = JSX.HTMLAttributes<HTMLPreElement> & {
  children?: JSX.Element;
  codeText: string;
  codeLanguage: string;
  isHydrated: boolean;
};

export function MarkdownCodeBlock(props: MarkdownCodeBlockProps) {
  const [local, rest] = splitProps(props, [
    "children",
    "codeText",
    "codeLanguage",
    "isHydrated",
  ]);
  const [isCollapsed, setIsCollapsed] = createSignal(true);
  const [needsCollapse, setNeedsCollapse] = createSignal(false);
  const [isCopied, setIsCopied] = createSignal(false);
  const [isDrawerCopied, setIsDrawerCopied] = createSignal(false);
  const timeoutIds: number[] = [];
  let preRef: HTMLPreElement | undefined;

  onMount(() => {
    if (!preRef) return;
    if (preRef.scrollHeight > CODE_BLOCK_COLLAPSED_HEIGHT) {
      setNeedsCollapse(true);
    }
  });

  onCleanup(() => {
    timeoutIds.forEach((id) => window.clearTimeout(id));
  });

  const registerTimeout = (id: number) => {
    timeoutIds.push(id);
  };

  const lineCount = () => {
    const normalized = local.codeText.replace(/\r?\n$/, "");
    return normalized ? normalized.split(/\r?\n/).length : 1;
  };

  const lineCountLabel = () => {
    const count = lineCount();
    return count === 1 ? "1 line" : `${count} lines`;
  };

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
      console.error("Markdown:copyCode:error", error);
    }
  };

  const handleDrawerCopy = async () => {
    try {
      await navigator.clipboard.writeText(local.codeText);
      setIsDrawerCopied(true);
      registerTimeout(
        window.setTimeout(() => {
          setIsDrawerCopied(false);
        }, 1500),
      );
    } catch (error) {
      console.error("Markdown:copyDrawerCode:error", error);
    }
  };

  const fileExtension = () => {
    const language = local.codeLanguage.toLowerCase();
    if (language === "bash" || language === "shell" || language === "sh") {
      return "sh";
    }
    if (language === "typescript") return "ts";
    if (language === "javascript") return "js";
    if (language === "tsx") return "tsx";
    if (language === "jsx") return "jsx";
    if (language === "python") return "py";
    if (language === "markdown" || language === "md") return "md";
    if (language === "json") return "json";
    if (language === "html") return "html";
    if (language === "css") return "css";
    if (!language || language === "text") return "txt";
    return language;
  };

  const handleDownload = () => {
    const blob = new Blob([local.codeText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `code-snippet.${fileExtension()}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const preClass = () => {
    if (needsCollapse() && isCollapsed()) {
      return `${markdownStyles.pre} ${markdownStyles.preCollapsed}`;
    }
    return markdownStyles.pre;
  };

  return (
    <>
      <Drawer.Root placement="end" size="full">
        <Show when={local.isHydrated}>
          <div class={markdownStyles.codeActionTray}>
            <button
              type="button"
              class={markdownStyles.copyButton}
              data-code-action="true"
              onClick={handleCopy}
            >
              <Show when={isCopied()} fallback={<CopyIcon size={14} />}>
                <CheckIcon size={14} />
              </Show>
              <span>{isCopied() ? "Copied" : "Copy"}</span>
            </button>
            <Drawer.Trigger
              asChild={(triggerProps) => (
                <button
                  {...triggerProps()}
                  type="button"
                  class={markdownStyles.expandIconButton}
                  data-code-action="true"
                  aria-label="Open full code view"
                  title="Expand code"
                >
                  <ExpandIcon size={14} />
                </button>
              )}
            />
          </div>
        </Show>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content class={markdownStyles.codeDrawerContent}>
            <Drawer.Header class={markdownStyles.codeDrawerHeader}>
              <div class={markdownStyles.codeDrawerHeaderTop}>
                <Drawer.Title>Code Viewer</Drawer.Title>
                <div class={markdownStyles.codeDrawerHeaderActions}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDrawerCopy}
                  >
                    <Show
                      when={isDrawerCopied()}
                      fallback={<CopyIcon size={14} />}
                    >
                      <CheckIcon size={14} />
                    </Show>
                    {isDrawerCopied() ? "Copied" : "Copy"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownload}>
                    <DownloadIcon size={14} />
                    Download
                  </Button>
                </div>
              </div>
              <Drawer.Description class={markdownStyles.codeDrawerDescription}>
                {lineCount()} lines • {local.codeLanguage}
              </Drawer.Description>
            </Drawer.Header>
            <Drawer.CloseTrigger aria-label="Close full code view">
              <XIcon />
            </Drawer.CloseTrigger>
            <Drawer.Body class={markdownStyles.codeDrawerBody}>
              <div class={markdownStyles.codeDrawerScroll}>
                <pre class={markdownStyles.codeDrawerPre}>
                  <HighlightedLineNumberedCode
                    language={local.codeLanguage}
                    codeText={local.codeText}
                  />
                </pre>
              </div>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>

      <pre class={preClass()} {...rest} ref={preRef}>
        {local.children}
      </pre>

      <Show when={local.isHydrated && needsCollapse() && isCollapsed()}>
        <div class={markdownStyles.fadeOverlay} />
      </Show>
      <Show when={local.isHydrated && needsCollapse()}>
        <button
          type="button"
          class={markdownStyles.expandButton}
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          {isCollapsed() ? `Show more • ${lineCountLabel()}` : "Show less"}
        </button>
      </Show>
    </>
  );
}
