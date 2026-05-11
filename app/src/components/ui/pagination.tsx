import { Pagination, usePaginationContext } from "@ark-ui/solid/pagination";
import { EllipsisIcon } from "lucide-solid";
import { type ComponentProps, For, type JSX } from "solid-js";
import { createStyleContext } from "styled-system/jsx";
import { pagination } from "styled-system/recipes";
import { IconButton } from "./icon-button";
import { Button as DemoButton } from "./button";
import { HStack as DemoHStack } from "styled-system/jsx";

const { withProvider, withContext } = createStyleContext(pagination);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(Pagination.Root, "root");
export const RootProvider = withProvider(Pagination.RootProvider, "root");
export const Item = withContext(Pagination.Item, "item");
export const Ellipsis = withContext(Pagination.Ellipsis, "ellipsis");
export const PrevTrigger = withContext(Pagination.PrevTrigger, "prevTrigger");
export const NextTrigger = withContext(Pagination.NextTrigger, "nextTrigger");

export { PaginationContext as Context } from "@ark-ui/solid/pagination";

export interface PaginationItemsProps extends JSX.HTMLAttributes<HTMLElement> {
  render: (page: {
    type: "page";
    value: number;
    selected: boolean;
  }) => JSX.Element;
  ellipsis?: JSX.Element | undefined;
}

export const Items = (props: PaginationItemsProps) => {
  const ctx = usePaginationContext();

  return (
    <For each={ctx().pages}>
      {(page, index) => {
        if (page.type === "ellipsis") {
          return (
            <Ellipsis index={index()}>
              {props.ellipsis || (
                <IconButton as="span" colorPalette="gray">
                  <EllipsisIcon />
                </IconButton>
              )}
            </Ellipsis>
          );
        }

        return (
          <Item type="page" value={page.value}>
            {props.render({ ...page, selected: ctx().page === page.value })}
          </Item>
        );
      }}
    </For>
  );
};

export interface PaginationDemoProps {
  variantProps?: Record<string, string>;
}

export const PaginationDemo = (props: PaginationDemoProps) => {
  return (
    <Root {...(props.variantProps ?? {})} count={120} pageSize={10}>
      <DemoHStack gap="2">
        <PrevTrigger
          asChild={(props) => <DemoButton {...props()}>Prev</DemoButton>}
        />
        <Items
          render={(page) => (
            <DemoButton variant={page.selected ? "solid" : "outline"}>
              {page.value}
            </DemoButton>
          )}
        />
        <NextTrigger
          asChild={(props) => <DemoButton {...props()}>Next</DemoButton>}
        />
      </DemoHStack>
    </Root>
  );
};
