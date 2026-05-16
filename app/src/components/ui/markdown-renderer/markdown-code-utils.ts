import { codeToHtml } from "shiki";
import type * as MermaidModule from "mermaid";

const SHIKI_THEME = "github-light";

type MermaidImport = typeof MermaidModule;
let mermaidModulePromise: Promise<MermaidImport> | null = null;

export function isBlockCode(className: unknown, inlineProp: unknown): boolean {
  const hasLanguageClass =
    typeof className === "string" && /language-\w+/.test(className);
  if (typeof inlineProp === "boolean") {
    return !inlineProp;
  }
  return hasLanguageClass;
}

function wrapCodeLines(raw: string): string {
  const normalized = raw.replace(/\r?\n$/, "");
  const lines = normalized.split("\n");
  return lines
    .map((line, index) => {
      const value = line.length > 0 ? line : " ";
      return `<span class="code-line" data-line="${index + 1}">${value}</span>`;
    })
    .join("");
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function toLineWrappedPlainTextHtml(codeText: string): string {
  const normalized = codeText.replace(/\r?\n$/, "");
  const lines = normalized.split("\n");
  const escaped = lines.map((line) => escapeHtml(line));
  return wrapCodeLines(escaped.join("\n"));
}

export function toLineWrappedHighlightedHtml(codeInnerHtml: string): string {
  return wrapCodeLines(codeInnerHtml);
}

export async function getShikiHighlightedCode(
  code: string,
  language: string,
): Promise<string | null> {
  try {
    const html = await codeToHtml(code, { lang: language, theme: SHIKI_THEME });
    const match = /<code[^>]*>([\s\S]*)<\/code>/.exec(html);
    if (!match?.[1]) return null;
    return toLineWrappedHighlightedHtml(match[1]);
  } catch {
    return null;
  }
}

export async function loadMermaid(): Promise<MermaidImport> {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import("mermaid");
  }
  return mermaidModulePromise;
}

export function looksLikeMermaid(code: string): boolean {
  const firstLine = code
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (!firstLine) return false;
  return /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|quadrantChart|requirementDiagram|c4Context|c4Container|c4Component|c4Dynamic|c4Deployment)\b/.test(
    firstLine,
  );
}
