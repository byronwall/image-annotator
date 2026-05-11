import { Tabs } from "@ark-ui/solid/tabs";
import type { ComponentProps } from "solid-js";
import { createStyleContext } from "styled-system/jsx";
import { tabs } from "styled-system/recipes";

const { withProvider, withContext } = createStyleContext(tabs);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(Tabs.Root, "root");
export const RootProvider = withProvider(Tabs.RootProvider, "root");
export const List = withContext(Tabs.List, "list");
export const Trigger = withContext(Tabs.Trigger, "trigger");
export const Content = withContext(Tabs.Content, "content");
export const Indicator = withContext(Tabs.Indicator, "indicator");

export { TabsContext as Context } from "@ark-ui/solid/tabs";

export interface TabsDemoProps {
  variantProps?: Record<string, string>;
}

export const TabsDemo = (props: TabsDemoProps) => {
  return (
    <Root
      {...(props.variantProps ?? {})}
      defaultValue="one"
      width="full"
      maxW="96"
    >
      <List>
        <Trigger value="one">One</Trigger>
        <Trigger value="two">Two</Trigger>
        <Indicator />
      </List>
      <Content value="one">Tab one content</Content>
      <Content value="two">Tab two content</Content>
    </Root>
  );
};
