import type { Job } from "@shared/types.js";
import { Loader2, Save } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { showErrorToast } from "@/client/lib/error-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import * as api from "../api";
import { useTracerReadiness } from "../hooks/useTracerReadiness";

interface JobDetailsEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onJobUpdated: () => void | Promise<void>;
}

type JobDetailsDraft = {
  title: string;
  employer: string;
  jobUrl: string;
  applicationLink: string;
  location: string;
  salary: string;
  deadline: string;
  jobDescription: string;
  tracerLinksEnabled: boolean;
};

const emptyDraft: JobDetailsDraft = {
  title: "",
  employer: "",
  jobUrl: "",
  applicationLink: "",
  location: "",
  salary: "",
  deadline: "",
  jobDescription: "",
  tracerLinksEnabled: false,
};

const normalizeOptional = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeFromJob = (job: Job | null): JobDetailsDraft => {
  if (!job) return emptyDraft;
  return {
    title: job.title ?? "",
    employer: job.employer ?? "",
    jobUrl: job.jobUrl ?? "",
    applicationLink: job.applicationLink ?? "",
    location: job.location ?? "",
    salary: job.salary ?? "",
    deadline: job.deadline ?? "",
    jobDescription: job.jobDescription ?? "",
    tracerLinksEnabled: Boolean(job.tracerLinksEnabled),
  };
};

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export const JobDetailsEditDrawer: React.FC<JobDetailsEditDrawerProps> = ({
  open,
  onOpenChange,
  job,
  onJobUpdated,
}) => {
  const { t } = useTranslation(["jobDetail", "common"]);
  const [draft, setDraft] = useState<JobDetailsDraft>(emptyDraft);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { readiness: tracerReadiness, isChecking: isTracerReadinessChecking } =
    useTracerReadiness();

  useEffect(() => {
    if (!open) return;
    setDraft(normalizeFromJob(job));
    setValidationError(null);
    setIsSaving(false);
  }, [job, open]);

  const hasJob = !!job;
  const tracerCanEnable = Boolean(tracerReadiness?.canEnable);
  const tracerEnableBlocked = !draft.tracerLinksEnabled && !tracerCanEnable;
  const tracerEnableBlockedReason =
    tracerReadiness?.canEnable === false
      ? (tracerReadiness.reason ?? t("editDrawer.tracerUnavailable"))
      : null;

  const isDirty = useMemo(() => {
    if (!job) return false;
    const current = normalizeFromJob(job);
    return (
      draft.title !== current.title ||
      draft.employer !== current.employer ||
      draft.jobUrl !== current.jobUrl ||
      draft.applicationLink !== current.applicationLink ||
      draft.location !== current.location ||
      draft.salary !== current.salary ||
      draft.deadline !== current.deadline ||
      draft.jobDescription !== current.jobDescription ||
      draft.tracerLinksEnabled !== current.tracerLinksEnabled
    );
  }, [draft, job]);

  const handleSave = async () => {
    if (!job) return;

    const title = draft.title.trim();
    const employer = draft.employer.trim();
    const jobUrl = draft.jobUrl.trim();
    const applicationLink = draft.applicationLink.trim();

    if (!title) {
      setValidationError(t("editDrawer.validation.titleRequired"));
      return;
    }
    if (!employer) {
      setValidationError(t("editDrawer.validation.employerRequired"));
      return;
    }
    if (!jobUrl) {
      setValidationError(t("editDrawer.validation.jobUrlRequired"));
      return;
    }
    if (!isValidUrl(jobUrl)) {
      setValidationError(t("editDrawer.validation.jobUrlInvalid"));
      return;
    }
    if (applicationLink && !isValidUrl(applicationLink)) {
      setValidationError(t("editDrawer.validation.applicationUrlInvalid"));
      return;
    }
    if (
      draft.tracerLinksEnabled &&
      !job.tracerLinksEnabled &&
      !tracerCanEnable
    ) {
      setValidationError(
        tracerEnableBlockedReason ?? t("editDrawer.tracerUnavailable"),
      );
      return;
    }

    try {
      setValidationError(null);
      setIsSaving(true);

      const employerChanged =
        employer.toLowerCase() !== job.employer.trim().toLowerCase();

      await api.updateJob(job.id, {
        title,
        employer,
        jobUrl,
        applicationLink: normalizeOptional(draft.applicationLink),
        location: normalizeOptional(draft.location),
        salary: normalizeOptional(draft.salary),
        deadline: normalizeOptional(draft.deadline),
        jobDescription: normalizeOptional(draft.jobDescription),
        tracerLinksEnabled: draft.tracerLinksEnabled,
      });

      if (employerChanged) {
        try {
          await api.checkSponsor(job.id);
        } catch (error) {
          showErrorToast(error, t("editDrawer.sponsorCheckFailed"));
        }
      }

      await onJobUpdated();

      toast.success(t("editDrawer.updated"), {
        action: {
          label: t("editDrawer.rescoreNow"),
          onClick: () => {
            void (async () => {
              try {
                await api.rescoreJob(job.id);
                await onJobUpdated();
                toast.success(t("toasts.matchRecalculated"));
              } catch (error) {
                showErrorToast(error, t("editDrawer.recalculateFailed"));
              }
            })();
          },
        },
      });

      onOpenChange(false);
    } catch (error) {
      showErrorToast(error, t("editDrawer.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <div className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>{t("editDrawer.title")}</SheetTitle>
            <SheetDescription>{t("editDrawer.description")}</SheetDescription>
          </SheetHeader>

          {!hasJob ? (
            <div className="mt-6 rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
              {t("editDrawer.selectJob")}
            </div>
          ) : (
            <>
              <div className="mt-4 flex-1 overflow-y-auto pr-1">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldInput
                    id="edit-job-title"
                    label={t("editDrawer.labels.title")}
                    value={draft.title}
                    onChange={(value) =>
                      setDraft((prev) => ({ ...prev, title: value }))
                    }
                    placeholder={t("editDrawer.placeholders.title")}
                  />
                  <FieldInput
                    id="edit-job-employer"
                    label={t("editDrawer.labels.employer")}
                    value={draft.employer}
                    onChange={(value) =>
                      setDraft((prev) => ({ ...prev, employer: value }))
                    }
                    placeholder={t("editDrawer.placeholders.employer")}
                  />
                  <FieldInput
                    id="edit-job-url"
                    label={t("editDrawer.labels.jobUrl")}
                    value={draft.jobUrl}
                    onChange={(value) =>
                      setDraft((prev) => ({ ...prev, jobUrl: value }))
                    }
                    placeholder="https://..." // i18n-ignore
                  />
                  <FieldInput
                    id="edit-application-url"
                    label={t("editDrawer.labels.applicationUrl")}
                    value={draft.applicationLink}
                    onChange={(value) =>
                      setDraft((prev) => ({ ...prev, applicationLink: value }))
                    }
                    placeholder="https://..." // i18n-ignore
                  />
                  <FieldInput
                    id="edit-location"
                    label={t("editDrawer.labels.location")}
                    value={draft.location}
                    onChange={(value) =>
                      setDraft((prev) => ({ ...prev, location: value }))
                    }
                    placeholder={t("editDrawer.placeholders.location")}
                  />
                  <FieldInput
                    id="edit-salary"
                    label={t("editDrawer.labels.salary")}
                    value={draft.salary}
                    onChange={(value) =>
                      setDraft((prev) => ({ ...prev, salary: value }))
                    }
                    placeholder={t("editDrawer.placeholders.salary")}
                  />
                  <FieldInput
                    id="edit-deadline"
                    label={t("editDrawer.labels.deadline")}
                    value={draft.deadline}
                    onChange={(value) =>
                      setDraft((prev) => ({ ...prev, deadline: value }))
                    }
                    placeholder={t("editDrawer.placeholders.deadline")}
                  />
                </div>

                <div className="mt-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-3">
                  <label
                    htmlFor="edit-tracer-links-enabled"
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <Checkbox
                      id="edit-tracer-links-enabled"
                      checked={draft.tracerLinksEnabled}
                      onCheckedChange={(checked) =>
                        setDraft((prev) => ({
                          ...prev,
                          tracerLinksEnabled: Boolean(checked),
                        }))
                      }
                      disabled={isSaving || tracerEnableBlocked}
                    />
                    <span className="text-sm font-medium">
                      {t("editDrawer.enableTracer")}
                    </span>
                  </label>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {isTracerReadinessChecking
                      ? t("editDrawer.checkingTracer")
                      : t("editDrawer.tracerAppliesNext")}
                  </p>
                  {tracerEnableBlockedReason && !draft.tracerLinksEnabled ? (
                    <p className="mt-2 text-xs text-destructive">
                      {t("editDrawer.tracerUnavailableReason", {
                        reason: tracerEnableBlockedReason,
                      })}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground/80">
                    {t("editDrawer.privacyNote")}
                  </p>
                </div>

                <div className="mt-3 space-y-1">
                  <label
                    htmlFor="edit-job-description"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {t("editDrawer.labels.jobDescription")}
                  </label>
                  <Textarea
                    id="edit-job-description"
                    value={draft.jobDescription}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        jobDescription: event.target.value,
                      }))
                    }
                    placeholder={t("editDrawer.placeholders.jobDescription")}
                    className="min-h-[220px] font-mono text-sm leading-relaxed"
                  />
                </div>

                {validationError && (
                  <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {validationError}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                >
                  {t("common:actions.cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving || !isDirty}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {t("editDrawer.saveDetails")}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const FieldInput: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}> = ({ id, label, value, onChange, placeholder }) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
      {label}
    </label>
    <Input
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  </div>
);
