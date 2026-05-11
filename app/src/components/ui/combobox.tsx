import { Combobox, useComboboxItemContext } from "@ark-ui/solid/combobox";
import { useListCollection } from "@ark-ui/solid/collection";
import { ark } from "@ark-ui/solid/factory";
import { useFilter } from "@ark-ui/solid/locale";
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-solid";
import { For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import {
  Box,
  createStyleContext,
  type HTMLStyledProps,
} from "styled-system/jsx";
import { type ComboboxVariantProps, combobox } from "styled-system/recipes";

const { withProvider, withContext } = createStyleContext(combobox);

export type RootProps = HTMLStyledProps<"div"> & ComboboxVariantProps;

export const Root = withProvider(Combobox.Root, "root", {
  defaultProps: () => ({ positioning: { sameWidth: false } }),
}) as Combobox.RootComponent<RootProps>;

export const RootProvider = withProvider(
  Combobox.RootProvider,
  "root",
) as Combobox.RootProviderComponent<RootProps>;

export const ClearTrigger = withContext(Combobox.ClearTrigger, "clearTrigger", {
  defaultProps: () => ({ children: <XIcon /> }),
});
export const Content = withContext(Combobox.Content, "content");
export const Control = withContext(Combobox.Control, "control");
export const Empty = withContext(Combobox.Empty, "empty");
export const IndicatorGroup = withContext(ark.div, "indicatorGroup");
export const Input = withContext(Combobox.Input, "input");
export const Item = withContext(Combobox.Item, "item");
export const ItemGroup = withContext(Combobox.ItemGroup, "itemGroup");
export const ItemGroupLabel = withContext(
  Combobox.ItemGroupLabel,
  "itemGroupLabel",
);
export const ItemText = withContext(Combobox.ItemText, "itemText");
export const Label = withContext(Combobox.Label, "label");
export const List = withContext(Combobox.List, "list");
export const Positioner = withContext(Combobox.Positioner, "positioner");
export const Trigger = withContext(Combobox.Trigger, "trigger", {
  defaultProps: () => ({ children: <ChevronsUpDownIcon /> }),
});

export { ComboboxContext as Context } from "@ark-ui/solid/combobox";

const StyledItemIndicator = withContext(
  Combobox.ItemIndicator,
  "itemIndicator",
);

export const ItemIndicator = (props: HTMLStyledProps<"div">) => {
  const item = useComboboxItemContext();

  return (
    <Show when={item().selected} fallback={<svg aria-hidden="true" />}>
      <StyledItemIndicator {...props}>
        <CheckIcon />
      </StyledItemIndicator>
    </Show>
  );
};

export interface ComboboxDemoProps {
  variantProps?: Record<string, string>;
}

export const ComboboxDemo = (props: ComboboxDemoProps) => {
  const filterFn = useFilter({ sensitivity: "base" });
  const { collection, filter } = useListCollection({
    initialItems: frameworkItems,
    filter: filterFn().contains,
  });

  return (
    <Box width="64">
      <Root
        {...(props.variantProps ?? {})}
        collection={collection()}
        onInputValueChange={(event) => filter(event.inputValue)}
      >
        <Label>Framework</Label>
        <Control>
          <Input placeholder="Search frameworks" />
          <IndicatorGroup>
            <ClearTrigger />
            <Trigger />
          </IndicatorGroup>
        </Control>
        <Portal>
          <Positioner>
            <Content>
              <Empty>No items found</Empty>
              <ItemGroup>
                <ItemGroupLabel>Popular</ItemGroupLabel>
                <For each={collection().items.slice(0, 4)}>
                  {(item) => (
                    <Item item={item}>
                      <ItemText>{item.label}</ItemText>
                      <ItemIndicator />
                    </Item>
                  )}
                </For>
              </ItemGroup>
              <ItemGroup>
                <ItemGroupLabel>Others</ItemGroupLabel>
                <For each={collection().items.slice(4)}>
                  {(item) => (
                    <Item item={item}>
                      <ItemText>{item.label}</ItemText>
                      <ItemIndicator />
                    </Item>
                  )}
                </For>
              </ItemGroup>
            </Content>
          </Positioner>
        </Portal>
      </Root>
    </Box>
  );
};

const frameworkItems = [
  { label: "React", value: "react" },
  { label: "Solid", value: "solid" },
  { label: "Vue", value: "vue" },
  { label: "Angular", value: "angular" },
  { label: "Svelte", value: "svelte" },
  { label: "Preact", value: "preact" },
  { label: "Qwik", value: "qwik" },
  { label: "Lit", value: "lit" },
  { label: "Alpine.js", value: "alpinejs" },
  { label: "Ember", value: "ember" },
  { label: "Next.js", value: "nextjs" },
];
