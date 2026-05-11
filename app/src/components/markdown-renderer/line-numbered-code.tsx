import { splitProps, type JSX } from "solid-js";
import { markdownStyles } from "./markdown-styles";
import { toLineWrappedPlainTextHtml } from "./markdown-code-utils";

type LineNumberedCodeProps = JSX.HTMLAttributes<HTMLElement> & {
  language: string;
  codeText: string;
  highlightedHtml?: string | null;
};

export function LineNumberedCode(props: LineNumberedCodeProps) {
  const [local, rest] = splitProps(props, [
    "language",
    "codeText",
    "highlightedHtml",
    "class",
  ]);

  const lineCount = () => {
    const text = local.codeText.replace(/\r?\n$/, "");
    return text ? text.split(/\r?\n/).length : 1;
  };

  const maxLineDigits = () => String(Math.max(1, lineCount())).length;

  const renderedHtml = () => {
    if (local.highlightedHtml) return local.highlightedHtml;
    return toLineWrappedPlainTextHtml(local.codeText);
  };

  const className = () => {
    if (local.class) return `${markdownStyles.blockCode} ${local.class}`;
    return markdownStyles.blockCode;
  };

  return (
    <code
      class={className()}
      data-md-language={local.language}
      style={{ "--md-code-line-digits": String(maxLineDigits()) }}
      {...rest}
    >
      <span innerHTML={renderedHtml()} />
    </code>
  );
}
