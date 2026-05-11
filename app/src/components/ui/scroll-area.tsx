import { ScrollArea } from "@ark-ui/solid/scroll-area";
import type { ComponentProps } from "solid-js";
import { createStyleContext } from "styled-system/jsx";
import { scrollArea } from "styled-system/recipes";
import { Box as DemoBox, VStack as DemoVStack } from "styled-system/jsx";
import { For as DemoFor } from "solid-js";

const { withProvider, withContext } = createStyleContext(scrollArea);

export type RootProps = ComponentProps<typeof Root>;
export type ContentProps = ComponentProps<typeof Content>;

export const Root = withProvider(ScrollArea.Root, "root");
export const RootProvider = withProvider(ScrollArea.Root, "root");
export const Content = withContext(ScrollArea.Content, "content");
export const Corner = withContext(ScrollArea.Corner, "corner");
export const Thumb = withContext(ScrollArea.Thumb, "thumb");
export const Scrollbar = withContext(ScrollArea.Scrollbar, "scrollbar");
export const Viewport = withContext(ScrollArea.Viewport, "viewport");

export { ScrollAreaContext as Context } from "@ark-ui/solid/scroll-area";

export interface ScrollAreaDemoProps {
  variantProps?: Record<string, string>;
}

export const ScrollAreaDemo = (props: ScrollAreaDemoProps) => {
  return (
    <Root
      {...(props.variantProps ?? {})}
      height="24"
      width="64"
      borderWidth="1px"
      borderColor="border"
    >
      <Viewport>
        <Content>
          <DemoVStack alignItems="stretch" gap="2" p="3">
            <DemoFor each={Array.from({ length: 12 }, (_, idx) => idx + 1)}>
              {(item) => <DemoBox>Scrollable line {item}</DemoBox>}
            </DemoFor>
          </DemoVStack>
        </Content>
      </Viewport>
      <Scrollbar orientation="vertical">
        <Thumb />
      </Scrollbar>
      <Scrollbar orientation="horizontal">
        <Thumb />
      </Scrollbar>
      <Corner />
    </Root>
  );
};
