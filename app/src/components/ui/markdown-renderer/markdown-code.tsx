import { children, createMemo, Show, splitProps, type JSX } from "solid-js";
import { normalizeCodeText, parseLanguage } from "./markdown-utils";
import { isBlockCode } from "./markdown-code-utils";
import { HighlightedLineNumberedCode } from "./highlighted-line-numbered-code";
import { markdownStyles } from "./markdown-styles";

type MarkdownCodeProps = JSX.HTMLAttributes<HTMLElement> & {
  node?: unknown;
  inline?: boolean;
  className?: string;
  children?: JSX.Element;
};

export function MarkdownCode(codeProps: MarkdownCodeProps) {
  const [local, rest] = splitProps(codeProps, [
    "children",
    "node",
    "class",
    "className",
    "inline",
  ]);
  const resolvedChildren = children(() => local.children);
  const codeText = createMemo(() =>
    normalizeCodeText(resolvedChildren(), local.node),
  );
  const languageClass = createMemo(() => local.class ?? local.className);
  const isBlock = createMemo(() => isBlockCode(languageClass(), local.inline));
  const language = createMemo(() => parseLanguage(languageClass()));

  return (
    <Show
      when={isBlock()}
      fallback={
        <code class={markdownStyles.inlineCode} {...rest}>
          {codeText()}
        </code>
      }
    >
      <HighlightedLineNumberedCode
        {...rest}
        language={language()}
        codeText={codeText()}
        data-md-raw={codeText()}
      />
    </Show>
  );
}
