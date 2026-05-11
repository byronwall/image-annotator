import { Field } from "@ark-ui/solid/field";
import type { ComponentProps } from "solid-js";
import { VStack, createStyleContext } from "styled-system/jsx";
import { field } from "styled-system/recipes";
import { Input } from "./input";

const { withProvider, withContext } = createStyleContext(field);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(Field.Root, "root");
export const RootProvider = withProvider(Field.RootProvider, "root");
export const ErrorText = withContext(Field.ErrorText, "errorText");
export const HelperText = withContext(Field.HelperText, "helperText");
export const Label = withContext(Field.Label, "label");
export const RequiredIndicator = withContext(
  Field.RequiredIndicator,
  "requiredIndicator",
);

export { FieldContext as Context } from "@ark-ui/solid/field";

export interface FieldDemoProps {
  variantProps?: Record<string, string>;
}

export const FieldDemo = (props: FieldDemoProps) => {
  return (
    <VStack alignItems="stretch" gap="4" width="72">
      <Root {...(props.variantProps ?? {})}>
        <Label>Display Name</Label>
        <Input placeholder="Enter display name" />
        <HelperText>Shown on your public profile.</HelperText>
      </Root>

      <Root {...(props.variantProps ?? {})} required>
        <Label>
          Email
          <RequiredIndicator />
        </Label>
        <Input type="email" placeholder="name@company.com" />
        <HelperText>Used for account notifications.</HelperText>
      </Root>

      <Root {...(props.variantProps ?? {})} invalid>
        <Label>Username</Label>
        <Input value="admin" />
        <ErrorText>This username is unavailable.</ErrorText>
      </Root>

      <Root {...(props.variantProps ?? {})} disabled>
        <Label>Workspace</Label>
        <Input value="Panda Park" />
        <HelperText>Managed by your organization admin.</HelperText>
      </Root>
    </VStack>
  );
};
