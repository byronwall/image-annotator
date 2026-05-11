import { ToggleGroup } from "@ark-ui/solid/toggle-group";
import type { ComponentProps } from "solid-js";
import { createStyleContext } from "styled-system/jsx";
import { toggleGroup } from "styled-system/recipes";

const { withProvider, withContext } = createStyleContext(toggleGroup);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(ToggleGroup.Root, "root");
export const RootProvider = withProvider(ToggleGroup.RootProvider, "root");
export const Item = withContext(ToggleGroup.Item, "item");

export { ToggleGroupContext as Context } from "@ark-ui/solid/toggle-group";

export interface ToggleGroupDemoProps {
  variantProps?: Record<string, string>;
}

export const ToggleGroupDemo = (props: ToggleGroupDemoProps) => {
  return (
    <Root {...(props.variantProps ?? {})} defaultValue={["list"]}>
      <Item value="board">Board</Item>
      <Item value="list">List</Item>
      <Item value="table">Table</Item>
    </Root>
  );
};
