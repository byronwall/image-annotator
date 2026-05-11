import { createMemo, createSignal, Show } from "solid-js";
import { VisuallyHidden, VStack } from "styled-system/jsx";
import { Button } from "./button";
import { Span } from "./span";

export interface DisplayValueProps<T> {
  value?: T | null | undefined;
  formatValue?: (value: NonNullable<T>) => string | null | undefined;
}

export const DisplayValue = <T,>(props: DisplayValueProps<T>) => {
  const formattedValue = createMemo(() => {
    const value = props.value;
    const formatValue = props.formatValue;
    return isNotEmpty(value) ? (formatValue?.(value) ?? String(value)) : null;
  });

  return (
    <Show
      when={formattedValue() != null}
      fallback={
        <>
          <Span color="fg.subtle" aria-hidden>
            -
          </Span>
          <VisuallyHidden>No value available</VisuallyHidden>
        </>
      }
    >
      {formattedValue()}
    </Show>
  );
};

const isString = (value: unknown): value is string => typeof value === "string";

const isNotEmpty = <T,>(value: T | null | undefined): value is NonNullable<T> => {
  if (value == null) return false;
  if (isString(value) || Array.isArray(value)) return value.length > 0;
  return true;
};

export interface DisplayValueDemoProps {
  variantProps?: Record<string, string>;
}

export const DisplayValueDemo = (_props: DisplayValueDemoProps) => {
  const [value, setValue] = createSignal<number | null>(2499.5);

  return (
    <VStack alignItems="start" gap="3">
      <Button
        size="xs"
        variant="outline"
        onClick={() => setValue((prev) => (prev == null ? 2499.5 : null))}
      >
        Toggle value
      </Button>
      <DisplayValue
        value={value()}
        formatValue={(nextValue) => `$${nextValue.toFixed(2)}`}
      />
    </VStack>
  );
};
