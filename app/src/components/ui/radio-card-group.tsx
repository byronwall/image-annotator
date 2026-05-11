import { RadioGroup } from "@ark-ui/solid/radio-group";
import type { ComponentProps } from "solid-js";
import { createStyleContext } from "styled-system/jsx";
import { radioCardGroup } from "styled-system/recipes";
import { HStack as DemoHStack } from "styled-system/jsx";

const { withProvider, withContext } = createStyleContext(radioCardGroup);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(RadioGroup.Root, "root");
export const RootProvider = withProvider(RadioGroup.RootProvider, "root");
export const Indicator = withContext(RadioGroup.Indicator, "indicator");
export const Item = withContext(RadioGroup.Item, "item");
export const ItemControl = withContext(RadioGroup.ItemControl, "itemControl");
export const ItemText = withContext(RadioGroup.ItemText, "itemText");
export const Label = withContext(RadioGroup.Label, "label");
export const ItemHiddenInput = RadioGroup.ItemHiddenInput;

export { RadioGroupContext as Context } from "@ark-ui/solid/radio-group";

export interface RadioCardGroupDemoProps {
  variantProps?: Record<string, string>;
}

export const RadioCardGroupDemo = (props: RadioCardGroupDemoProps) => {
  return (
    <Root {...(props.variantProps ?? {})} value="free" maxW="96" width="full">
      <Label>Plan</Label>
      <DemoHStack gap="3">
        <Item value="free">
          <ItemControl>
            <Indicator />
          </ItemControl>
          <ItemText>Free</ItemText>
          <ItemHiddenInput />
        </Item>
        <Item value="pro">
          <ItemControl>
            <Indicator />
          </ItemControl>
          <ItemText>Pro</ItemText>
          <ItemHiddenInput />
        </Item>
      </DemoHStack>
    </Root>
  );
};
