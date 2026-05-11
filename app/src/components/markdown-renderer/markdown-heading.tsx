import { onMount, splitProps, type ComponentProps } from "solid-js";
import { Heading } from "~/components/ui/heading";
import { toHeadingId } from "./markdown-utils";
import { markdownStyles } from "./markdown-styles";

type MarkdownHeadingProps = ComponentProps<typeof Heading> & {
  headingClass: string;
};

function enhanceHeading(headingEl: HTMLElement) {
  const headingText = headingEl.textContent?.trim() ?? "";
  if (!headingText) return;
  const headingId = toHeadingId(headingText);
  if (!headingId) return;
  headingEl.setAttribute("id", headingId);

  const existingAnchor = headingEl.querySelector(
    "[data-heading-anchor='true']",
  );
  if (existingAnchor) return;

  const anchor = document.createElement("a");
  anchor.setAttribute("href", `#${headingId}`);
  anchor.setAttribute("aria-label", "Link to this heading");
  anchor.setAttribute("data-heading-anchor", "true");
  anchor.setAttribute("class", markdownStyles.headingAnchor);
  anchor.textContent = "#";
  headingEl.appendChild(anchor);
}

export function MarkdownHeading(props: MarkdownHeadingProps) {
  const [local, rest] = splitProps(props, ["headingClass"]);
  let headingRef: HTMLElement | undefined;

  onMount(() => {
    if (!headingRef) return;
    enhanceHeading(headingRef);
  });

  return (
    <Heading
      class={`${local.headingClass} ${markdownStyles.headingTarget}`}
      ref={(el) => {
        headingRef = el;
      }}
      {...rest}
    />
  );
}
