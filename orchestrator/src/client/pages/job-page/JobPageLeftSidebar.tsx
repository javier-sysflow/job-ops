import { isAwaitingAiScore, ScoreRing } from "@client/components";
import type { Job } from "@shared/types.js";
import type React from "react";
import { Link } from "react-router-dom";
import i18n from "@/client/i18n";
import { formatPostingAgeLabel } from "@/client/lib/job-posting-age";
import {
  ClipboardList,
  FileText,
  FolderKanban,
  Mail,
  MessageSquareText,
  Sparkles,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime } from "@/lib/utils";

export { ScoreRing, isAwaitingAiScore };

export type JobMemoryView =
  | "overview"
  | "note"
  | "documents"
  | "timeline"
  | "emails"
  | "ghostwriter";

type JobPageLeftSidebarProps = {
  job: Job;
  activeMemoryView: JobMemoryView;
  baseJobPath: string;
  navigationState?: { jobPageBackTo: string };
  selectedProjects: string[];
  sourceLabel: string;
};

const memoryLinks = [
  {
    id: "overview" as const,
    icon: FolderKanban,
  },
  {
    id: "note" as const,
    icon: MessageSquareText,
  },
  {
    id: "documents" as const,
    icon: FileText,
  },
  {
    id: "timeline" as const,
    icon: ClipboardList,
  },
  {
    id: "emails" as const,
    icon: Mail,
  },
  {
    id: "ghostwriter" as const,
    icon: Sparkles,
  },
];

const PostingAgeRow: React.FC<{ datePosted: Job["datePosted"] }> = ({
  datePosted,
}) => {
  const postingAge = formatPostingAgeLabel(datePosted);
  if (!postingAge) return null;

  return (
    <div className="flex items-start justify-between gap-4 border-t border-border/50 pt-3">
      <span className="text-muted-foreground">
        {i18n.t("jobDetail:leftSidebar.posted")}
      </span>
      <span className="text-right font-medium" title={postingAge.tooltip}>
        {postingAge.label}
      </span>
    </div>
  );
};

export const JobPageLeftSidebar: React.FC<JobPageLeftSidebarProps> = ({
  job,
  activeMemoryView,
  baseJobPath,
  navigationState,
  selectedProjects,
  sourceLabel,
}) => (
  <aside className="space-y-4 xl:sticky xl:top-5">
    <section className="rounded-xl border border-border/50 bg-card/85 p-4">
      <div className="flex gap-4 flex-row items-start justify-between">
        <div className="min-w-0 space-y-1">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {i18n.t("jobDetail:leftSidebar.dossier")}
          </div>
          <h1 className="text-2xl font-semibold leading-tight">
            {job.employer}
          </h1>
          <div className="text-sm text-muted-foreground">{job.title}</div>
        </div>
        <div className="flex justify-start sm:justify-end">
          <ScoreRing
            score={job.suitabilityScore}
            isAwaitingAi={isAwaitingAiScore(job)}
            suitabilityReason={job.suitabilityReason}
            jobId={job.id}
          />
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <div className="flex items-start justify-between gap-4 border-t border-border/50 pt-3">
          <span className="text-muted-foreground">
            {i18n.t("jobDetail:leftSidebar.source")}
          </span>
          <span className="text-right font-medium">{sourceLabel}</span>
        </div>
        <div className="flex items-start justify-between gap-4 border-t border-border/50 pt-3">
          <span className="text-muted-foreground">
            {i18n.t("jobDetail:leftSidebar.location")}
          </span>
          <span className="text-right font-medium">
            {job.location || i18n.t("jobDetail:leftSidebar.unknown")}
          </span>
        </div>
        <PostingAgeRow datePosted={job.datePosted} />
        <div className="flex items-start justify-between gap-4 border-t border-border/50 pt-3">
          <span className="text-muted-foreground">
            {i18n.t("jobDetail:leftSidebar.found")}
          </span>
          <span className="text-right font-medium">
            {formatDateTime(job.discoveredAt) ?? job.discoveredAt}
          </span>
        </div>
        {job.appliedAt && (
          <div className="flex items-start justify-between gap-4 border-t border-border/50 pt-3">
            <span className="text-muted-foreground">
              {i18n.t("jobDetail:leftSidebar.applied")}
            </span>
            <span className="text-right font-medium">
              {formatDateTime(job.appliedAt) ?? job.appliedAt}
            </span>
          </div>
        )}
        <div className="flex items-start justify-between gap-4 border-t border-border/50 pt-3">
          <span className="text-muted-foreground">
            {i18n.t("jobDetail:leftSidebar.outcome")}
          </span>
          <span className="text-right font-medium">
            {job.outcome
              ? i18n.t(`jobDetail:leftSidebar.outcomes.${job.outcome}`)
              : i18n.t("jobDetail:leftSidebar.open")}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4 border-t border-border/50 pt-3">
          <span className="text-muted-foreground">
            {i18n.t("jobDetail:leftSidebar.projectsChosen")}
          </span>
          <span className="text-right font-medium">
            {selectedProjects.length > 0
              ? selectedProjects.length
              : i18n.t("jobDetail:leftSidebar.noProjects")}
          </span>
        </div>
      </div>
    </section>

    <section className="rounded-xl border border-border/50 bg-card/70 p-3">
      <div className="mb-2 px-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {i18n.t("jobDetail:leftSidebar.linksTitle")}
      </div>
      <div className="space-y-1">
        {memoryLinks.map(({ id: linkView, icon: Icon }) => {
          const path =
            linkView === "overview"
              ? baseJobPath
              : `${baseJobPath}/${linkView === "note" ? "notes" : linkView}`;
          return (
            <Button
              asChild
              key={linkView}
              variant={activeMemoryView === linkView ? "outline" : "ghost"}
              className={cn(
                "h-9 w-full justify-between px-2 text-left text-sm",
              )}
            >
              <Link to={path} state={navigationState}>
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {i18n.t(`jobDetail:leftSidebar.links.${linkView}`)}
                  </span>
                </span>
              </Link>
            </Button>
          );
        })}
      </div>
    </section>
  </aside>
);
