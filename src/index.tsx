import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { invoke } from "@tauri-apps/api/core";
import App from "./App";
import { ErrorFallback } from "./components/ErrorFallback";
import { ThemeProvider } from "./components/ThemeProvider";
import "./index.css";
import "./lib/i18n"; // Initialize i18next

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        // Log errors to Tauri backend
        invoke("error", {
          prefix: "React Error Boundary",
          content: `${error.message}\n\nComponent Stack:${errorInfo.componentStack}`,
        }).catch(console.error);
      }}
      onReset={() => {
        // Reload the app on reset
        window.location.href = "/";
      }}
    >
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
