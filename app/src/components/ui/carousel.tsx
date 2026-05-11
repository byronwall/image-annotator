import { Carousel, useCarouselContext } from "@ark-ui/solid/carousel";
import { type ComponentProps, For, createMemo, createSignal } from "solid-js";
import { Box as DemoBox, HStack as DemoHStack, VStack as DemoVStack, createStyleContext } from "styled-system/jsx";
import { carousel } from "styled-system/recipes";
import { Button as DemoButton } from "./button";

const { withProvider, withContext } = createStyleContext(carousel);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(Carousel.Root, "root", {
  forwardProps: [
    "page",
    "slideCount",
    "slidesPerPage",
    "orientation",
    "autoplay",
    "loop",
    "spacing",
  ],
  defaultProps: () => ({ spacing: "16px" }),
});
export const RootProvider = withProvider(Carousel.RootProvider, "root");
export const AutoplayTrigger = withContext(
  Carousel.AutoplayTrigger,
  "autoplayTrigger",
);
export const Control = withContext(Carousel.Control, "control");
export const Indicator = withContext(Carousel.Indicator, "indicator");
export const Item = withContext(Carousel.Item, "item");
export const ItemGroup = withContext(Carousel.ItemGroup, "itemGroup");
export const NextTrigger = withContext(Carousel.NextTrigger, "nextTrigger");
export const PrevTrigger = withContext(Carousel.PrevTrigger, "prevTrigger");

const StyledIndicatorGroup = withContext(
  Carousel.IndicatorGroup,
  "indicatorGroup",
);
export const IndicatorGroup = (
  props: ComponentProps<typeof StyledIndicatorGroup>,
) => {
  const carousel = useCarouselContext();

  return (
    <StyledIndicatorGroup {...props}>
      <For each={carousel().pageSnapPoints}>
        {(_, index) => <Indicator index={index()} />}
      </For>
    </StyledIndicatorGroup>
  );
};

export { CarouselContext as Context } from "@ark-ui/solid/carousel";

export interface CarouselDemoProps {
  variantProps?: Record<string, string>;
}

const carouselModes = ["basic", "multiple", "vertical", "autoplay"] as const;

const JumpToSlideTrigger = () => {
  const carousel = useCarouselContext();

  return (
    <DemoButton
      size="2xs"
      variant="outline"
      onClick={() => carousel().scrollToIndex(3)}
    >
      Jump to Slide 4
    </DemoButton>
  );
};

export const CarouselDemo = (props: CarouselDemoProps) => {
  const [mode, setMode] = createSignal<(typeof carouselModes)[number]>("basic");

  const isVertical = createMemo(() => mode() === "vertical");
  const isMultiple = createMemo(() => mode() === "multiple");
  const isAutoplay = createMemo(() => mode() === "autoplay");

  const slides = createMemo(() => (isMultiple() ? 8 : 5));
  const containerHeight = createMemo(() => (isVertical() ? "72" : "40"));

  return (
    <DemoVStack alignItems="start" gap="3" width="full" maxW="96">
      <DemoHStack gap="1" flexWrap="wrap">
        <For each={carouselModes}>
          {(value) => (
            <DemoButton
              size="2xs"
              variant={mode() === value ? "solid" : "outline"}
              onClick={() => setMode(value)}
            >
              {value}
            </DemoButton>
          )}
        </For>
      </DemoHStack>

      <DemoHStack justifyContent="space-between" width="full">
        <DemoBox textStyle="xs" color="fg.muted">
          {mode()} mode
        </DemoBox>
      </DemoHStack>

      <Root
        {...(props.variantProps ?? {})}
        slideCount={slides()}
        slidesPerPage={isMultiple() ? 2 : 1}
        orientation={isVertical() ? "vertical" : "horizontal"}
        autoplay={isAutoplay() ? { delay: 2000 } : undefined}
        loop={isAutoplay()}
        width="full"
        height={isVertical() ? "80" : undefined}
      >
        <ItemGroup>
          <For each={Array.from({ length: slides() }, (_, index) => index)}>
            {(index) => (
              <Item index={index}>
                <DemoBox
                  height={isVertical() ? "full" : containerHeight()}
                  width="full"
                  flex={isVertical() ? "1" : undefined}
                  borderRadius="l2"
                  bg="colorPalette.subtle.bg"
                  color="colorPalette.subtle.fg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="semibold"
                  textStyle="xl"
                >
                  Slide {index + 1}
                </DemoBox>
              </Item>
            )}
          </For>
        </ItemGroup>

        <Control>
          <JumpToSlideTrigger />
          <PrevTrigger
            asChild={(triggerProps) => (
              <DemoButton size="sm" variant="outline" {...triggerProps()}>
                Prev
              </DemoButton>
            )}
          />
          <IndicatorGroup />
          <NextTrigger
            asChild={(triggerProps) => (
              <DemoButton size="sm" {...triggerProps()}>
                Next
              </DemoButton>
            )}
          />
        </Control>
      </Root>
    </DemoVStack>
  );
};
