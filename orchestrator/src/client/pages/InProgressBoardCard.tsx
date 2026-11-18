import { outcomeLabel, stageLabel } from "@client/i18n/labels";
import type { ApplicationStage, JobListItem } from "@shared/types.js";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ExternalLink, MoreVertical, PlusCircle } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatTimestamp } from "@/lib/utils";

export type InProgressBoardCardProps = {
  job: JobListItem;
  stage: ApplicationStage;
  latestEventAt: number | null;
  jobPageLinkState: { jobPageBackTo: string };
  isMoving: boolean;
  cardClassName?: string;
  onDragStart: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onLogEvent: () => void;
};

export const InProgressBoardCard: React.FC<InProgressBoardCardProps> = ({
  job,
  stage,
  latestEventAt,
  jobPageLinkState,
  isMoving,
  cardClassName,
  onDragStart,
  onDragEnd,
  onLogEvent,
}) => {
  const { t } = useTranslation("inProgress");
  const canLogEvents = stage !== "closed";

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: full-card drag target for kanban lanes
    <div
      draggable={!isMoving}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group rounded-lg border border-border/60 bg-background/95 p-3 shadow-[0_8px_20px_-18px_rgba(0,0,0,1)] transition-colors",
        "hover:border-border hover:bg-background hover:shadow-[0_12px_24px_-16px_rgba(0,0,0,1)]",
        cardClassName,
        isMoving && "opacity-70",
      )}
    >
      <div className="mb-2 flex items-start gap-2">
        <Link
          to={`/job/${job.id}`}
          state={jobPageLinkState}
          className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {job.title}
          </div>
        </Link>
        <div className="relative h-7 w-7 shrink-0">
          <ExternalLink
            aria-hidden
            className="pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5 text-muted-foreground opacity-100 transition-opacity duration-150 group-hover:opacity-0 group-focus-within:opacity-0"
          />
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute inset-0 h-7 w-7 text-muted-foreground opacity-0 transition-opacity duration-150",
                  "pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100",
                  "group-focus-within:pointer-events-auto group-focus-within:opacity-100",
                  "data-[state=open]:pointer-events-auto data-[state=open]:opacity-100",
                )}
                aria-label={t("card.actionsFor", { title: job.title })}
                draggable={false}
                data-board-card-menu=""
                onDragStart={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                disabled={!canLogEvents}
                onSelect={() => {
                  if (!canLogEvents) return;
                  onLogEvent();
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {t("card.logEvent")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Link
        to={`/job/${job.id}`}
        state={jobPageLinkState}
        className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="text-xs text-muted-foreground/90">{job.employer}</div>
        {stage === "closed" && (
          <div className="mt-2 flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-border/60 bg-muted/30 text-foreground/80"
            >
              {stageLabel("closed")}
            </Badge>
            {job.outcome ? (
              <Badge variant="outline" className="capitalize">
                {outcomeLabel(job.outcome)}
              </Badge>
            ) : null}
          </div>
        )}
        <div className="mt-2 text-[11px] text-muted-foreground/70">
          {latestEventAt != null
            ? t("card.updated", { date: formatTimestamp(latestEventAt) })
            : t("card.noEvents")}
        </div>
      </Link>
    </div>
  );
};
