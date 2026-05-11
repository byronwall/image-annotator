import type { Accessor } from "solid-js";
import {
  For,
  Show,
  createMemo,
  createSignal,
  onMount,
  type ComponentProps,
} from "solid-js";
import type { SelectRootProps } from "@ark-ui/solid/select";
import { Portal } from "solid-js/web";
import { css } from "styled-system/css";
import { Box, HStack, VStack } from "styled-system/jsx";
import * as Select from "./select";
import { WrapWhen } from "./WrapWhen";

export type SimpleSelectItem = {
  label: string;
  value: string;
  disabled?: boolean;
};

type SimpleSelectProps = {
  items: SimpleSelectItem[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  labelPlacement?: "stacked" | "inline";
  labelProps?: Omit<ComponentProps<typeof Select.Label>, "children">;
  size?: "xs" | "sm" | "md" | "lg";
  minW?: string;
  triggerId?: string;
  positioning?: SelectRootProps<SimpleSelectItem>["positioning"];
  sameWidth?: boolean;
  // SSR-safe default: render in-tree unless explicitly portalled.
  skipPortal?: boolean;
};

export function SimpleSelect(props: SimpleSelectProps) {
  const [isHydrated, setIsHydrated] = createSignal(false);
  onMount(() => setIsHydrated(true));

  const collection = createMemo(() =>
    Select.createListCollection<SimpleSelectItem>({ items: props.items }),
  );

  const positioning: Accessor<
    SelectRootProps<SimpleSelectItem>["positioning"]
  > = () => {
    if (props.positioning) return props.positioning;
    if (props.sameWidth === false) return { placement: "bottom-start" };
    return { placement: "bottom-start", sameWidth: true };
  };

  const inlineLabel = () =>
    props.labelPlacement === "inline" ? props.label : undefined;

  const renderControl = () => (
    <Select.Control>
      <Select.Trigger id={props.triggerId} minW={props.minW}>
        <Select.ValueText placeholder={props.placeholder} />
        <Select.Indicator />
      </Select.Trigger>
    </Select.Control>
  );

  const shouldPortal = () => props.skipPortal === false && isHydrated();

  return (
    <Select.Root
      collection={collection()}
      value={props.value ? [props.value] : []}
      onValueChange={(details) => props.onChange(details.value[0] || "")}
      size={props.size}
      positioning={positioning()}
    >
      <Show
        when={inlineLabel()}
        fallback={
          <>
            <Show when={props.label}>
              {(label) => (
                <Select.Label {...props.labelProps}>{label()}</Select.Label>
              )}
            </Show>
            {renderControl()}
          </>
        }
      >
        {(label) => (
          <HStack gap="2" alignItems="center">
            <Select.Label {...props.labelProps}>{label()}</Select.Label>
            {renderControl()}
          </HStack>
        )}
      </Show>
      <WrapWhen when={shouldPortal()} component={Portal}>
        <Select.Positioner>
          <Select.Content class={contentClass}>
            <Select.List>
              <For each={collection().items}>
                {(item) => (
                  <Select.Item item={item}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator />
                  </Select.Item>
                )}
              </For>
            </Select.List>
          </Select.Content>
        </Select.Positioner>
      </WrapWhen>
      <Select.HiddenSelect />
    </Select.Root>
  );
}

const contentClass = css({
  maxH: "72",
});

export type SimpleSelectDemoProps = {
  variantProps?: Record<string, string>;
};

const demoItems: SimpleSelectItem[] = [
  { label: "Alpha", value: "alpha" },
  { label: "Beta", value: "beta" },
  { label: "Gamma", value: "gamma" },
  { label: "Delta", value: "delta" },
];

export const SimpleSelectDemo = (_props: SimpleSelectDemoProps) => {
  const [basicValue, setBasicValue] = createSignal("alpha");
  const [inlineValue, setInlineValue] = createSignal("beta");
  const [freeWidthValue, setFreeWidthValue] = createSignal("gamma");

  return (
    <HStack alignItems="start" gap="6" flexWrap="wrap" width="full" maxW="6xl">
      <VStack as="section" alignItems="stretch" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Basic
        </Box>
        <SimpleSelect
          items={demoItems}
          value={basicValue()}
          onChange={setBasicValue}
          label="Framework"
          placeholder="Select value"
        />
      </VStack>

      <VStack as="section" alignItems="stretch" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Inline Label
        </Box>
        <SimpleSelect
          items={demoItems}
          value={inlineValue()}
          onChange={setInlineValue}
          label="Technology"
          labelPlacement="inline"
          minW="56"
          placeholder="Pick one"
        />
      </VStack>

      <VStack as="section" alignItems="stretch" gap="2" minW="72" flex="1">
        <Box as="h3" fontWeight="semibold">
          Placement + Width
        </Box>
        <SimpleSelect
          items={demoItems}
          value={freeWidthValue()}
          onChange={setFreeWidthValue}
          label="Positioning"
          sameWidth={false}
          positioning={{ placement: "bottom-end" }}
          minW="48"
          placeholder="Bottom end"
        />
      </VStack>
    </HStack>
  );
};
