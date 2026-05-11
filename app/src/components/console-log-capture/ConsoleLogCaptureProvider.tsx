import { createSignal, onCleanup, onMount } from "solid-js";
import { ConsoleLogCapturePanel } from "./ConsoleLogCapturePanel";
import { initializeConsoleLogCapture } from "./consoleLogCapture.store";

type ConsoleLogCaptureProviderProps = {
  shortcut?: string;
};

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest(
    "input, textarea, select, [contenteditable=''], [contenteditable='true']",
  );
};

export function ConsoleLogCaptureProvider(
  props: ConsoleLogCaptureProviderProps,
) {
  const [isOpen, setIsOpen] = createSignal(false);

  onMount(() => {
    initializeConsoleLogCapture();

    const shortcut = (props.shortcut ?? "mod+p").toLowerCase();
    const onKeyDown = (event: KeyboardEvent) => {
      if (shortcut !== "mod+p") return;
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.altKey || event.shiftKey) return;
      if (event.key.toLowerCase() !== "p") return;
      if (isEditableTarget(event.target)) return;

      event.preventDefault();
      setIsOpen((open) => !open);
    };

    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => window.removeEventListener("keydown", onKeyDown));
  });

  return (
    <ConsoleLogCapturePanel open={isOpen()} onClose={() => setIsOpen(false)} />
  );
}
