import { A, useNavigate } from "@solidjs/router";
import { For, createMemo } from "solid-js";
import { css } from "styled-system/css";
import { Box, HStack, VStack } from "styled-system/jsx";
import { Button } from "~/components/ui/button";
import {
  compsExplorerPath,
  DESIGN_SYSTEM_COLORS_KEY,
  DESIGN_SYSTEM_EFFECTS_KEY,
  DESIGN_SYSTEM_LAYOUT_KEY,
  DESIGN_SYSTEM_MOTION_KEY,
  DESIGN_SYSTEM_TYPOGRAPHY_KEY,
  ERROR_OVERLAY_COMPONENT_KEY,
  type ExplorerComponentLink,
  type RecipeMeta,
} from "./compsExplorer.shared";

type CompsExplorerSidebarProps = {
  recipeList: RecipeMeta[];
  simpleComponentLinks: ExplorerComponentLink[];
  docsOnlyComponentLinks: ExplorerComponentLink[];
  selectedComponent: string;
};

type ComponentCategory = {
  label: string;
  items: ExplorerComponentLink[];
};

const FORM_AND_INPUT_KEYS = new Set([
  "checkbox",
  "colorPicker",
  "combobox",
  "datePicker",
  "editable",
  "field",
  "fieldset",
  "fileUpload",
  "input",
  "inputAddon",
  "inputGroup",
  "numberInput",
  "pinInput",
  "radioCardGroup",
  "radioGroup",
  "ratingGroup",
  "select",
  "simpleSelect",
  "slider",
  "switch",
  "tagsInput",
  "textarea",
  "toggleGroup",
]);

const NAV_AND_SELECTION_KEYS = new Set([
  "breadcrumb",
  "link",
  "menu",
  "pagination",
  "segmentGroup",
  "tabs",
]);

const OVERLAY_AND_FEEDBACK_KEYS = new Set([
  "alert",
  "closeButton",
  "dialog",
  "drawer",
  "hoverCard",
  "popover",
  "progress",
  "simpleDialog",
  "simplePopover",
  "skeleton",
  "spinner",
  "toast",
  "tooltip",
]);

const DISPLAY_AND_CONTENT_KEYS = new Set([
  "avatar",
  "badge",
  "button",
  "card",
  "carousel",
  "clipboard",
  "code",
  "displayValue",
  "heading",
  "icon",
  "iconButton",
  "kbd",
  "markdownRenderer",
  "table",
  "text",
]);

const LAYOUT_AND_UTILITIES_KEYS = new Set([
  "absoluteCenter",
  "accordion",
  "collapsible",
  "group",
  "scrollArea",
  "splitter",
]);

const categorizeComponents = (
  links: ExplorerComponentLink[],
): ComponentCategory[] => {
  const byCategory: ComponentCategory[] = [
    { label: "Forms & Input", items: [] },
    { label: "Navigation & Selection", items: [] },
    { label: "Overlay & Feedback", items: [] },
    { label: "Display & Content", items: [] },
    { label: "Layout & Utilities", items: [] },
  ];

  const uncategorized: ExplorerComponentLink[] = [];

  for (const component of links) {
    if (FORM_AND_INPUT_KEYS.has(component.key)) {
      byCategory[0].items.push(component);
      continue;
    }
    if (NAV_AND_SELECTION_KEYS.has(component.key)) {
      byCategory[1].items.push(component);
      continue;
    }
    if (OVERLAY_AND_FEEDBACK_KEYS.has(component.key)) {
      byCategory[2].items.push(component);
      continue;
    }
    if (DISPLAY_AND_CONTENT_KEYS.has(component.key)) {
      byCategory[3].items.push(component);
      continue;
    }
    if (LAYOUT_AND_UTILITIES_KEYS.has(component.key)) {
      byCategory[4].items.push(component);
      continue;
    }
    uncategorized.push(component);
  }

  if (uncategorized.length > 0) {
    byCategory[4].items.push(...uncategorized);
  }

  return byCategory.filter((category) => category.items.length > 0);
};

const navLinkClass = (isSelected: boolean, selectedColor = "blue") =>
  css({
    textDecoration: "none",
    px: "2",
    py: "0.75",
    borderRadius: "l1",
    borderWidth: "1px",
    borderColor: isSelected ? `${selectedColor}.7` : "border",
    bg: isSelected ? `${selectedColor}.subtle.bg` : "transparent",
    color: isSelected ? `${selectedColor}.subtle.fg` : "fg.default",
    textStyle: "2xs",
    fontWeight: "medium",
    lineHeight: "tight",
    whiteSpace: "nowrap",
  });

export const CompsExplorerSidebar = (props: CompsExplorerSidebarProps) => {
  const navigate = useNavigate();
  const categorizedComponents = createMemo(() => {
    const all = [
      ...props.recipeList,
      ...props.simpleComponentLinks,
      ...props.docsOnlyComponentLinks,
      { key: ERROR_OVERLAY_COMPONENT_KEY, label: "Error Overlay" },
    ];
    const unique = new Map(all.map((item) => [item.key, item]));
    return categorizeComponents(Array.from(unique.values()));
  });

  return (
    <Box
      as="aside"
      w="300px"
      minW="300px"
      maxW="300px"
      h="full"
      overflowY="auto"
      borderRightWidth="1px"
      borderColor="border"
      p="2"
      bg="bg.default"
      zIndex="10"
    >
      <VStack alignItems="stretch" gap="2">
        <Button
          variant="outline"
          size="sm"
          width="full"
          onClick={() => navigate("/")}
        >
          Back Home
        </Button>

        <VStack alignItems="stretch" gap="1.5">
          <Box textStyle="2xs" color="fg.muted" fontWeight="semibold">
            DESIGN SYSTEM
          </Box>
          <HStack alignItems="flex-start" gap="1.5" flexWrap="wrap">
            <A
              href={compsExplorerPath(DESIGN_SYSTEM_COLORS_KEY)}
              class={navLinkClass(
                props.selectedComponent === DESIGN_SYSTEM_COLORS_KEY,
              )}
            >
              Colors
            </A>
            <A
              href={compsExplorerPath(DESIGN_SYSTEM_LAYOUT_KEY)}
              class={navLinkClass(
                props.selectedComponent === DESIGN_SYSTEM_LAYOUT_KEY,
              )}
            >
              Layout
            </A>
            <A
              href={compsExplorerPath(DESIGN_SYSTEM_TYPOGRAPHY_KEY)}
              class={navLinkClass(
                props.selectedComponent === DESIGN_SYSTEM_TYPOGRAPHY_KEY,
              )}
            >
              Typography
            </A>
            <A
              href={compsExplorerPath(DESIGN_SYSTEM_MOTION_KEY)}
              class={navLinkClass(
                props.selectedComponent === DESIGN_SYSTEM_MOTION_KEY,
              )}
            >
              Motion
            </A>
            <A
              href={compsExplorerPath(DESIGN_SYSTEM_EFFECTS_KEY)}
              class={navLinkClass(
                props.selectedComponent === DESIGN_SYSTEM_EFFECTS_KEY,
              )}
            >
              Effects
            </A>
          </HStack>
        </VStack>

        <VStack alignItems="stretch" gap="1.5">
          <Box textStyle="2xs" color="fg.muted" fontWeight="semibold">
            COMPONENTS
          </Box>
          <VStack alignItems="stretch" gap="2">
            <For each={categorizedComponents()}>
              {(category) => (
                <VStack alignItems="stretch" gap="1">
                  <Box textStyle="2xs" color="fg.subtle" fontWeight="medium">
                    {category.label}
                  </Box>
                  <HStack alignItems="flex-start" gap="1.5" flexWrap="wrap">
                    <For each={category.items}>
                      {(component) => (
                        <A
                          href={compsExplorerPath(component.key)}
                          class={navLinkClass(
                            props.selectedComponent === component.key,
                            component.key === ERROR_OVERLAY_COMPONENT_KEY
                              ? "red"
                              : "blue",
                          )}
                        >
                          {component.label}
                        </A>
                      )}
                    </For>
                  </HStack>
                </VStack>
              )}
            </For>
          </VStack>
        </VStack>
      </VStack>
    </Box>
  );
};
