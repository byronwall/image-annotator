import { Show, createMemo } from "solid-js";
import { Box, HStack, VStack } from "styled-system/jsx";
import {
  DesignSystemOverview,
  type DesignSystemSection,
} from "./DesignSystemOverview";
import { CompsExplorerSidebar } from "./CompsExplorerSidebar";
import { ErrorOverlayPlayground } from "./ErrorOverlayPlayground";
import { MarkdownRendererPlayground } from "./MarkdownRendererPlayground";
import { RecipeExplorerPanel } from "./RecipeExplorerPanel";
import {
  DESIGN_SYSTEM_COLORS_KEY,
  DESIGN_SYSTEM_EFFECTS_KEY,
  DESIGN_SYSTEM_LAYOUT_KEY,
  DESIGN_SYSTEM_MOTION_KEY,
  DESIGN_SYSTEM_TYPOGRAPHY_KEY,
  DOCS_ONLY_COMPONENT_LINKS,
  ERROR_OVERLAY_COMPONENT_KEY,
  MARKDOWN_RENDERER_COMPONENT_KEY,
  SIMPLE_COMPONENT_LINKS,
  friendlyName,
  getVariantMap,
  type RecipeLike,
  type RecipeMeta,
} from "./compsExplorer.shared";
import { recipes } from "~/theme/recipes";

type CompsExplorerProps = {
  selectedComponent: string;
};

const isDesignSystemKey = (value: string) =>
  value === DESIGN_SYSTEM_COLORS_KEY ||
  value === DESIGN_SYSTEM_LAYOUT_KEY ||
  value === DESIGN_SYSTEM_TYPOGRAPHY_KEY ||
  value === DESIGN_SYSTEM_MOTION_KEY ||
  value === DESIGN_SYSTEM_EFFECTS_KEY ||
  value === "design-system-sizes" ||
  value === "design-system-theme";

const getDesignSystemSection = (
  selectedComponent: string,
): DesignSystemSection =>
  selectedComponent === DESIGN_SYSTEM_LAYOUT_KEY ||
  selectedComponent === "design-system-sizes" ||
  selectedComponent === "design-system-theme"
    ? "layout"
    : selectedComponent === DESIGN_SYSTEM_TYPOGRAPHY_KEY
      ? "typography"
      : selectedComponent === DESIGN_SYSTEM_MOTION_KEY
        ? "motion"
        : selectedComponent === DESIGN_SYSTEM_EFFECTS_KEY
          ? "effects"
          : "colors";

const recipeList: RecipeMeta[] = Object.entries(recipes)
  .map(([key, recipe]) => {
    const typedRecipe = recipe as RecipeLike;
    const normalizedKey = key === "switchRecipe" ? "switch" : key;
    const label = friendlyName(normalizedKey);

    return {
      key: normalizedKey,
      label,
      variantMap: getVariantMap(typedRecipe),
      defaultVariants: typedRecipe.defaultVariants ?? {},
    };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

const defaultSelectedComponent = DESIGN_SYSTEM_LAYOUT_KEY;

const resolveSelectedComponent = (selectedComponent: string) => {
  if (selectedComponent === "switchRecipe") return "switch";
  if (isDesignSystemKey(selectedComponent)) return selectedComponent;
  if (selectedComponent === ERROR_OVERLAY_COMPONENT_KEY) return selectedComponent;
  if (SIMPLE_COMPONENT_LINKS.some((item) => item.key === selectedComponent)) {
    return selectedComponent;
  }
  if (DOCS_ONLY_COMPONENT_LINKS.some((item) => item.key === selectedComponent)) {
    return selectedComponent;
  }
  if (recipeList.some((recipe) => recipe.key === selectedComponent)) {
    return selectedComponent;
  }
  return defaultSelectedComponent;
};

export const CompsExplorer = (props: CompsExplorerProps) => {
  const selectedComponent = createMemo(() =>
    resolveSelectedComponent(props.selectedComponent),
  );
  const selectedSimpleComponent = createMemo(() =>
    SIMPLE_COMPONENT_LINKS.find(
      (component) => component.key === selectedComponent(),
    ),
  );
  const selectedDocsOnlyComponent = createMemo(() =>
    DOCS_ONLY_COMPONENT_LINKS.find(
      (component) => component.key === selectedComponent(),
    ),
  );
  const selectedRecipe = createMemo(
    () => {
      const simpleComponent = selectedSimpleComponent();
      const docsOnlyComponent = selectedDocsOnlyComponent();

      return (
        recipeList.find((recipe) => recipe.key === selectedComponent()) ??
        (simpleComponent
          ? {
              key: simpleComponent.key,
              label: simpleComponent.label,
              variantMap: {},
              defaultVariants: {},
            }
          : docsOnlyComponent
            ? {
                key: docsOnlyComponent.key,
                label: docsOnlyComponent.label,
                variantMap: {},
                defaultVariants: {},
              }
            : null)
      );
    },
  );

  return (
    <Box
      position="fixed"
      inset="0"
      overflow="hidden"
      bg="bg.default"
      color="fg.default"
    >
      <HStack alignItems="stretch" gap="0" h="full">
        <CompsExplorerSidebar
          recipeList={recipeList}
          simpleComponentLinks={SIMPLE_COMPONENT_LINKS}
          docsOnlyComponentLinks={DOCS_ONLY_COMPONENT_LINKS}
          selectedComponent={selectedComponent()}
        />

        <Box
          as="main"
          flex="1"
          minW="0"
          h="full"
          overflowY="auto"
          p={{ base: "3", md: "4" }}
        >
          <Box pt={{ base: "2", md: "3" }}>
            <VStack alignItems="stretch" gap="5">
              <Show
                when={isDesignSystemKey(selectedComponent())}
                fallback={
                  <Show
                    when={selectedComponent() === MARKDOWN_RENDERER_COMPONENT_KEY}
                    fallback={
                      <Show
                        when={
                          selectedComponent() === ERROR_OVERLAY_COMPONENT_KEY
                        }
                        fallback={
                          <Show
                            when={selectedRecipe()}
                            fallback={
                              <Box textStyle="sm" color="fg.muted">
                                No component selected.
                              </Box>
                            }
                          >
                            {(recipe) => (
                              <RecipeExplorerPanel recipe={recipe()} />
                            )}
                          </Show>
                        }
                      >
                        <ErrorOverlayPlayground />
                      </Show>
                    }
                  >
                    <MarkdownRendererPlayground />
                  </Show>
                }
              >
                <DesignSystemOverview
                  section={getDesignSystemSection(selectedComponent())}
                />
              </Show>
            </VStack>
          </Box>
        </Box>
      </HStack>
    </Box>
  );
};
