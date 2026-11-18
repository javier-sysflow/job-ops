/**
 * Main App component.
 */

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { X } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { AppModeContext, AppShell } from "./components/layout";
import { OnboardingGate } from "./components/OnboardingGate";
import { StageStyleSync } from "./components/StageStyleSync";
import { TimeZoneSync } from "./components/TimeZoneSync";
import { WelcomeGuideDialog } from "./components/WelcomeGuideDialog";
import { useAnalyticsIdentity } from "./hooks/useAnalyticsIdentity";
import { useDemoInfo } from "./hooks/useDemoInfo";
import { setAuthNavigator } from "./lib/auth-navigation";
import { DesignResumePage } from "./pages/DesignResumePage";
import { GmailOauthCallbackPage } from "./pages/GmailOauthCallbackPage";
import { GuidePage } from "./pages/GuidePage";
import { HomePage } from "./pages/HomePage";
import { InProgressBoardPage } from "./pages/InProgressBoardPage";
import { JobPage } from "./pages/JobPage";
import { OfflinePage } from "./pages/OfflinePage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { OrchestratorPage } from "./pages/OrchestratorPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SignInPage } from "./pages/SignInPage";
import { SsoCallbackPage } from "./pages/SsoCallbackPage";
import { TracerLinksPage } from "./pages/TracerLinksPage";
import { TrackingInboxPage } from "./pages/TrackingInboxPage";
import { VisaSponsorsPage } from "./pages/VisaSponsorsPage";
import { WatchlistPage } from "./pages/WatchlistPage";

/** Backwards-compatibility redirects: old URL paths -> new URL paths */
const REDIRECTS: Array<{ from: string; to: string }> = [
  { from: "/", to: "/jobs/ready" },
  { from: "/home", to: "/overview" },
  { from: "/ready", to: "/jobs/ready" },
  { from: "/ready/:jobId", to: "/jobs/ready/:jobId" },
  { from: "/discovered", to: "/jobs/discovered" },
  { from: "/discovered/:jobId", to: "/jobs/discovered/:jobId" },
  { from: "/applied", to: "/jobs/applied" },
  { from: "/applied/:jobId", to: "/jobs/applied/:jobId" },
  { from: "/in-progress", to: "/applications/in-progress" },
  { from: "/in-progress/:jobId", to: "/applications/in-progress" },
  { from: "/jobs/in_progress", to: "/applications/in-progress" },
  { from: "/jobs/in_progress/:jobId", to: "/applications/in-progress" },
  { from: "/all", to: "/jobs/all" },
  { from: "/all/:jobId", to: "/jobs/all/:jobId" },
];

const DEMO_WAITLIST_BANNER_DISMISSED_KEY = "jobops.demoWaitlistBannerDismissed";

export const App: React.FC = () => {
  const { t } = useTranslation("shell");
  useAnalyticsIdentity();
  const location = useLocation();
  const navigate = useNavigate();
  const nodeRef = useRef<HTMLDivElement>(null);
  const isAuthRoute =
    location.pathname === "/sign-in" ||
    location.pathname.startsWith("/sso/callback/");
  // Screens that stand alone, without the navigation sidebar.
  const isStandaloneRoute =
    isAuthRoute ||
    location.pathname === "/onboarding" ||
    location.pathname === "/offline" ||
    location.pathname.startsWith("/oauth/");
  const demoInfo = useDemoInfo({ enabled: !isAuthRoute });
  const showDemoBanners = !isAuthRoute && demoInfo?.demoMode;
  const [demoWaitlistBannerDismissed, setDemoWaitlistBannerDismissed] =
    useState(() => {
      try {
        return localStorage.getItem(DEMO_WAITLIST_BANNER_DISMISSED_KEY) === "1";
      } catch {
        return false;
      }
    });

  // Determine a stable key for transitions to avoid unnecessary unmounts when switching sub-tabs
  const pageKey = React.useMemo(() => {
    const firstSegment = location.pathname.split("/")[1] || "jobs";
    if (firstSegment === "jobs") {
      return "orchestrator";
    }
    return firstSegment;
  }, [location.pathname]);

  useEffect(() => {
    setAuthNavigator((nextPath) => {
      const search = new URLSearchParams();
      if (
        nextPath &&
        nextPath !== "/sign-in" &&
        !nextPath.startsWith("/sign-in?")
      ) {
        search.set("next", nextPath);
      }
      navigate(`/sign-in${search.toString() ? `?${search.toString()}` : ""}`, {
        replace: true,
      });
    });

    return () => {
      setAuthNavigator(null);
    };
  }, [navigate]);

  return (
    <>
      <OnboardingGate />
      <TimeZoneSync />
      <StageStyleSync />
      <WelcomeGuideDialog enabled={!isStandaloneRoute} />
      {showDemoBanners && (
        <div className="sticky top-0 z-50 w-full border-b border-amber-400/50 bg-amber-500/20 px-4 py-2 text-xs text-amber-100 shadow-sm backdrop-blur">
          <div className="mx-auto flex items-center justify-center gap-3">
            <p className="flex-1 text-center">
              <span className="font-medium">
                {t("demo.banner", { hours: demoInfo.resetCadenceHours })}
              </span>
              {!demoWaitlistBannerDismissed && (
                <>
                  {" "}
                  {t("demo.waitlistPrompt")}{" "}
                  <a
                    className="font-semibold underline underline-offset-2 hover:text-amber-50"
                    href="https://try.jobops.app?utm_source=demo&utm_medium=banner&utm_campaign=waitlist"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("demo.waitlistLink")}
                  </a>
                </>
              )}
            </p>
            {!demoWaitlistBannerDismissed && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 rounded-full text-amber-100 hover:bg-amber-400/20 hover:text-amber-50"
                onClick={() => {
                  setDemoWaitlistBannerDismissed(true);
                  try {
                    localStorage.setItem(
                      DEMO_WAITLIST_BANNER_DISMISSED_KEY,
                      "1",
                    );
                  } catch {
                    // Ignore storage errors in restricted browser contexts.
                  }
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">{t("demo.dismiss")}</span>
              </Button>
            )}
          </div>
        </div>
      )}
      <AppShell enabled={!isStandaloneRoute}>
        <SwitchTransition mode="out-in">
          <CSSTransition
            key={pageKey}
            nodeRef={nodeRef}
            timeout={100}
            classNames="page"
            unmountOnExit
          >
            <div ref={nodeRef}>
              <Routes location={location}>
                {/* Backwards-compatibility redirects */}
                {REDIRECTS.map(({ from, to }) => (
                  <Route
                    key={from}
                    path={from}
                    element={<Navigate to={to} replace />}
                  />
                ))}

                {/* Application routes */}
                <Route path="/overview" element={<HomePage />} />
                <Route
                  path="/oauth/gmail/callback"
                  element={<GmailOauthCallbackPage />}
                />
                <Route path="/job/:id" element={<JobPage />} />
                <Route path="/job/:id/:view" element={<JobPage />} />
                <Route
                  path="/applications/in-progress"
                  element={<InProgressBoardPage />}
                />
                <Route path="/design-resume" element={<DesignResumePage />} />
                <Route
                  path="/design-resume/:section"
                  element={<DesignResumePage />}
                />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/offline" element={<OfflinePage />} />
                <Route path="/sign-in" element={<SignInPage />} />
                <Route
                  path="/sso/callback/:provider"
                  element={<SsoCallbackPage />}
                />
                <Route path="/guide" element={<GuidePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/tracer-links" element={<TracerLinksPage />} />
                <Route path="/visa-sponsors" element={<VisaSponsorsPage />} />
                <Route
                  path="/tracking-inbox"
                  element={<TrackingInboxRoute />}
                />
                <Route path="/watchlist" element={<WatchlistPage />} />
                <Route path="/jobs/:tab" element={<OrchestratorPage />} />
                <Route
                  path="/jobs/:tab/:jobId"
                  element={<OrchestratorPage />}
                />
              </Routes>
            </div>
          </CSSTransition>
        </SwitchTransition>
      </AppShell>

      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
};

function TrackingInboxRoute() {
  const { appMode, isPending } = React.useContext(AppModeContext);

  if (isPending) return null;
  if (appMode === "hosted") {
    return <Navigate to="/overview" replace />;
  }
  return <TrackingInboxPage />;
}
