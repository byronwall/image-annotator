# Markdown Renderer Usage

This repo includes a reusable markdown rendering module at:

- `app/src/components/markdown-renderer/`

Main entry:

- `app/src/components/markdown-renderer/MarkdownRenderer.tsx`

## Basic Usage

```tsx
import { MarkdownRenderer } from "~/components/markdown-renderer";

type Props = {
  markdown: string;
};

export function ArticleBody(props: Props) {
  return <MarkdownRenderer>{props.markdown}</MarkdownRenderer>;
}
```

## Typical Page Section Wrapper

Wrap the renderer in your layout/container styles. The renderer handles markdown element mapping internally.

```tsx
import { Box } from "styled-system/jsx";
import { MarkdownRenderer } from "~/components/markdown-renderer";

export function MarkdownSection(props: { content: string }) {
  return (
    <Box maxW="4xl" mx="auto">
      <MarkdownRenderer>{props.content}</MarkdownRenderer>
    </Box>
  );
}
```

## Built-In Behavior

- `remark-gfm` enabled (tables, task lists, strikethrough).
- Heading IDs + anchor links are auto-added.
- Code blocks:
  - line numbers
  - Shiki highlighting
  - copy/download actions
  - expandable drawer view
- Mermaid blocks:
  - auto-detected from code fences/content
  - rendered diagrams
  - zoom/pan + expanded dialog

## Usage Notes

- The Vite config already includes the required optimize-deps entries for `solid-markdown`.
- Keep markdown-related customizations inside `app/src/components/markdown-renderer/` so renderer logic, styles, and utilities stay co-located.
- If you need custom markdown element behavior, extend `markdownComponents` in:
  - `app/src/components/markdown-renderer/markdown-components.tsx`

## Optional Direct Imports

When you need lower-level pieces:

```tsx
import {
  MarkdownRenderer,
  markdownComponents,
  markdownStyles,
} from "~/components/markdown-renderer";
```
