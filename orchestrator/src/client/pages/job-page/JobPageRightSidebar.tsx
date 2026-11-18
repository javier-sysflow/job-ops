import type { ApplicationTask, Job } from "@shared/types.js";
import {
  CalendarClock,
  CheckCircle2,
  Copy,
  Download,
  Edit2,
  ExternalLink,
  FileText,
  MoreHorizontal,
  PlusCircle,
  RefreshCcw,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";
import type React from "react";
import { TooltipWhenDisabled } from "@/client/components/TooltipWhenDisabled";
import i18n from "@/client/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatTimestamp } from "@/lib/utils";

type JobPageRightSidebarProps = {
  job: Job;
  tasks: ApplicationTask[];
  jobLink: string | null;
  isDiscovered: boolean;
  isReady: boolean;
  isApplied: boolean;
  isInProgress: boolean;
  canLogEvents: boolean;
  isBusy: boolean;
  isUploadingPdf: boolean;
  pdfActionsDisabled: boolean;
  pdfRegeneratingReason: string | null;
  pdfViewLabel: string;
  pdfDownloadLabel: string;
  onStartTailoring: () => void;
  onMarkApplied: () => void;
  onOpenLogEvent: () => void;
  onEditTailoring: () => void;
  onViewPdf: () => void;
  onDownloadPdf: () => void;
  onUploadPdf: () => void;
  onRegeneratePdf: () => void;
  onSkip: () => void;
  onOpenEditDetails: () => void;
  onViewJobDescription: () => void;
  onCopyJobInfo: () => void;
  onRescore: () => void;
  onCheckSponsor: () => void;
};

export const JobPageRightSidebar: React.FC<JobPageRightSidebarProps> = ({
  job,
  tasks,
  jobLink,
  isDiscovered,
  isReady,
  isApplied,
  isInProgress,
  canLogEvents,
  isBusy,
  isUploadingPdf,
  pdfActionsDisabled,
  pdfRegeneratingReason,
  pdfViewLabel,
  pdfDownloadLabel,
  onStartTailoring,
  onMarkApplied,
  onOpenLogEvent,
  onEditTailoring,
  onViewPdf,
  onDownloadPdf,
  onUploadPdf,
  onRegeneratePdf,
  onSkip,
  onOpenEditDetails,
  onViewJobDescription,
  onCopyJobInfo,
  onRescore,
  onCheckSponsor,
}) => (
  <aside className="space-y-4 xl:sticky xl:top-5">
    <section className="rounded-xl border border-border/50 bg-card/85 p-3">
      <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold">
        {i18n.t("jobDetail:rightSidebar.actions")}
      </div>
      <div className="space-y-2">
        {jobLink && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="w-full justify-start"
          >
            <a href={jobLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              {i18n.t("jobDetail:rightSidebar.openJobListing")}
            </a>
          </Button>
        )}

        {isDiscovered && (
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start"
            onClick={onStartTailoring}
            disabled={isBusy}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {i18n.t("jobDetail:rightSidebar.startTailoring")}
          </Button>
        )}

        {isReady && (
          <Button
            size="sm"
            className="w-full justify-start"
            variant="outline"
            onClick={onMarkApplied}
            disabled={isBusy}
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            {i18n.t("jobDetail:rightSidebar.markApplied")}
          </Button>
        )}

        {(isApplied || isInProgress) && (
          <Button
            size="sm"
            className="w-full justify-start"
            variant="outline"
            onClick={onOpenLogEvent}
            disabled={!canLogEvents || isBusy}
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            {i18n.t("jobDetail:rightSidebar.logEvent")}
          </Button>
        )}

        {isReady && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 w-full justify-start"
            onClick={onEditTailoring}
            disabled={isBusy}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {i18n.t("jobDetail:rightSidebar.editTailoring")}
          </Button>
        )}

        {job.pdfPath && (
          <TooltipWhenDisabled
            reason={pdfRegeneratingReason}
            className="w-full"
          >
            <Button
              size="sm"
              variant="outline"
              className="h-9 w-full justify-start"
              onClick={onViewPdf}
              disabled={pdfActionsDisabled}
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              {pdfViewLabel}
            </Button>
          </TooltipWhenDisabled>
        )}

        <Button
          size="sm"
          variant="outline"
          className="h-9 w-full justify-start"
          onClick={onUploadPdf}
          disabled={isUploadingPdf}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {isUploadingPdf
            ? i18n.t("jobDetail:rightSidebar.uploadingPdf")
            : job.pdfPath
              ? i18n.t("jobDetail:rightSidebar.replacePdf")
              : i18n.t("jobDetail:rightSidebar.uploadPdf")}
        </Button>

        {isReady && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 w-full justify-start"
            onClick={onRegeneratePdf}
            disabled={isBusy || Boolean(pdfRegeneratingReason)}
          >
            <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
            {i18n.t("jobDetail:rightSidebar.regeneratePdf")}
          </Button>
        )}

        {(isReady || isDiscovered) && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 w-full justify-start"
            onClick={onSkip}
            disabled={isBusy}
          >
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            {i18n.t("jobDetail:rightSidebar.skipJob")}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-full justify-start text-muted-foreground"
            >
              <MoreHorizontal className="mr-1.5 h-3.5 w-3.5" />
              {i18n.t("jobDetail:rightSidebar.moreActions")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onOpenEditDetails}>
              <Edit2 className="mr-2 h-4 w-4" />
              {i18n.t("jobDetail:rightSidebar.editDetails")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onViewJobDescription}>
              <Edit2 className="mr-2 h-4 w-4" />
              {i18n.t("jobDetail:rightSidebar.viewJobDescription")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onCopyJobInfo}>
              <Copy className="mr-2 h-4 w-4" />
              {i18n.t("jobDetail:rightSidebar.copyJobInfo")}
            </DropdownMenuItem>
            {(isReady || isDiscovered) && (
              <DropdownMenuItem onSelect={onRescore}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {i18n.t("jobDetail:rightSidebar.recalculateMatch")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onUploadPdf} disabled={isUploadingPdf}>
              <Upload className="mr-2 h-4 w-4" />
              {isUploadingPdf
                ? i18n.t("jobDetail:rightSidebar.uploadingPdfEllipsis")
                : job.pdfPath
                  ? i18n.t("jobDetail:rightSidebar.replacePdf")
                  : i18n.t("jobDetail:rightSidebar.uploadPdf")}
            </DropdownMenuItem>
            {job.pdfPath && (
              <>
                <DropdownMenuItem
                  onSelect={onViewPdf}
                  disabled={pdfActionsDisabled}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {pdfViewLabel}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={onDownloadPdf}
                  disabled={pdfActionsDisabled}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {pdfDownloadLabel}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onSelect={onCheckSponsor}>
              {i18n.t("jobDetail:rightSidebar.checkSponsorship")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>

    {tasks.length > 0 && (
      <section className="rounded-xl border border-border/50 bg-card/70 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <CalendarClock className="h-4 w-4" />
          {i18n.t("jobDetail:rightSidebar.upcomingTasks")}
        </div>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="space-y-1">
              <div className="text-sm font-medium">{task.title}</div>
              {task.notes && (
                <div className="text-xs text-muted-foreground">
                  {task.notes}
                </div>
              )}
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-wide"
              >
                {formatTimestamp(task.dueDate)}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    )}
  </aside>
);
