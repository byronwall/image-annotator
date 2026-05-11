import { For, createSignal, type ComponentProps } from "solid-js";
import { Box, HStack, VStack, styled } from "styled-system/jsx";
import { type TextVariantProps, text } from "styled-system/recipes";
import type { StyledComponent } from "styled-system/types";
import { Button as DemoButton } from "./button";

type Props = TextVariantProps & { as?: any };

export type TextProps = ComponentProps<typeof Text>;
export const Text = styled("p", text) as StyledComponent<"p", Props>;

export interface TextDemoProps {
  variantProps?: Record<string, string>;
}

const tones = [
  { label: "default", color: "fg.default" },
  { label: "muted", color: "fg.muted" },
  { label: "subtle", color: "fg.subtle" },
  { label: "accent", color: "colorPalette.fg" },
] as const;

const weights = ["normal", "medium", "semibold"] as const;
const contentModes = ["paragraph", "helper", "caption"] as const;

export const TextDemo = (props: TextDemoProps) => {
  const [tone, setTone] = createSignal<(typeof tones)[number]["label"]>(
    "default",
  );
  const [weight, setWeight] = createSignal<(typeof weights)[number]>("normal");
  const [mode, setMode] = createSignal<(typeof contentModes)[number]>(
    "paragraph",
  );

  const selectedTone = () =>
    tones.find((item) => item.label === tone()) ?? tones[0];

  const previewText = () => {
    if (mode() === "helper") {
      return "Helper text clarifies what this field or action expects.";
    }
    if (mode() === "caption") {
      return "Caption text: updated 2 minutes ago.";
    }
    return "Readable body copy for product surfaces and settings descriptions.";
  };

  const previewStyle = () => {
    if (mode() === "helper") return "sm";
    if (mode() === "caption") return "xs";
    return "md";
  };

  return (
    <VStack alignItems="start" gap="3" width="full" maxW="4xl">
      <HStack gap="1" flexWrap="wrap">
        <For each={tones}>
          {(item) => (
            <DemoButton
              size="2xs"
              variant={tone() === item.label ? "solid" : "outline"}
              onClick={() => setTone(item.label)}
            >
              {item.label}
            </DemoButton>
          )}
        </For>
      </HStack>
      <HStack gap="1" flexWrap="wrap">
        <For each={weights}>
          {(item) => (
            <DemoButton
              size="2xs"
              variant={weight() === item ? "solid" : "outline"}
              onClick={() => setWeight(item)}
            >
              {item}
            </DemoButton>
          )}
        </For>
      </HStack>
      <HStack gap="1" flexWrap="wrap">
        <For each={contentModes}>
          {(item) => (
            <DemoButton
              size="2xs"
              variant={mode() === item ? "solid" : "outline"}
              onClick={() => setMode(item)}
            >
              {item}
            </DemoButton>
          )}
        </For>
      </HStack>
      <Box p="3" borderWidth="1px" borderColor="border" borderRadius="l2">
        <Text
          {...(props.variantProps ?? {})}
          color={selectedTone().color}
          fontWeight={weight()}
          textStyle={previewStyle()}
        >
          {previewText()}
        </Text>
      </Box>
    </VStack>
  );
};
