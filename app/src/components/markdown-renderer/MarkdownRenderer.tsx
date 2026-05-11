import { SolidMarkdown } from "solid-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "./markdown-components";

type MarkdownRendererProps = {
  children?: string | null;
};

export function MarkdownRenderer(props: MarkdownRendererProps) {
  return (
    <SolidMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {props.children ?? ""}
    </SolidMarkdown>
  );
}
