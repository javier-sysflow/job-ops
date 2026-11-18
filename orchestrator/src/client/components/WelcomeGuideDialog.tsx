/**
 * First-run welcome: a short tour of the JobOps flow, shown once per browser
 * after onboarding is complete. The guide page can reopen it.
 */

import { useOnboardingStatus } from "@client/hooks/useOnboardingStatus";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Columns3,
  type IconComponent,
  Search,
  SearchCheck,
  Send,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const WELCOME_GUIDE_SEEN_KEY = "jobops.welcomeGuideSeen";
const OPEN_WELCOME_GUIDE_EVENT = "jobops:open-welcome-guide";

/** Reopens the welcome dialog from anywhere in the app. */
export function openWelcomeGuide(): void {
  window.dispatchEvent(new Event(OPEN_WELCOME_GUIDE_EVENT));
}

const readSeen = (): boolean => {
  try {
    return localStorage.getItem(WELCOME_GUIDE_SEEN_KEY) === "1";
  } catch {
    // Storage blocked: don't nag on every visit.
    return true;
  }
};

const markSeen = () => {
  try {
    localStorage.setItem(WELCOME_GUIDE_SEEN_KEY, "1");
  } catch {
    // Storage unavailable: the dialog may show again next visit.
  }
};

type WelcomeStepKey = "search" | "review" | "apply" | "track";

const WELCOME_STEPS: Array<{ key: WelcomeStepKey; icon: IconComponent }> = [
  { key: "search", icon: Search },
  { key: "review", icon: SearchCheck },
  { key: "apply", icon: Send },
  { key: "track", icon: Columns3 },
];

interface WelcomeGuideDialogProps {
  /** Off on screens without the app shell (sign-in, onboarding). */
  enabled: boolean;
}

export const WelcomeGuideDialog: React.FC<WelcomeGuideDialogProps> = ({
  enabled,
}) => {
  const [open, setOpen] = useState(false);
  const openDialog = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_WELCOME_GUIDE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_WELCOME_GUIDE_EVENT, onOpen);
  }, []);

  return (
    <>
      {enabled && <AutoOpenWhenReady onReady={openDialog} />}
      <WelcomeGuideContent open={open} onOpenChange={setOpen} />
    </>
  );
};

/** Opens the dialog once, after onboarding is complete. */
const AutoOpenWhenReady: React.FC<{ onReady: () => void }> = ({ onReady }) => {
  const { complete } = useOnboardingStatus();

  useEffect(() => {
    if (!complete || readSeen()) return;
    markSeen();
    onReady();
  }, [complete, onReady]);

  return null;
};

interface WelcomeGuideContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WelcomeGuideContent: React.FC<WelcomeGuideContentProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation("guide");
  const navigate = useNavigate();
  const startButtonRef = useRef<HTMLButtonElement>(null);

  const goTo = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl gap-5 overflow-hidden p-0"
        onOpenAutoFocus={(event) => {
          // Focus the main action rather than the first button.
          event.preventDefault();
          startButtonRef.current?.focus();
        }}
      >
        <div className="relative border-b border-border bg-gradient-to-br from-primary/10 via-transparent to-seal/10 px-6 pt-6 pb-5">
          <DialogHeader className="space-y-2 pr-6">
            <div className="flex items-center gap-2.5">
              <img
                src="/favicon.png"
                alt=""
                className="size-8 shrink-0 rounded-lg"
              />
              <DialogTitle className="text-xl">
                {t("welcome.title")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm leading-relaxed">
              {t("welcome.description")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <ol className="grid gap-3 px-6 sm:grid-cols-2">
          {WELCOME_STEPS.map(({ key, icon: Icon }, index) => (
            <li
              key={key}
              className="flex gap-3 rounded-lg border border-border bg-background/60 p-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  <span className="mr-1.5 text-seal tabular-nums">
                    {index + 1}
                  </span>
                  {t(`welcome.steps.${key}.title`)}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {t(`welcome.steps.${key}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <p className="px-6 text-xs text-muted-foreground">
          {t("welcome.footnote")}
        </p>

        <DialogFooter className="gap-2 border-t border-border bg-muted/40 px-6 py-4 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => goTo("/guide")}
          >
            {t("welcome.openGuide")}
          </Button>
          <Button
            ref={startButtonRef}
            type="button"
            onClick={() => goTo("/jobs/ready")}
          >
            {t("welcome.start")}
            <ArrowRight />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
