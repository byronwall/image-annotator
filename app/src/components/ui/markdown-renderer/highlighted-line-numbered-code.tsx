import {
  createEffect,
  createSignal,
  onCleanup,
  splitProps,
  type JSX,
} from "solid-js";
import { getShikiHighlightedCode } from "./markdown-code-utils";
import { LineNumberedCode } from "./line-numbered-code";

type HighlightedLineNumberedCodeProps = JSX.HTMLAttributes<HTMLElement> & {
  language: string;
  codeText: string;
};

export function HighlightedLineNumberedCode(
  props: HighlightedLineNumberedCodeProps,
) {
  const [local, rest] = splitProps(props, ["language", "codeText"]);
  const [highlightedHtml, setHighlightedHtml] = createSignal<string | null>(
    null,
  );

  createEffect(() => {
    const language = local.language;
    const codeText = local.codeText;

    if (!codeText || language === "mermaid") {
      setHighlightedHtml(null);
      return;
    }

    let active = true;
    getShikiHighlightedCode(codeText, language)
      .then((value) => {
        if (!active) return;
        setHighlightedHtml(value);
      })
      .catch(() => {
        if (!active) return;
        setHighlightedHtml(null);
      });

    onCleanup(() => {
      active = false;
    });
  });

  return (
    <LineNumberedCode
      {...rest}
      language={local.language}
      codeText={local.codeText}
      highlightedHtml={highlightedHtml()}
    />
  );
}
