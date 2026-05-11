import { ark } from "@ark-ui/solid/factory";
import { Fieldset } from "@ark-ui/solid/fieldset";
import type { ComponentProps } from "solid-js";
import { VStack, createStyleContext } from "styled-system/jsx";
import { fieldset } from "styled-system/recipes";
import * as DemoCheckbox from "./checkbox";

const { withProvider, withContext } = createStyleContext(fieldset);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(Fieldset.Root, "root");
export const RootProvider = withProvider(Fieldset.RootProvider, "root");
export const Legend = withContext(Fieldset.Legend, "legend");
export const HelperText = withContext(Fieldset.HelperText, "helperText");
export const ErrorText = withContext(Fieldset.ErrorText, "errorText");
export const Content = withContext(ark.div, "content");
export const Control = withContext(ark.div, "control");

export { FieldsetContext as Context } from "@ark-ui/solid/fieldset";

export interface FieldsetDemoProps {
  variantProps?: Record<string, string>;
}

const Option = (props: { label: string; checked?: boolean; disabled?: boolean }) => (
  <DemoCheckbox.Root defaultChecked={props.checked} disabled={props.disabled}>
    <DemoCheckbox.HiddenInput />
    <DemoCheckbox.Control>
      <DemoCheckbox.Indicator />
    </DemoCheckbox.Control>
    <DemoCheckbox.Label>{props.label}</DemoCheckbox.Label>
  </DemoCheckbox.Root>
);

export const FieldsetDemo = (props: FieldsetDemoProps) => {
  return (
    <VStack alignItems="stretch" gap="5" width="full" maxW="3xl">
      <Root {...(props.variantProps ?? {})}>
        <Control>
          <Legend>Notifications</Legend>
          <HelperText>Choose where to receive updates.</HelperText>
        </Control>
        <Content>
          <Option label="Email alerts" checked />
          <Option label="SMS alerts" />
          <Option label="Weekly summary" checked />
        </Content>
      </Root>

      <Root {...(props.variantProps ?? {})} invalid>
        <Control>
          <Legend>Contact Preference</Legend>
          <HelperText>Select at least one channel.</HelperText>
          <ErrorText>Choose one notification channel.</ErrorText>
        </Control>
        <Content>
          <Option label="Product announcements" />
          <Option label="Security updates" />
        </Content>
      </Root>

      <Root {...(props.variantProps ?? {})} disabled>
        <Control>
          <Legend>Managed Settings</Legend>
          <HelperText>These options are locked by policy.</HelperText>
        </Control>
        <Content>
          <Option label="Audit log export" checked disabled />
          <Option label="Retention alerts" disabled />
        </Content>
      </Root>
    </VStack>
  );
};
