import { Router } from "@solidjs/router";
import { MetaProvider } from "@solidjs/meta";
import { FileRoutes } from "@solidjs/start/router";
import {
  ErrorBoundary,
  Suspense,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { ConsoleLogCaptureProvider } from "./components/console-log-capture";
import { GlobalErrorOverlay } from "./components/errors/GlobalErrorOverlay";

import "./index.css";

type ClientExceptionState = {
  source: "error" | "unhandledrejection";
  error: unknown;
};

export default function App() {
  const [clientException, setClientException] =
    createSignal<ClientExceptionState | null>(null);
  const serverBase = import.meta.env.SERVER_BASE_URL || "/";
  const routerBase =
    serverBase === "/" ? "/" : serverBase.replace(/\/+$/, "");

  onMount(() => {
    const handleError = (event: ErrorEvent) => {
      setClientException({
        source: "error",
        error: event.error || event.message || "Unknown client error",
      });
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setClientException({
        source: "unhandledrejection",
        error: event.reason || "Unhandled promise rejection",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    onCleanup(() => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    });
  });

  return (
    <MetaProvider>
      <Router
        base={routerBase}
        root={(props) => (
          <ErrorBoundary
            fallback={(error, reset) => (
              <GlobalErrorOverlay
                title="Something went wrong"
                message="An unexpected error interrupted the app. You can retry or reload the page."
                error={error}
                secondaryActionLabel="Reload page"
                onSecondaryAction={() => {
                  window.location.reload();
                }}
                primaryActionLabel="Try again"
                onPrimaryAction={() => {
                  setClientException(null);
                  reset();
                }}
              />
            )}
          >
            <Suspense>{props.children}</Suspense>
            <GlobalErrorOverlay
              title="Client exception"
              message="The page resumed with a stale connection and hit an uncaught client error."
              error={clientException()?.error}
              open={() => clientException() !== null}
              secondaryActionLabel="Dismiss"
              onSecondaryAction={() => {
                setClientException(null);
              }}
              primaryActionLabel="Reload page"
              onPrimaryAction={() => {
                window.location.reload();
              }}
            />
          </ErrorBoundary>
        )}
      >
        <FileRoutes />
        <ConsoleLogCaptureProvider />
      </Router>
    </MetaProvider>
  );
}
