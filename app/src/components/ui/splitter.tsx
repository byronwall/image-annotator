import { Splitter } from "@ark-ui/solid/splitter";
import { Show } from "solid-js";
import type { ComponentProps } from "solid-js";
import { isServer } from "solid-js/web";
import { createStyleContext } from "styled-system/jsx";
import { splitter } from "styled-system/recipes";
import {
  Box as DemoBox,
  HStack as DemoHStack,
  VStack as DemoVStack,
} from "styled-system/jsx";

const { withProvider, withContext } = createStyleContext(splitter);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(Splitter.Root, "root", {
  forwardProps: ["orientation", "panels", "defaultSize"],
});
export const RootProvider = withProvider(Splitter.RootProvider, "root");
export const Panel = withContext(Splitter.Panel, "panel");
export const ResizeTrigger = withContext(
  Splitter.ResizeTrigger,
  "resizeTrigger",
);

export { SplitterContext as Context } from "@ark-ui/solid/splitter";

export interface SplitterDemoProps {
  variantProps?: Record<string, string>;
}

export const SplitterDemo = (props: SplitterDemoProps) => {
  return (
    <DemoVStack alignItems="stretch" gap="4" width="full" maxW="6xl">
      <Show
        when={!isServer}
        fallback={
          <DemoBox
            p="3"
            borderWidth="1px"
            borderColor="border"
            borderRadius="l2"
            textStyle="sm"
            color="fg.muted"
          >
            Splitter preview is interactive on the client.
          </DemoBox>
        }
      >
        <DemoHStack alignItems="start" gap="6" flexWrap="wrap">
        <DemoVStack alignItems="stretch" gap="4" flex="1" minW="72">
          <DemoBox textStyle="xs" color="fg.muted">
            Horizontal
          </DemoBox>
          <Root
            {...(props.variantProps ?? {})}
            panels={[
              { id: "h-left", minSize: 20 },
              { id: "h-right", minSize: 20 },
            ]}
            defaultSize={[50, 50]}
            orientation="horizontal"
            height="24"
            width="full"
          >
            <Panel id="h-left">
              <DemoBox p="3">Left</DemoBox>
            </Panel>
            <ResizeTrigger
              id="h-left:h-right"
              aria-label="Resize left and right"
            />
            <Panel id="h-right">
              <DemoBox p="3">Right</DemoBox>
            </Panel>
          </Root>

          <DemoBox textStyle="xs" color="fg.muted">
            Three Panes
          </DemoBox>
          <Root
            {...(props.variantProps ?? {})}
            panels={[
              { id: "m-a", minSize: 20 },
              { id: "m-b", minSize: 30 },
              { id: "m-c", minSize: 20 },
            ]}
            defaultSize={[25, 50, 25]}
            orientation="horizontal"
            height="24"
            width="full"
          >
            <Panel id="m-a">
              <DemoBox p="3">A</DemoBox>
            </Panel>
            <ResizeTrigger id="m-a:m-b" aria-label="Resize pane A and B" />
            <Panel id="m-b">
              <DemoBox p="3">B</DemoBox>
            </Panel>
            <ResizeTrigger id="m-b:m-c" aria-label="Resize pane B and C" />
            <Panel id="m-c">
              <DemoBox p="3">C</DemoBox>
            </Panel>
          </Root>
        </DemoVStack>

        <DemoVStack alignItems="stretch" gap="4" flex="1" minW="72">
          <DemoBox textStyle="xs" color="fg.muted">
            Vertical
          </DemoBox>
          <Root
            {...(props.variantProps ?? {})}
            panels={[
              { id: "v-top", minSize: 20 },
              { id: "v-bottom", minSize: 20 },
            ]}
            defaultSize={[45, 55]}
            orientation="vertical"
            width="full"
            minH="72"
            height="72"
          >
            <Panel id="v-top">
              <DemoBox p="3">Top</DemoBox>
            </Panel>
            <ResizeTrigger
              id="v-top:v-bottom"
              aria-label="Resize top and bottom"
            />
            <Panel id="v-bottom">
              <DemoBox p="3">Bottom</DemoBox>
            </Panel>
          </Root>
        </DemoVStack>
        </DemoHStack>
      </Show>
    </DemoVStack>
  );
};
