import { ark } from "@ark-ui/solid/factory";
import {
  Select,
  createListCollection,
  useSelectItemContext,
  type SelectRootProps,
  type SelectRootProviderProps,
} from "@ark-ui/solid/select";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-solid";
import { For, Show, createSignal, type JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { Box, HStack, VStack, createStyleContext } from "styled-system/jsx";
import { type SelectVariantProps, select } from "styled-system/recipes";
import type { HTMLStyledProps } from "styled-system/types";
import { Button as DemoButton } from "./button";

const { withProvider, withContext } = createStyleContext(select);

type StyleProps = SelectVariantProps & HTMLStyledProps<"div">;

type RootProps<T> = SelectRootProps<T> & StyleProps;
type RootProviderProps<T> = SelectRootProviderProps<T> & StyleProps;

export const Root = withProvider(Select.Root, "root") as unknown as <T>(
  props: RootProps<T>,
) => JSX.Element;
export const RootProvider = withProvider(
  Select.RootProvider,
  "root",
) as unknown as <T>(props: RootProviderProps<T>) => JSX.Element;

export const ClearTrigger = withContext(Select.ClearTrigger, "clearTrigger");
export const Content = withContext(Select.Content, "content");
export const Control = withContext(Select.Control, "control");
export const IndicatorGroup = withContext(ark.div, "indicatorGroup");
export const Item = withContext(Select.Item, "item");
export const ItemGroup = withContext(Select.ItemGroup, "itemGroup");
export const ItemGroupLabel = withContext(
  Select.ItemGroupLabel,
  "itemGroupLabel",
);
export const ItemText = withContext(Select.ItemText, "itemText");
export const Label = withContext(Select.Label, "label");
export const List = withContext(Select.List, "list");
export const Positioner = withContext(Select.Positioner, "positioner");
export const Trigger = withContext(Select.Trigger, "trigger");
export const ValueText = withContext(Select.ValueText, "valueText");
export const Indicator = withContext(Select.Indicator, "indicator", {
  defaultProps: () => ({ children: <ChevronsUpDownIcon /> }),
});
export const HiddenSelect = Select.HiddenSelect;

export {
  SelectContext as Context,
  SelectItemContext as ItemContext,
  createListCollection,
  type ListCollection,
  type SelectValueChangeDetails as ValueChangeDetails,
} from "@ark-ui/solid/select";

const StyledItemIndicator = withContext(Select.ItemIndicator, "itemIndicator");

export const ItemIndicator = (props: HTMLStyledProps<"div">) => {
  const item = useSelectItemContext();

  return (
    <Show when={item().selected} fallback={<svg aria-hidden="true" />}>
      <StyledItemIndicator {...props}>
        <CheckIcon />
      </StyledItemIndicator>
    </Show>
  );
};

export interface SelectDemoProps {
  variantProps?: Record<string, string>;
}

const basicItems = createListCollection({
  items: [
    { label: "Alpha", value: "a" },
    { label: "Beta", value: "b" },
    { label: "Gamma", value: "c" },
    { label: "Delta", value: "d" },
  ],
});

const groupedItems = createListCollection({
  items: [
    { label: "React", value: "react", category: "Frontend" },
    { label: "Solid", value: "solid", category: "Frontend" },
    { label: "Vue", value: "vue", category: "Frontend" },
    { label: "Node.js", value: "node", category: "Runtime" },
    { label: "Deno", value: "deno", category: "Runtime" },
  ],
  groupBy: (item) => item.category,
});

export const SelectDemo = (props: SelectDemoProps) => {
  const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
  const [size, setSize] = createSignal<(typeof sizes)[number]>("md");
  const baseVariantProps = () => {
    const source = props.variantProps ?? {};
    const { size: _size, variant: _variant, ...rest } = source;
    return rest;
  };

  return (
    <VStack alignItems="start" gap="4" width="full" maxW="5xl">
      <HStack gap="1" flexWrap="wrap">
        <For each={sizes}>
          {(value) => (
            <DemoButton
              size="2xs"
              variant={size() === value ? "solid" : "outline"}
              onClick={() => setSize(value)}
            >
              {value}
            </DemoButton>
          )}
        </For>
      </HStack>

      <VStack alignItems="stretch" gap="2" width="full">
        <Box as="h3" fontWeight="semibold">
          All Sizes
        </Box>
        <VStack alignItems="stretch" gap="3" width="full" maxW="xl">
          <For each={sizes}>
            {(value) => (
              <HStack alignItems="center" gap="3" width="full">
                <Box textStyle="xs" color="fg.muted" minW="8">
                  {value}
                </Box>
                <Root
                  {...baseVariantProps()}
                  size={value}
                  collection={basicItems}
                  defaultValue={["a"]}
                  width="64"
                >
                  <Control>
                    <Trigger>
                      <ValueText placeholder="Select framework" />
                      <IndicatorGroup>
                        <Indicator />
                      </IndicatorGroup>
                    </Trigger>
                  </Control>
                  <HiddenSelect />
                  <Portal>
                    <Positioner>
                      <Content>
                        <For each={basicItems.items}>
                          {(item) => (
                            <Item item={item}>
                              <ItemText>{item.label}</ItemText>
                              <ItemIndicator />
                            </Item>
                          )}
                        </For>
                      </Content>
                    </Positioner>
                  </Portal>
                </Root>
              </HStack>
            )}
          </For>
        </VStack>
      </VStack>

      <HStack alignItems="start" gap="6" flexWrap="wrap" width="full">
        <VStack alignItems="stretch" gap="2" minW="64" flex="1">
          <Box as="h3" fontWeight="semibold">
            Basic
          </Box>
          <Root
            {...baseVariantProps()}
            size={size()}
            collection={basicItems}
            defaultValue={["a"]}
            width="64"
          >
            <Label>Framework</Label>
            <Control>
              <Trigger>
                <ValueText placeholder="Select framework" />
                <IndicatorGroup>
                  <Indicator />
                </IndicatorGroup>
              </Trigger>
            </Control>
            <HiddenSelect />
            <Portal>
              <Positioner>
                <Content>
                  <For each={basicItems.items}>
                    {(item) => (
                      <Item item={item}>
                        <ItemText>{item.label}</ItemText>
                        <ItemIndicator />
                      </Item>
                    )}
                  </For>
                </Content>
              </Positioner>
            </Portal>
          </Root>
        </VStack>

        <VStack alignItems="stretch" gap="2" minW="64" flex="1">
          <Box as="h3" fontWeight="semibold">
            Grouped
          </Box>
          <Root
            {...baseVariantProps()}
            size={size()}
            collection={groupedItems}
            width="64"
          >
            <Label>Technology</Label>
            <Control>
              <Trigger>
                <ValueText placeholder="Pick tech" />
                <IndicatorGroup>
                  <Indicator />
                </IndicatorGroup>
              </Trigger>
            </Control>
            <HiddenSelect />
            <Portal>
              <Positioner>
                <Content>
                  <For each={groupedItems.group()}>
                    {([category, items]) => (
                      <ItemGroup>
                        <ItemGroupLabel>{category}</ItemGroupLabel>
                        <For each={items}>
                          {(item) => (
                            <Item item={item}>
                              <ItemText>{item.label}</ItemText>
                              <ItemIndicator />
                            </Item>
                          )}
                        </For>
                      </ItemGroup>
                    )}
                  </For>
                </Content>
              </Positioner>
            </Portal>
          </Root>
        </VStack>

        <VStack alignItems="stretch" gap="2" minW="64" flex="1">
          <Box as="h3" fontWeight="semibold">
            Disabled
          </Box>
          <Root
            {...baseVariantProps()}
            size={size()}
            collection={basicItems}
            defaultValue={["b"]}
            disabled
            width="64"
          >
            <Label>Environment</Label>
            <Control>
              <Trigger>
                <ValueText placeholder="Choose..." />
                <IndicatorGroup>
                  <Indicator />
                </IndicatorGroup>
              </Trigger>
            </Control>
            <HiddenSelect />
          </Root>
        </VStack>
      </HStack>
    </VStack>
  );
};
