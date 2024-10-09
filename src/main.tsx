// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary
    fallbackRender={(props: FallbackProps) => {
      return (
        <main>
          <h1>Something went wrong</h1>
          <pre>{JSON.stringify(props.error, null, 2)}</pre>
        </main>
      );
    }}
  >
    <App />
  </ErrorBoundary>
);
