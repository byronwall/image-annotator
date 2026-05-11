import { css } from "styled-system/css";
import { Box, VStack } from "styled-system/jsx";
import { MarkdownRenderer } from "~/components/markdown-renderer/MarkdownRenderer";

const buildCodeBlock = (lineCount: number) =>
  Array.from({ length: lineCount }, (_, index) => {
    const value = index + 1;
    return `const row${value.toString().padStart(3, "0")} = { id: ${value}, label: "Item ${value}" };`;
  }).join("\n");

const tenLineCode = buildCodeBlock(10);
const hundredLineCode = buildCodeBlock(100);

const markdownSample = `
# Markdown Renderer Reference

This page showcases the renderer features used across the app: headings, emphasis, links, lists, tables, block quotes, inline code, fenced code blocks, and Mermaid diagrams.

## Text Features

Regular paragraph text with **bold**, _italic_, ~~strikethrough~~, and \`inline code\`.

- Bullet item one
- Bullet item two
  - Nested bullet item
  - Another nested bullet item

1. Ordered item one
2. Ordered item two
3. Ordered item three

- [x] Completed task
- [ ] Pending task

> Blockquote example: markdown should stay readable with strong contrast and predictable spacing.

---

## Link

[SolidStart docs](https://docs.solidjs.com/solid-start)

## Table

| Name | Type | Description |
| --- | --- | --- |
| \`id\` | \`number\` | Unique identifier |
| \`title\` | \`string\` | Human-friendly label |
| \`createdAt\` | \`string\` | ISO timestamp |

## Code Block (10 LOC)

\`\`\`ts
${tenLineCode}
\`\`\`

## Code Block (100 LOC)

\`\`\`ts
${hundredLineCode}
\`\`\`

## JSON

\`\`\`json
{
  "component": "MarkdownRenderer",
  "supports": ["gfm", "tables", "task-lists", "code-blocks", "mermaid"],
  "lineCounts": [10, 100]
}
\`\`\`

## Mermaid

\`\`\`mermaid
flowchart TD
  A[User opens Comps Explorer] --> B[Select Markdown Renderer]
  B --> C[Render sample markdown]
  C --> D[Verify headings, tables, and code blocks]
  D --> E[Inspect long code behavior]
\`\`\`
`.trim();

export const MarkdownRendererPlayground = () => {
  return (
    <VStack alignItems="stretch" gap="4">
      <Box textStyle={{ base: "xl", md: "2xl" }} fontWeight="semibold">
        Markdown Renderer
      </Box>
      <Box textStyle="sm" color="fg.muted">
        Reference usage of <code>MarkdownRenderer</code> with a broad markdown
        sample, including 10-line and 100-line code blocks.
      </Box>
      <Box
        borderWidth="1px"
        borderColor="border"
        borderRadius="l2"
        bg="bg.default"
        p={{ base: "3", md: "4" }}
      >
        <div class={css({ width: "full", minW: "0" })}>
          <MarkdownRenderer>{markdownSample}</MarkdownRenderer>
        </div>
      </Box>
    </VStack>
  );
};
