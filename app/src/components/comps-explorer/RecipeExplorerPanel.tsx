import { For, Show, createMemo, createSignal } from "solid-js";
import { css } from "styled-system/css";
import { Box, HStack, VStack } from "styled-system/jsx";
import { Button } from "~/components/ui/button";
import { Code } from "~/components/ui/code";
import { DEMO_COMPONENTS, RenderDemoComponent } from "~/components/ui/demos";
import {
  resolveCombo,
  type AxisLayout,
  type AxisSelection,
  type Combo,
  type GridMode,
  type RecipeMeta,
} from "./compsExplorer.shared";

type RecipeExplorerPanelProps = {
  recipe: RecipeMeta;
};

const renderRecipeDemo = (recipeKey: string, variantProps: Combo) => {
  const Demo = DEMO_COMPONENTS[recipeKey];

  if (Demo) {
    return <RenderDemoComponent demoKey={recipeKey} variantProps={variantProps} />;
  }

  return (
    <Box textStyle="sm" color="fg.muted">
      No template yet for <Code>{recipeKey}</Code>.
    </Box>
  );
};

export const RecipeExplorerPanel = (props: RecipeExplorerPanelProps) => {
  const [selectedVariants, setSelectedVariants] = createSignal<Combo>({});
  const [mode, setMode] = createSignal<GridMode>("grid2d");
  const [axisLayout, setAxisLayout] = createSignal<AxisLayout>("horizontal");
  const [axisSelection, setAxisSelection] = createSignal<AxisSelection>({});

  const variantEntries = createMemo(() =>
    Object.entries(props.recipe.variantMap),
  );
  const useVariantGrid = createMemo(
    () => !["dialog", "drawer", "select", "table"].includes(props.recipe.key),
  );
  const axes = createMemo(() => variantEntries().map(([axis]) => axis));
  const gridAxes = createMemo(() =>
    axes().filter((axis) => (props.recipe.variantMap[axis]?.length ?? 0) > 1),
  );

  const selectedCombo = createMemo(() =>
    resolveCombo(props.recipe, selectedVariants()),
  );

  const resolvedMode = createMemo<GridMode>(() => {
    if (!useVariantGrid()) return "single";
    const stored = mode();
    if (stored === "single") return "single";
    if (stored === "grid1d" && gridAxes().length > 0) return "grid1d";
    if (stored === "grid2d" && gridAxes().length > 1) return "grid2d";
    if (gridAxes().length > 1) return "grid2d";
    if (gridAxes().length > 0) return "grid1d";
    return "single";
  });

  const axis1 = createMemo(() => {
    const selected = axisSelection().one;
    if (selected && gridAxes().includes(selected)) return selected;
    return gridAxes()[0] ?? "";
  });

  const axisX = createMemo(() => {
    const selected = axisSelection().x;
    if (selected && gridAxes().includes(selected)) return selected;
    return gridAxes()[0] ?? "";
  });

  const axisY = createMemo(() => {
    const selected = axisSelection().y;
    if (selected && gridAxes().includes(selected) && selected !== axisX()) {
      return selected;
    }

    const fallback = gridAxes().find((axis) => axis !== axisX());
    return fallback ?? axisX();
  });

  const renderCell = (combo: Combo) => (
    <Box
      p="2"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box width="fit-content">{renderRecipeDemo(props.recipe.key, combo)}</Box>
    </Box>
  );

  return (
    <Box id={`recipe-${props.recipe.key}`}>
      <VStack alignItems="stretch" gap="4">
        <HStack justifyContent="space-between" alignItems="center">
          <Box textStyle={{ base: "xl", md: "2xl" }} fontWeight="semibold">
            {props.recipe.label}
          </Box>
          <Show when={props.recipe.key === "toast"}>
            <Box textStyle="xs" color="fg.muted">
              Click button to verify toast behavior.
            </Box>
          </Show>
        </HStack>

        <Show when={variantEntries().length > 0 && useVariantGrid()}>
          <VStack
            alignItems="stretch"
            gap="1.5"
            borderWidth="1px"
            borderColor="border"
            borderRadius="l2"
            p="2.5"
            bg="bg.subtle"
          >
            <HStack alignItems="start" gap="2" flexWrap="wrap">
              <For each={variantEntries()}>
                {([axis, options]) => (
                  <HStack
                    alignItems="center"
                    gap="1.5"
                    p="1.5"
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="l2"
                    bg="bg.default"
                    flexWrap="wrap"
                  >
                    <Box textStyle="xs" color="fg.muted" whiteSpace="nowrap">
                      {axis}
                    </Box>
                    <HStack gap="1" flexWrap="wrap">
                      <For each={options}>
                        {(option) => (
                          <Button
                            size="xs"
                            variant={
                              selectedCombo()[axis] === option
                                ? "solid"
                                : "outline"
                            }
                            onClick={() =>
                              setSelectedVariants((prev) => ({
                                ...prev,
                                [axis]: option,
                              }))
                            }
                          >
                            {option}
                          </Button>
                        )}
                      </For>
                    </HStack>
                  </HStack>
                )}
              </For>

              <HStack
                alignItems="center"
                gap="1.5"
                p="1.5"
                borderWidth="1px"
                borderColor="border"
                borderRadius="l2"
                bg="bg.default"
                flexWrap="wrap"
              >
                <Box textStyle="xs" color="fg.muted" whiteSpace="nowrap">
                  mode
                </Box>
                <HStack gap="1" flexWrap="wrap">
                  <Button
                    size="xs"
                    variant={resolvedMode() === "single" ? "solid" : "outline"}
                    onClick={() => setMode("single")}
                  >
                    Single
                  </Button>
                  <Button
                    size="xs"
                    variant={resolvedMode() === "grid1d" ? "solid" : "outline"}
                    disabled={gridAxes().length === 0}
                    onClick={() => setMode("grid1d")}
                  >
                    1D
                  </Button>
                  <Button
                    size="xs"
                    variant={resolvedMode() === "grid2d" ? "solid" : "outline"}
                    disabled={gridAxes().length < 2}
                    onClick={() => setMode("grid2d")}
                  >
                    2D
                  </Button>
                </HStack>
              </HStack>

              <Show when={resolvedMode() === "grid1d" && gridAxes().length > 0}>
                <HStack
                  alignItems="center"
                  gap="1.5"
                  p="1.5"
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="l2"
                  bg="bg.default"
                  flexWrap="wrap"
                >
                  <Box textStyle="xs" color="fg.muted" whiteSpace="nowrap">
                    1d axis
                  </Box>
                  <HStack gap="1" flexWrap="wrap">
                    <For each={gridAxes()}>
                      {(axis) => (
                        <Button
                          size="xs"
                          variant={axis1() === axis ? "solid" : "outline"}
                          onClick={() =>
                            setAxisSelection((prev) => ({ ...prev, one: axis }))
                          }
                        >
                          {axis}
                        </Button>
                      )}
                    </For>
                  </HStack>
                </HStack>
                <HStack
                  alignItems="center"
                  gap="1.5"
                  p="1.5"
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="l2"
                  bg="bg.default"
                  flexWrap="wrap"
                >
                  <Box textStyle="xs" color="fg.muted" whiteSpace="nowrap">
                    1d layout
                  </Box>
                  <HStack gap="1" flexWrap="wrap">
                    <Button
                      size="xs"
                      variant={
                        axisLayout() === "horizontal" ? "solid" : "outline"
                      }
                      onClick={() => setAxisLayout("horizontal")}
                    >
                      Horizontal
                    </Button>
                    <Button
                      size="xs"
                      variant={axisLayout() === "vertical" ? "solid" : "outline"}
                      onClick={() => setAxisLayout("vertical")}
                    >
                      Vertical
                    </Button>
                  </HStack>
                </HStack>
              </Show>

              <Show when={resolvedMode() === "grid2d" && gridAxes().length > 1}>
                <HStack
                  alignItems="center"
                  gap="1.5"
                  p="1.5"
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="l2"
                  bg="bg.default"
                  flexWrap="wrap"
                >
                  <Box textStyle="xs" color="fg.muted" whiteSpace="nowrap">
                    2d axes
                  </Box>
                  <HStack gap="1" alignItems="center" flexWrap="wrap">
                    <Box textStyle="xs" color="fg.muted">
                      x
                    </Box>
                    <HStack gap="1" flexWrap="wrap">
                      <For each={gridAxes()}>
                        {(axis) => (
                          <Button
                            size="xs"
                            variant={axisX() === axis ? "solid" : "outline"}
                            onClick={() =>
                              setAxisSelection((prev) => ({ ...prev, x: axis }))
                            }
                          >
                            {axis}
                          </Button>
                        )}
                      </For>
                    </HStack>
                  </HStack>
                  <HStack gap="1" alignItems="center" flexWrap="wrap">
                    <Box textStyle="xs" color="fg.muted">
                      y
                    </Box>
                    <HStack gap="1" flexWrap="wrap">
                      <For each={gridAxes().filter((axis) => axis !== axisX())}>
                        {(axis) => (
                          <Button
                            size="xs"
                            variant={axisY() === axis ? "solid" : "outline"}
                            onClick={() =>
                              setAxisSelection((prev) => ({ ...prev, y: axis }))
                            }
                          >
                            {axis}
                          </Button>
                        )}
                      </For>
                    </HStack>
                  </HStack>
                </HStack>
              </Show>
            </HStack>
          </VStack>
        </Show>

        <Show when={variantEntries().length === 0 || !useVariantGrid()}>
          <Box textStyle="sm" color="fg.muted">
            <Show
              when={useVariantGrid()}
              fallback={
                <>
                  Variants are configured within the example itself for this
                  component.
                </>
              }
            >
              No recipe variants. Showing static template.
            </Show>
          </Box>
        </Show>

        <Show when={resolvedMode() === "single"}>
          {renderCell(selectedCombo())}
        </Show>

        <Show when={useVariantGrid() && resolvedMode() === "grid1d" && axis1()}>
          <Show
            when={axisLayout() === "horizontal"}
            fallback={
              <VStack alignItems="stretch" gap="3">
                <For each={props.recipe.variantMap[axis1()] ?? []}>
                  {(option) => {
                    const combo = { ...selectedCombo(), [axis1()]: option };

                    return (
                      <VStack alignItems="stretch" gap="1.5">
                        <Box textStyle="xs" color="fg.muted">
                          {axis1()}: {option}
                        </Box>
                        {renderCell(combo)}
                      </VStack>
                    );
                  }}
                </For>
              </VStack>
            }
          >
            <Box overflowX="auto">
              <HStack alignItems="stretch" gap="2.5" flexWrap="nowrap">
                <For each={props.recipe.variantMap[axis1()] ?? []}>
                  {(option) => {
                    const combo = { ...selectedCombo(), [axis1()]: option };

                    return (
                      <VStack alignItems="stretch" gap="1.5">
                        <Box textStyle="xs" color="fg.muted">
                          {axis1()}: {option}
                        </Box>
                        {renderCell(combo)}
                      </VStack>
                    );
                  }}
                </For>
              </HStack>
            </Box>
          </Show>
        </Show>

        <Show
          when={useVariantGrid() && resolvedMode() === "grid2d" && axisX() && axisY()}
        >
          <Box overflowX="auto">
            <table
              class={css({
                width: "fit-content",
                borderCollapse: "collapse",
              })}
            >
              <thead>
                <tr>
                  <th
                    class={css({
                      p: "1",
                      borderBottomWidth: "1px",
                      borderColor: "border",
                      textAlign: "left",
                      textStyle: "xs",
                      color: "fg.muted",
                      fontWeight: "medium",
                      whiteSpace: "nowrap",
                    })}
                  >
                    {axisY()} \\ {axisX()}
                  </th>
                  <For each={props.recipe.variantMap[axisX()] ?? []}>
                    {(xOption) => (
                      <th
                        class={css({
                          p: "1",
                          borderBottomWidth: "1px",
                          borderColor: "border",
                          textAlign: "left",
                          textStyle: "xs",
                          fontWeight: "medium",
                          color: "fg.muted",
                          whiteSpace: "nowrap",
                        })}
                      >
                        {xOption}
                      </th>
                    )}
                  </For>
                </tr>
              </thead>
              <tbody>
                <For each={props.recipe.variantMap[axisY()] ?? []}>
                  {(yOption) => (
                    <tr>
                      <th
                        class={css({
                          p: "1",
                          borderBottomWidth: "1px",
                          borderColor: "border",
                          textAlign: "left",
                          textStyle: "xs",
                          fontWeight: "medium",
                          color: "fg.muted",
                          verticalAlign: "top",
                          whiteSpace: "nowrap",
                        })}
                      >
                        {yOption}
                      </th>
                      <For each={props.recipe.variantMap[axisX()] ?? []}>
                        {(xOption) => {
                          const combo = {
                            ...selectedCombo(),
                            [axisY()]: yOption,
                            [axisX()]: xOption,
                          };

                          return (
                            <td
                              class={css({
                                p: "0.5 0.75rem",
                                borderBottomWidth: "1px",
                                borderColor: "border",
                                verticalAlign: "top",
                              })}
                            >
                              {renderCell(combo)}
                            </td>
                          );
                        }}
                      </For>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Box>
        </Show>
      </VStack>
    </Box>
  );
};
