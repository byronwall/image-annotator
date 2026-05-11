import { Menu, useMenuItemContext } from "@ark-ui/solid/menu";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  SaveIcon,
  ScissorsIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-solid";
import type { ComponentProps } from "solid-js";
import { Show } from "solid-js";
import { Portal } from "solid-js/web";
import {
  Box,
  createStyleContext,
  type HTMLStyledProps,
} from "styled-system/jsx";
import { menu } from "styled-system/recipes";
import { Button as DemoButton } from "./button";

const { withRootProvider, withContext } = createStyleContext(menu);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withRootProvider(Menu.Root, {
  defaultProps: () => ({ unmountOnExit: true, lazyMount: true }),
});
export const RootProvider = withRootProvider(Menu.Root, {
  defaultProps: () => ({ unmountOnExit: true, lazyMount: true }),
});
export const Arrow = withContext(Menu.Arrow, "arrow");
export const ArrowTip = withContext(Menu.ArrowTip, "arrowTip");
export const CheckboxItem = withContext(Menu.CheckboxItem, "item");
export const Content = withContext(Menu.Content, "content");
export const ContextTrigger = withContext(
  Menu.ContextTrigger,
  "contextTrigger",
);
export const Indicator = withContext(Menu.Indicator, "indicator", {
  defaultProps: () => ({ children: <ChevronDownIcon /> }),
});
export const Item = withContext(Menu.Item, "item");
export const ItemGroup = withContext(Menu.ItemGroup, "itemGroup");
export const ItemGroupLabel = withContext(
  Menu.ItemGroupLabel,
  "itemGroupLabel",
);
export const ItemText = withContext(Menu.ItemText, "itemText");
export const Positioner = withContext(Menu.Positioner, "positioner");
export const RadioItem = withContext(Menu.RadioItem, "item");
export const RadioItemGroup = withContext(Menu.RadioItemGroup, "itemGroup");
export const Separator = withContext(Menu.Separator, "separator");
export const Trigger = withContext(Menu.Trigger, "trigger");
export const TriggerItem = withContext(Menu.TriggerItem, "item");

export {
  MenuContext as Context,
  type MenuSelectionDetails as SelectionDetails,
} from "@ark-ui/solid/menu";

const StyledItemIndicator = withContext(Menu.ItemIndicator, "itemIndicator");

export const ItemIndicator = (props: HTMLStyledProps<"div">) => {
  const item = useMenuItemContext();

  return (
    <Show when={item().checked} fallback={<svg aria-hidden="true" />}>
      <StyledItemIndicator {...props}>
        <CheckIcon />
      </StyledItemIndicator>
    </Show>
  );
};

export interface MenuDemoProps {
  variantProps?: Record<string, string>;
}

const MenuShortcut = (props: { value: string }) => (
  <Box as="span" textStyle="xs" color="fg.muted" marginInlineStart="auto">
    {props.value}
  </Box>
);

export const MenuDemo = (props: MenuDemoProps) => {
  const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
  const size = () =>
    sizes.find((value) => value === props.variantProps?.size) ?? "md";

  return (
    <Root
      {...(props.variantProps ?? {})}
      positioning={{ placement: "bottom-start" }}
      size={size()}
    >
      <Trigger
        asChild={(props) => {
          if (size() === "xs") {
            return (
              <DemoButton {...props()} size="xs">
                Open Menu
              </DemoButton>
            );
          }
          if (size() === "sm") {
            return (
              <DemoButton {...props()} size="sm">
                Open Menu
              </DemoButton>
            );
          }
          if (size() === "md") {
            return (
              <DemoButton {...props()} size="md">
                Open Menu
              </DemoButton>
            );
          }
          if (size() === "lg") {
            return (
              <DemoButton {...props()} size="lg">
                Open Menu
              </DemoButton>
            );
          }
          return (
            <DemoButton {...props()} size="xl">
              Open Menu
            </DemoButton>
          );
        }}
      />
      <Portal>
        <Positioner>
          <Content>
            <ItemGroup>
              <ItemGroupLabel>File</ItemGroupLabel>
              <Item value="new-file">
                <FileIcon />
                <ItemText>New File</ItemText>
                <MenuShortcut value="Cmd+N" />
              </Item>
              <Item value="new-folder">
                <FolderIcon />
                <ItemText>New Folder</ItemText>
                <MenuShortcut value="Cmd+Shift+N" />
              </Item>
              <Item value="save">
                <SaveIcon />
                <ItemText>Save</ItemText>
                <MenuShortcut value="Cmd+S" />
              </Item>
            </ItemGroup>
            <Separator />
            <ItemGroup>
              <ItemGroupLabel>Edit</ItemGroupLabel>
              <Item value="find">
                <SearchIcon />
                <ItemText>Find</ItemText>
                <MenuShortcut value="Cmd+F" />
              </Item>
              <Item value="cut">
                <ScissorsIcon />
                <ItemText>Cut</ItemText>
                <MenuShortcut value="Cmd+X" />
              </Item>
              <Root>
                <TriggerItem justifyContent="space-between">
                  <Box display="inline-flex" alignItems="center" gap="2">
                    <SettingsIcon />
                    <ItemText>Preferences</ItemText>
                  </Box>
                  <Box marginInlineStart="auto" display="inline-flex">
                    <ChevronRightIcon />
                  </Box>
                </TriggerItem>
                <Portal>
                  <Positioner>
                    <Content>
                      <CheckboxItem value="autosave" checked>
                        Auto-save
                        <ItemIndicator />
                      </CheckboxItem>
                      <CheckboxItem value="line-numbers" checked>
                        Show line numbers
                        <ItemIndicator />
                      </CheckboxItem>
                      <Separator />
                      <Item value="theme-light">Theme: Light</Item>
                      <Item value="theme-dark">Theme: Dark</Item>
                      <Item value="theme-system">Theme: System</Item>
                    </Content>
                  </Positioner>
                </Portal>
              </Root>
            </ItemGroup>
            <Item value="new">
              <ItemText>Open Command Palette</ItemText>
              <MenuShortcut value="Cmd+K" />
            </Item>
          </Content>
        </Positioner>
      </Portal>
    </Root>
  );
};
