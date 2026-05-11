import { ark } from "@ark-ui/solid/factory";
import { For, createSignal, type ComponentProps } from "solid-js";
import { Box, HStack, VStack, createStyleContext } from "styled-system/jsx";
import { table } from "styled-system/recipes";
import { Button as DemoButton } from "./button";
import * as ScrollArea from "./scroll-area";

const { withProvider, withContext } = createStyleContext(table);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(ark.table, "root");
export const Body = withContext(ark.tbody, "body");
export const Caption = withContext(ark.caption, "caption");
export const Cell = withContext(ark.td, "cell");
export const Foot = withContext(ark.tfoot, "foot");
export const Head = withContext(ark.thead, "head");
export const Header = withContext(ark.th, "header");
export const Row = withContext(ark.tr, "row");

export interface TableDemoProps {
  variantProps?: Record<string, string>;
}

const products = [
  { id: 1, name: "Laptop", category: "Electronics", price: "$999.99" },
  { id: 2, name: "Coffee Maker", category: "Home", price: "$49.99" },
  { id: 3, name: "Desk Chair", category: "Furniture", price: "$150.00" },
  { id: 4, name: "Smartphone", category: "Electronics", price: "$799.99" },
  { id: 5, name: "Headphones", category: "Accessories", price: "$199.99" },
  { id: 6, name: "Monitor", category: "Electronics", price: "$299.99" },
  { id: 7, name: "Bookshelf", category: "Furniture", price: "$120.00" },
  { id: 8, name: "Mouse", category: "Accessories", price: "$29.99" },
];

export const TableDemo = (props: TableDemoProps) => {
  const [variant, setVariant] = createSignal<"plain" | "surface">("surface");
  const [striped, setStriped] = createSignal(true);
  const [interactive, setInteractive] = createSignal(true);
  const [columnBorder, setColumnBorder] = createSignal(true);
  const [stickyHeader, setStickyHeader] = createSignal(true);

  const baseVariantProps = () => {
    const source = props.variantProps ?? {};
    const {
      variant: _variant,
      striped: _striped,
      interactive: _interactive,
      columnBorder: _columnBorder,
      stickyHeader: _stickyHeader,
      ...rest
    } = source;
    return rest;
  };

  return (
    <VStack alignItems="start" gap="4" width="full" maxW="5xl">
      <HStack gap="1" flexWrap="wrap">
        <DemoButton
          size="2xs"
          variant={variant() === "surface" ? "solid" : "outline"}
          onClick={() => setVariant("surface")}
        >
          surface
        </DemoButton>
        <DemoButton
          size="2xs"
          variant={variant() === "plain" ? "solid" : "outline"}
          onClick={() => setVariant("plain")}
        >
          plain
        </DemoButton>
        <DemoButton
          size="2xs"
          variant={striped() ? "solid" : "outline"}
          onClick={() => setStriped((value) => !value)}
        >
          striped {striped() ? "on" : "off"}
        </DemoButton>
        <DemoButton
          size="2xs"
          variant={interactive() ? "solid" : "outline"}
          onClick={() => setInteractive((value) => !value)}
        >
          interactive {interactive() ? "on" : "off"}
        </DemoButton>
        <DemoButton
          size="2xs"
          variant={columnBorder() ? "solid" : "outline"}
          onClick={() => setColumnBorder((value) => !value)}
        >
          columnBorder {columnBorder() ? "on" : "off"}
        </DemoButton>
        <DemoButton
          size="2xs"
          variant={stickyHeader() ? "solid" : "outline"}
          onClick={() => setStickyHeader((value) => !value)}
        >
          stickyHeader {stickyHeader() ? "on" : "off"}
        </DemoButton>
      </HStack>

      <ScrollArea.Root
        size="sm"
        scrollbar="visible"
        borderWidth="1px"
        borderRadius="l3"
        width="full"
        height="72"
      >
        <ScrollArea.Viewport>
          <ScrollArea.Content>
            <Root
              {...baseVariantProps()}
              variant={variant()}
              striped={striped()}
              interactive={interactive()}
              columnBorder={columnBorder()}
              stickyHeader={stickyHeader()}
            >
              <Caption>
                <Box py="2" textStyle="xs" color="fg.muted">
                  Product inventory
                </Box>
              </Caption>
              <Head>
                <Row>
                  <Header>Product</Header>
                  <Header>Category</Header>
                  <Header textAlign="right">Price</Header>
                </Row>
              </Head>
              <Body>
                <For each={products}>
                  {(item) => (
                    <Row>
                      <Cell>{item.name}</Cell>
                      <Cell>{item.category}</Cell>
                      <Cell textAlign="right">{item.price}</Cell>
                    </Row>
                  )}
                </For>
              </Body>
              <Foot>
                <Row>
                  <Cell colSpan={2}>Total</Cell>
                  <Cell textAlign="right">$2,648.95</Cell>
                </Row>
              </Foot>
            </Root>
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical">
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
        <ScrollArea.Scrollbar orientation="horizontal">
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner />
      </ScrollArea.Root>
    </VStack>
  );
};
