import {
  Match,
  Switch,
  createSignal,
  onMount,
  splitProps,
  type JSX,
} from "solid-js";
import { looksLikeMermaid } from "./markdown-code-utils";
import { MarkdownCodeBlock } from "./markdown-code-block";
import { MarkdownMermaidBlock } from "./markdown-mermaid-block";
import { parseLanguage } from "./markdown-utils";
import { markdownStyles } from "./markdown-styles";

type MarkdownPreMode = "pending" | "code" | "mermaid";

type MarkdownPreProps = JSX.HTMLAttributes<HTMLPreElement> & {
  children?: JSX.Element;
};

export function MarkdownPre(preProps: MarkdownPreProps) {
  const [local, rest] = splitProps(preProps, ["children", "class"]);
  const [isHydrated, setIsHydrated] = createSignal(false);
  const [mode, setMode] = createSignal<MarkdownPreMode>("pending");
  const [codeLanguage, setCodeLanguage] = createSignal("text");
  const [codeText, setCodeText] = createSignal("");
  let preRef: HTMLPreElement | undefined;

  onMount(() => {
    setIsHydrated(true);
    if (!preRef) return;

    const codeElement = preRef.querySelector("code");
    const explicitLanguage = codeElement?.getAttribute("data-md-language");
    const language =
      explicitLanguage && explicitLanguage.trim().length > 0
        ? explicitLanguage
        : parseLanguage(codeElement?.className, preRef.className);
    const rawText =
      codeElement?.getAttribute("data-md-raw") ?? preRef.textContent ?? "";
    const nextMode =
      language === "mermaid" || looksLikeMermaid(rawText) ? "mermaid" : "code";

    console.log("MarkdownPre:detectedMode", {
      language,
      nextMode,
      textLength: rawText.length,
    });
    setCodeLanguage(language);
    setCodeText(rawText.replace(/\r?\n$/, ""));
    setMode(nextMode);
  });

  return (
    <div class={markdownStyles.preWrapper}>
      <Switch>
        <Match when={mode() === "pending"}>
          <pre class={markdownStyles.pre} {...rest} ref={preRef}>
            {local.children}
          </pre>
        </Match>
        <Match when={mode() === "code"}>
          <MarkdownCodeBlock
            {...rest}
            codeLanguage={codeLanguage()}
            codeText={codeText()}
            isHydrated={isHydrated()}
          >
            {local.children}
          </MarkdownCodeBlock>
        </Match>
        <Match when={mode() === "mermaid"}>
          <MarkdownMermaidBlock
            {...rest}
            codeText={codeText()}
            isHydrated={isHydrated()}
          >
            {local.children}
          </MarkdownMermaidBlock>
        </Match>
      </Switch>
    </div>
  );
}
