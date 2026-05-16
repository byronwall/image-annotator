import type { SolidMarkdownComponents } from "solid-markdown";
import { Link } from "~/components/ui/link";
import { Text } from "~/components/ui/text";
import { MarkdownCode } from "./markdown-code";
import { MarkdownHeading } from "./markdown-heading";
import { MarkdownPre } from "./markdown-pre";
import { markdownStyles } from "./markdown-styles";
import { markdownTableComponents } from "./markdown-table-components";

export const markdownComponents = {
  h1: (props) => (
    <MarkdownHeading as="h1" headingClass={markdownStyles.h1} {...props} />
  ),
  h2: (props) => (
    <MarkdownHeading as="h2" headingClass={markdownStyles.h2} {...props} />
  ),
  h3: (props) => (
    <MarkdownHeading as="h3" headingClass={markdownStyles.h3} {...props} />
  ),
  p: (props) => <Text class={markdownStyles.p} {...props} />,
  a: (props) => <Link class={markdownStyles.a} {...props} />,
  ul: (props) => <ul class={markdownStyles.ul} {...props} />,
  ol: (props) => <ol class={markdownStyles.ol} {...props} />,
  li: (props) => <li class={markdownStyles.li} {...props} />,
  blockquote: (props) => (
    <blockquote class={markdownStyles.blockquote} {...props} />
  ),
  pre: MarkdownPre,
  code: MarkdownCode,
  ...markdownTableComponents,
} satisfies SolidMarkdownComponents;
