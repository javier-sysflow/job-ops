/**
 * "JobOps at a glance": a short explanation of what the app does, for people
 * who are about to sign in or create an account for the first time. Opens by
 * itself on the first visit to the sign-in page (once per browser) and from a
 * link under the sign-in form.
 */

import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Check,
  Columns3,
  FileText,
  type IconComponent,
  Info,
  Sparkles,
  Upload,
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

export const QUICK_GLANCE_SEEN_KEY = "jobops.quickGlanceSeen";

const readSeen = (): boolean => {
  try {
    return localStorage.getItem(QUICK_GLANCE_SEEN_KEY) === "1";
  } catch {
    // Storage blocked: don't open on every visit.
    return true;
  }
};

const markSeen = () => {
  try {
    localStorage.setItem(QUICK_GLANCE_SEEN_KEY, "1");
  } catch {
    // Storage unavailable: it may open again next visit.
  }
};

type StepKey = "resume" | "search" | "documents" | "track";

const STEPS: Array<{ key: StepKey; icon: IconComponent }> = [
  { key: "resume", icon: Upload },
  { key: "search", icon: Sparkles },
  { key: "documents", icon: FileText },
  { key: "track", icon: Columns3 },
];

const GOOD_TO_KNOW = ["free", "private", "youApply", "review"] as const;

interface QuickGlanceProps {
  /** True once the sign-in page has loaded and is staying on screen. */
  ready: boolean;
  /** Whether this instance lets people create their own account. */
  canSignUp: boolean;
  /** Switches the sign-in page to its "Create account" tab. */
  onCreateAccount: () => void;
}

export const QuickGlance: React.FC<QuickGlanceProps> = ({
  ready,
  canSignUp,
  onCreateAccount,
}) => {
  const { t } = useTranslation("shell");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready || readSeen()) return;
    markSeen();
    setOpen(true);
  }, [ready]);

  const handlePrimary = () => {
    setOpen(false);
    if (canSignUp) onCreateAccount();
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mx-auto gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Info className="size-4" />
        {t("quickGlance.trigger")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] max-w-xl gap-5 overflow-y-auto p-0">
          <div className="border-b border-border bg-gradient-to-br from-primary/10 via-transparent to-seal/10 px-6 pt-6 pb-5">
            <DialogHeader className="space-y-2 pr-6">
              <div className="flex items-center gap-2.5">
                <img
                  src="/favicon.png"
                  alt=""
                  className="size-8 shrink-0 rounded-lg"
                />
                <DialogTitle className="text-xl">
                  {t("quickGlance.title")}
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm leading-relaxed">
                {t("quickGlance.description")}
              </DialogDescription>
            </DialogHeader>
          </div>

          <ol className="grid gap-3 px-6 sm:grid-cols-2">
            {STEPS.map(({ key, icon: Icon }, index) => (
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
                    {t(`quickGlance.steps.${key}.title`)}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {t(`quickGlance.steps.${key}.body`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="px-6">
            <p className="text-sm font-semibold">
              {t("quickGlance.goodToKnow.title")}
            </p>
            <ul className="mt-2 space-y-1.5">
              {GOOD_TO_KNOW.map((key) => (
                <li
                  key={key}
                  className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                >
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {t(`quickGlance.goodToKnow.${key}`)}
                </li>
              ))}
            </ul>
            <p className="mt-3 flex gap-3 text-xs">
              <a
                href="/privacy.html"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {t("quickGlance.privacy")}
              </a>
              <a
                href="/terms.html"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {t("quickGlance.terms")}
              </a>
            </p>
          </div>

          <DialogFooter className="gap-2 border-t border-border bg-muted/40 px-6 py-4 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("quickGlance.close")}
            </Button>
            <Button type="button" onClick={handlePrimary}>
              {canSignUp
                ? t("quickGlance.createAccount")
                : t("quickGlance.continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
