# create-style-context.mjs Context Reactivity Walkthrough + MREs

This doc walks through `app/styled-system/jsx/create-style-context.mjs` and gives copy/paste MREs for [Solid Playground](https://playground.solidjs.com/).

## Updated verdict (after playground validation)

Your observation is correct. In Solid, context does not deep-track object fields. Reactivity depends on what value type you put into context and what the consumer reads reactively.

That matches your logs:
- provider memo recomputes
- consumer effect does not rerun
- UI stays stale

## Solid source trace (from your local clone)

Source: `/Users/byronwall/Projects/solid/packages/solid/src/reactive/signal.ts`

1. `createContext` stores `id`, `Provider`, and `defaultValue`.
   - `createContext(...)` creates `{ id, Provider: createProvider(id, options), defaultValue }`
   - Lines around `1193-1204`.
2. `useContext` is a direct lookup, not a tracked accessor wrapper.
   - `Owner.context[context.id]` is returned directly.
   - Lines around `1214-1218`.
3. `Provider` writes `props.value` into owner context inside a render effect.
   - `Owner!.context = { ...Owner!.context, [id]: props.value }`
   - Lines around `1756-1767`.

Interpretation:
- Provider reactivity is about re-running the provider effect and updating the stored context entry.
- Consumer reactivity is separate: `useContext` returns the stored value as-is.
- If stored value is a plain object snapshot, consumer reads like `ctx.count` are plain property reads.
- If stored value is an accessor/store, consumer can subscribe by calling accessor/reading store in a tracked scope.

## Reactive vs non-reactive value flow

Case A: `value={value()}` where `value` is a memo returning an object:
- Provider stores plain object snapshot.
- Consumer gets plain object.
- `ctx.count` is non-reactive unless consumer component re-executes for some other reason.

Case B: `value={value}` where `value` is a memo accessor:
- Provider stores function accessor.
- Consumer gets accessor.
- `ctx().count` is reactive because `ctx()` tracks memo dependencies in effect/JSX scope.
- This works even if consumer component function does not rerun, because the tracked unit is the accessor call itself.

Case C: `value={{ count }}` where `count` is a signal accessor:
- Provider stores object containing accessor.
- Consumer reads `ctx.count()` and tracks signal.

## Why this matters in `create-style-context.mjs`

In your file:
- `withRootProvider` / `withProvider` provide `slotStyles()` (plain object snapshot).
- `withContext` reads `slotStyles[slot]` from `useContext(...)`.

That combination is equivalent to Case A and can go stale.

## How to use these MREs

1. Open [Solid Playground](https://playground.solidjs.com/).
2. Replace everything with one MRE at a time.
3. Open browser console.
4. Click buttons and compare observed output to "Expected" sections.

---

## MRE 1: Plain object snapshot in context (stale consumer)

Expected:
- Provider memo logs new values.
- Consumer effect logs only once.
- UI does **not** update.

```tsx
import { createSignal, createMemo, createContext, useContext, createEffect } from "solid-js";
import { render } from "solid-js/web";

const Ctx = createContext();

function Provider(props) {
  const [count, setCount] = createSignal(0);

  const value = createMemo(() => {
    const next = { count: count(), label: count() % 2 ? "odd" : "even" };
    console.log("provider memo recompute", next);
    return next;
  });

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>inc</button>
      <Ctx.Provider value={value()}>{props.children}</Ctx.Provider>
    </>
  );
}

function Consumer() {
  const ctx = useContext(Ctx);

  createEffect(() => {
    console.log("consumer sees", ctx.count, ctx.label);
  });

  return <div>count: {ctx.count} ({ctx.label})</div>;
}

render(() => (
  <Provider>
    <Consumer />
  </Provider>
), document.getElementById("app"));
```

---

## MRE 2: Memo accessor in context (reactive consumer)

Expected:
- Consumer effect reruns every click.
- UI updates every click.
- Reason: reactive subscription is on `ctx()` (memo accessor), not on context object replacement.

```tsx
import { createSignal, createMemo, createContext, useContext, createEffect } from "solid-js";
import { render } from "solid-js/web";

const Ctx = createContext();

function Provider(props) {
  const [count, setCount] = createSignal(0);
  const value = createMemo(() => ({ count: count(), label: count() % 2 ? "odd" : "even" }));
  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>inc</button>
      <Ctx.Provider value={value}>{props.children}</Ctx.Provider>
    </>
  );
}

function Consumer() {
  const ctx = useContext(Ctx);

  createEffect(() => {
    console.log("consumer sees", ctx().count, ctx().label);
  });

  return <div>count: {ctx().count} ({ctx().label})</div>;
}

render(() => (
  <Provider>
    <Consumer />
  </Provider>
), document.getElementById("app"));
```

---

## MRE 3: Direct analogue of create-style-context (stale)

Expected:
- `slotStyles` recomputes in provider.
- consumer output remains stale.

```tsx
import { createSignal, createMemo, createContext, useContext, createEffect } from "solid-js";
import { render } from "solid-js/web";

const StyleCtx = createContext();

function RootProvider(props) {
  const [size, setSize] = createSignal("sm");

  const slotStyles = createMemo(() => {
    const s = size();
    const styles = {
      root: s === "sm" ? "padding:4px; border:1px solid #999" : "padding:18px; border:3px solid #333",
      label: s === "sm" ? "font-size:12px; color:#444" : "font-size:24px; color:#111",
      _classNameMap: { root: "root-class", label: "label-class" },
    };
    console.log("slotStyles recompute", s, styles);
    return styles;
  });

  return (
    <>
      <button onClick={() => setSize((v) => (v === "sm" ? "lg" : "sm"))}>toggle size</button>
      <StyleCtx.Provider value={slotStyles()}>{props.children}</StyleCtx.Provider>
    </>
  );
}

function WithContext(props) {
  const slotStyles = useContext(StyleCtx);
  const slot = props.slot;

  const resolved = createMemo(() => {
    const result = `${slotStyles[slot]} ; class=${slotStyles._classNameMap?.[slot]}`;
    console.log("resolved recompute", slot, result);
    return result;
  });

  createEffect(() => {
    console.log("effect sees", slot, resolved());
  });

  return <pre>{resolved()}</pre>;
}

render(() => (
  <RootProvider>
    <WithContext slot="root" />
    <WithContext slot="label" />
  </RootProvider>
), document.getElementById("app"));
```

---

## MRE 4: Direct analogue fixed with accessor context (reactive)

Expected:
- Toggle updates both slot outputs.
- Consumer effects rerun.

```tsx
import { createSignal, createMemo, createContext, useContext, createEffect } from "solid-js";
import { render } from "solid-js/web";

const StyleCtx = createContext();

function RootProvider(props) {
  const [size, setSize] = createSignal("sm");

  const slotStyles = createMemo(() => {
    const s = size();
    return {
      root: s === "sm" ? "padding:4px; border:1px solid #999" : "padding:18px; border:3px solid #333",
      label: s === "sm" ? "font-size:12px; color:#444" : "font-size:24px; color:#111",
      _classNameMap: { root: "root-class", label: "label-class" },
    };
  });

  return (
    <>
      <button onClick={() => setSize((v) => (v === "sm" ? "lg" : "sm"))}>toggle size</button>
      <StyleCtx.Provider value={slotStyles}>{props.children}</StyleCtx.Provider>
    </>
  );
}

function WithContext(props) {
  const slotStyles = useContext(StyleCtx); // accessor
  const slot = props.slot;

  const resolved = createMemo(() => {
    const styles = slotStyles();
    return `${styles[slot]} ; class=${styles._classNameMap?.[slot]}`;
  });

  createEffect(() => {
    console.log("effect sees", slot, resolved());
  });

  return <pre>{resolved()}</pre>;
}

render(() => (
  <RootProvider>
    <WithContext slot="root" />
    <WithContext slot="label" />
  </RootProvider>
), document.getElementById("app"));
```

---

## MRE 5: `createComponent` + getter returning snapshot (stale)

Expected:
- Provider getter runs and memo recomputes.
- Consumer stays stale (`ctx.count` does not update).
- This mirrors `create-style-context.mjs` using `get value() { return slotStyles() }`.

```tsx
import { createSignal, createMemo, createContext, useContext, createEffect } from "solid-js";
import { render, createComponent } from "solid-js/web";

const Ctx = createContext();

function ProviderWithCreateComponent(props) {
  const [count, setCount] = createSignal(0);
  const value = createMemo(() => {
    const next = { count: count(), label: count() % 2 ? "odd" : "even" };
    console.log("provider memo recompute", next);
    return next;
  });

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>inc</button>
      {createComponent(Ctx.Provider, {
        get value() {
          console.log("provider getter read -> snapshot");
          return value();
        },
        get children() {
          return props.children;
        }
      })}
    </>
  );
}

function Consumer() {
  const ctx = useContext(Ctx);
  createEffect(() => {
    console.log("consumer sees", ctx.count, ctx.label);
  });
  return <div>count: {ctx.count} ({ctx.label})</div>;
}

render(() => (
  <ProviderWithCreateComponent>
    <Consumer />
  </ProviderWithCreateComponent>
), document.getElementById("app"));
```

---

## MRE 6: `createComponent` + getter returning accessor (reactive)

Expected:
- Consumer updates on every click.
- Reactivity comes from `ctx()` subscription, not from context object replacement.

```tsx
import { createSignal, createMemo, createContext, useContext, createEffect } from "solid-js";
import { render, createComponent } from "solid-js/web";

const Ctx = createContext();

function ProviderWithCreateComponent(props) {
  const [count, setCount] = createSignal(0);
  const value = createMemo(() => ({ count: count(), label: count() % 2 ? "odd" : "even" }));

  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>inc</button>
      {createComponent(Ctx.Provider, {
        get value() {
          console.log("provider getter read -> accessor");
          return value;
        },
        get children() {
          return props.children;
        }
      })}
    </>
  );
}

function Consumer() {
  const ctx = useContext(Ctx);
  createEffect(() => {
    console.log("consumer sees", ctx().count, ctx().label);
  });
  return <div>count: {ctx().count} ({ctx().label})</div>;
}

render(() => (
  <ProviderWithCreateComponent>
    <Consumer />
  </ProviderWithCreateComponent>
), document.getElementById("app"));
```

---

## `createComponent` vs TSX: does it change context reactivity?

Short answer: no.

- TSX component syntax compiles to runtime `createComponent` calls.
- A getter-based prop object in manual `createComponent(...)` is effectively the same prop flow mechanism.
- The deciding factor is still the shape of `value`:
  - snapshot object (`value()`) => stale consumer property reads
  - accessor/store (`value` or `{ count }`) => reactive consumer reads

Mapping to MREs:
- TSX snapshot: MRE 1
- TSX accessor: MRE 2
- `createComponent` snapshot getter: MRE 5
- `createComponent` accessor getter: MRE 6

---

## Practical implication for `create-style-context.mjs`

Your suspicion is valid: context consumers can go stale with the current plain-object context value usage.

A robust fix pattern is:
- provide accessor as context value (`value={slotStyles}`)
- in consumers, read `slotStyles()` inside memo/effect before indexing slot keys

## Applied fix in `create-style-context.mjs`

I updated the file to use the robust pattern above.

### Problem summary

- Previous providers passed snapshot objects:
  - `get value() { return slotStyles() }`
- Consumer read plain properties from `useContext(...)` result:
  - `slotStyles[slot]`
- This matches stale MRE behavior (`value={value()}`) where provider recomputes but consumers do not subscribe to underlying reactive source.

### What changed

1. Providers now pass accessor values:
   - `get value() { return slotStyles }`
2. Consumer now normalizes context value to accessor form:
   - `const getSlotStyles = typeof slotStyles === "function" ? slotStyles : () => slotStyles`
3. Consumer memo reads current styles through accessor:
   - `const currentSlotStyles = getSlotStyles()`
   - then indexes `currentSlotStyles[slot]`

### Good code pattern (the one now used)

```tsx
// Provider side
const slotStyles = createMemo(() => computeStyles());
return createComponent(StyleContext.Provider, {
  get value() {
    return slotStyles; // pass accessor, not snapshot
  },
  get children() {
    return props.children;
  }
});

// Consumer side
const slotStyles = useStyleContext(componentName, slot);
const getSlotStyles = typeof slotStyles === "function" ? slotStyles : () => slotStyles;

const resolvedProps = createMemo(() => {
  const styles = getSlotStyles(); // tracked read
  return {
    class: styles[slot]
  };
});
```

### Why this is safe

- New providers and consumers are fully reactive.
- Consumer keeps a compatibility fallback for legacy snapshot context values.
- This directly aligns with MRE 6 behavior and Solid's source-level context flow.
