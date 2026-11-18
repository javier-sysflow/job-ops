import "@/client/i18n";
import { QueryClientProvider } from "@tanstack/react-query";
import React, { useSyncExternalStore } from "react";
import ReactDOM from "react-dom/client";
import { useTranslation } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import { AppErrorBoundary } from "@/client/components/AppErrorBoundary";
import { AppModeProvider } from "@/client/components/layout";
import {
  getApplicationStageStyle,
  subscribeApplicationStageStyle,
} from "@/client/i18n/stageStyle";
import { queryClient } from "@/client/lib/queryClient";
import { App } from "./App";
import "../index.css";

// Remount on language change so every screen (including values formatted
// outside React, like dates) re-renders in the new language. Fork: the same
// for the application-stage label style.
const LanguageKeyedApp = () => {
  const { i18n } = useTranslation();
  const stageStyle = useSyncExternalStore(
    subscribeApplicationStageStyle,
    getApplicationStageStyle,
  );
  return <App key={`${i18n.language}:${stageStyle}`} />;
};

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppModeProvider>
          <AppErrorBoundary>
            <LanguageKeyedApp />
          </AppErrorBoundary>
        </AppModeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
