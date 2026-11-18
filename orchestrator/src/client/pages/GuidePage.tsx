/**
 * Guide: how to use JobOps, from the first search to tracking interviews.
 */

import type React from "react";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  AppModeContext,
  PageHeader,
  PageMain,
} from "@/client/components/layout";
import { openWelcomeGuide } from "@/client/components/WelcomeGuideDialog";
import {
  ArrowRight,
  CheckCircle2,
  Columns3,
  Compass,
  Eye,
  FilePenLine,
  type IconComponent,
  Inbox,
  Keyboard,
  Languages,
  Lightbulb,
  Link2,
  PlusCircle,
  Search,
  SearchCheck,
  Send,
  Settings,
  Shield,
  Sparkles,
  Sun,
} from "@/components/icons";
import { Button } from "@/components/ui/button";

const FLOW_STEPS = [
  {
    key: "resume",
    icon: FilePenLine,
    to: "/design-resume",
    tips: ["flow.steps.resume.tip1", "flow.steps.resume.tip2"],
  },
  {
    key: "search",
    icon: Search,
    to: "/jobs/ready",
    tips: ["flow.steps.search.tip1", "flow.steps.search.tip2"],
  },
  {
    key: "review",
    icon: SearchCheck,
    to: "/jobs/discovered",
    tips: ["flow.steps.review.tip1", "flow.steps.review.tip2"],
  },
  {
    key: "apply",
    icon: Send,
    to: "/jobs/ready",
    tips: [
      "flow.steps.apply.tip1",
      "flow.steps.apply.tip2",
      "flow.steps.apply.tip3",
    ],
  },
  {
    key: "track",
    icon: Columns3,
    to: "/applications/in-progress",
    tips: ["flow.steps.track.tip1"],
  },
] as const;

type FlowStepKey = (typeof FLOW_STEPS)[number]["key"];

type ToolKey =
  | "addJob"
  | "ghostwriter"
  | "trackingInbox"
  | "watchlist"
  | "tracerLinks"
  | "visaSponsors"
  | "settings";

const TOOLS: Array<{ key: ToolKey; icon: IconComponent; to: string }> = [
  { key: "addJob", icon: PlusCircle, to: "/jobs/ready" },
  { key: "ghostwriter", icon: Sparkles, to: "/jobs/ready" },
  { key: "trackingInbox", icon: Inbox, to: "/tracking-inbox" },
  { key: "watchlist", icon: Eye, to: "/watchlist" },
  { key: "tracerLinks", icon: Link2, to: "/tracer-links" },
  { key: "visaSponsors", icon: Shield, to: "/visa-sponsors" },
  { key: "settings", icon: Settings, to: "/settings" },
];

type TipKey = "language" | "theme" | "shortcuts" | "score";

const TIPS: Array<{ key: TipKey; icon: IconComponent }> = [
  { key: "language", icon: Languages },
  { key: "theme", icon: Sun },
  { key: "shortcuts", icon: Keyboard },
  { key: "score", icon: Lightbulb },
];

const stepAnchor = (key: FlowStepKey) => `guide-step-${key}`;

export const GuidePage: React.FC = () => {
  const { t } = useTranslation("guide");
  const { appMode } = useContext(AppModeContext);
  // The tracking inbox is not offered in hosted mode (see the sidebar).
  const tools =
    appMode === "hosted"
      ? TOOLS.filter(({ key }) => key !== "trackingInbox")
      : TOOLS;

  return (
    <>
      <PageHeader
        icon={Compass}
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openWelcomeGuide}
          >
            <Sparkles />
            {t("page.replayWelcome")}
          </Button>
        }
      />

      <PageMain className="max-w-4xl space-y-10">
        <section className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-xs sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-seal/10"
          />
          <div className="relative">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {t("intro.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("intro.body")}
            </p>
            <nav aria-label={t("flow.title")} className="mt-5">
              <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
                {FLOW_STEPS.map(({ key, icon: Icon }, index) => (
                  <li key={key} className="flex items-center gap-1.5">
                    <a
                      href={`#${stepAnchor(key)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Icon className="size-3.5 text-primary" />
                      {t(`flow.steps.${key}.title`)}
                    </a>
                    {index < FLOW_STEPS.length - 1 && (
                      <ArrowRight
                        aria-hidden="true"
                        className="size-3.5 text-muted-foreground/60"
                      />
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </section>

        <section aria-labelledby="guide-flow-heading">
          <h2
            id="guide-flow-heading"
            className="mb-4 text-base font-semibold tracking-tight"
          >
            {t("flow.title")}
          </h2>
          <ol className="relative space-y-4">
            {FLOW_STEPS.map(({ key, icon: Icon, to, tips }, index) => (
              <li
                key={key}
                id={stepAnchor(key)}
                className="relative flex scroll-mt-24 gap-4"
              >
                <div className="flex flex-col items-center">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground tabular-nums shadow-xs">
                    {index + 1}
                  </span>
                  {index < FLOW_STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="mt-2 w-px flex-1 bg-border"
                    />
                  )}
                </div>
                <article className="min-w-0 flex-1 rounded-xl border border-border bg-card p-5 shadow-xs">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-seal">
                        {t("flow.stepLabel", { number: index + 1 })}
                      </p>
                      <h3 className="text-base font-semibold tracking-tight">
                        {t(`flow.steps.${key}.title`)}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t(`flow.steps.${key}.body`)}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {tips.map((tip) => (
                      <li key={tip} className="flex gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="leading-relaxed">{t(tip)}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link to={to}>
                      {t(`flow.steps.${key}.action`)}
                      <ArrowRight />
                    </Link>
                  </Button>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="guide-tools-heading">
          <h2
            id="guide-tools-heading"
            className="mb-4 text-base font-semibold tracking-tight"
          >
            {t("tools.title")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {tools.map(({ key, icon: Icon, to }) => (
              <li key={key}>
                <Link
                  to={to}
                  className="group flex h-full gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {t(`tools.items.${key}.title`)}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground transition-colors group-hover:text-primary">
                        {t("tools.open")}
                        <ArrowRight className="size-3.5" />
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {t(`tools.items.${key}.body`)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="guide-tips-heading"
          className="rounded-xl border border-border bg-card p-5 shadow-xs"
        >
          <h2
            id="guide-tips-heading"
            className="mb-3 text-base font-semibold tracking-tight"
          >
            {t("tips.title")}
          </h2>
          <ul className="space-y-2.5">
            {TIPS.map(({ key, icon: Icon }) => (
              <li key={key} className="flex gap-3 text-sm">
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="leading-relaxed">{t(`tips.${key}`)}</span>
              </li>
            ))}
          </ul>
        </section>
      </PageMain>
    </>
  );
};
