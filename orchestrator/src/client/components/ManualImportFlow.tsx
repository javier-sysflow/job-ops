import * as api from "@client/api";
import { useSettings } from "@client/hooks/useSettings";
import type { ManualJobDraft } from "@shared/types.js";
import type { ParseKeys } from "i18next";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { showErrorToast } from "@/client/lib/error-toast";
import {
  ArrowDown,
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  CircleAlert,
  DollarSign,
  FileText,
  GraduationCap,
  Link,
  Link2,
  List,
  ListChecks,
  Loader2,
  MapPin,
  Sparkles,
  Tag,
  Users,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { PdfJobDescriptionInput } from "./PdfJobDescriptionInput";

type ManualImportStep =
  | "paste"
  | "loading"
  | "review"
  | "bulk-loading"
  | "bulk-review";
type ManualImportProgressStep = "paste" | "review";
type ManualImportMode = "single" | "url-list";

type BulkImportItem = {
  id: string;
  url: string;
  status: "ready" | "failed" | "imported";
  draft?: ManualJobDraftState;
  warning?: string | null;
  error?: string;
};

export type ManualImportTrackingSource =
  | "pasted_description"
  | "fetched_url"
  | (string & {});

export interface ManualImportResult {
  jobId: string;
  source: ManualImportTrackingSource;
  sourceHost: string | null;
}

type ManualJobDraftState = {
  source: string;
  sourceJobId: string;
  title: string;
  employer: string;
  jobUrl: string;
  applicationLink: string;
  location: string;
  salary: string;
  deadline: string;
  jobDescription: string;
  jobType: string;
  jobLevel: string;
  jobFunction: string;
  disciplines: string;
  degreeRequired: string;
  starting: string;
};

type DraftFieldKey = keyof ManualJobDraftState;

type ManualImportKey = ParseKeys<"manualImport">;

type ReviewFieldConfig = {
  id: string;
  key: DraftFieldKey;
  labelKey: ManualImportKey;
  placeholderKey: ManualImportKey;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  multiline?: boolean;
};

const emptyDraft: ManualJobDraftState = {
  source: "",
  sourceJobId: "",
  title: "",
  employer: "",
  jobUrl: "",
  applicationLink: "",
  location: "",
  salary: "",
  deadline: "",
  jobDescription: "",
  jobType: "",
  jobLevel: "",
  jobFunction: "",
  disciplines: "",
  degreeRequired: "",
  starting: "",
};

const STEP_INDEX_BY_ID: Record<ManualImportProgressStep, number> = {
  paste: 0,
  review: 1,
};

const STEP_LABEL_KEY_BY_ID: Record<ManualImportProgressStep, ManualImportKey> =
  {
    paste: "steps.addJd",
    review: "steps.review",
  };

const REQUIRED_REVIEW_FIELDS: ReviewFieldConfig[] = [
  {
    id: "draft-title",
    key: "title",
    labelKey: "fields.title.label",
    placeholderKey: "fields.title.placeholder",
    icon: Tag,
    required: true,
  },
  {
    id: "draft-employer",
    key: "employer",
    labelKey: "fields.employer.label",
    placeholderKey: "fields.employer.placeholder",
    icon: Building2,
    required: true,
  },
  {
    id: "draft-jobDescription",
    key: "jobDescription",
    labelKey: "fields.jobDescription.label",
    placeholderKey: "fields.jobDescription.placeholder",
    icon: FileText,
    required: true,
    multiline: true,
  },
  {
    id: "draft-jobUrl",
    key: "jobUrl",
    labelKey: "fields.jobUrl.label",
    placeholderKey: "fields.jobUrl.placeholder",
    icon: Link2,
    required: true,
  },
];

const OTHER_REVIEW_FIELDS: ReviewFieldConfig[] = [
  {
    id: "draft-location",
    key: "location",
    labelKey: "fields.location.label",
    placeholderKey: "fields.location.placeholder",
    icon: MapPin,
  },
  {
    id: "draft-salary",
    key: "salary",
    labelKey: "fields.salary.label",
    placeholderKey: "fields.salary.placeholder",
    icon: DollarSign,
  },
  {
    id: "draft-jobType",
    key: "jobType",
    labelKey: "fields.jobType.label",
    placeholderKey: "fields.jobType.placeholder",
    icon: Briefcase,
  },
  {
    id: "draft-jobLevel",
    key: "jobLevel",
    labelKey: "fields.jobLevel.label",
    placeholderKey: "fields.jobLevel.placeholder",
    icon: ListChecks,
  },
  {
    id: "draft-jobFunction",
    key: "jobFunction",
    labelKey: "fields.jobFunction.label",
    placeholderKey: "fields.jobFunction.placeholder",
    icon: Users,
  },
  {
    id: "draft-disciplines",
    key: "disciplines",
    labelKey: "fields.disciplines.label",
    placeholderKey: "fields.disciplines.placeholder",
    icon: ListChecks,
  },
  {
    id: "draft-deadline",
    key: "deadline",
    labelKey: "fields.deadline.label",
    placeholderKey: "fields.deadline.placeholder",
    icon: Calendar,
  },
  {
    id: "draft-degreeRequired",
    key: "degreeRequired",
    labelKey: "fields.degreeRequired.label",
    placeholderKey: "fields.degreeRequired.placeholder",
    icon: GraduationCap,
  },
  {
    id: "draft-starting",
    key: "starting",
    labelKey: "fields.starting.label",
    placeholderKey: "fields.starting.placeholder",
    icon: Calendar,
  },
  {
    id: "draft-applicationLink",
    key: "applicationLink",
    labelKey: "fields.applicationLink.label",
    placeholderKey: "fields.applicationLink.placeholder",
    icon: Link,
  },
];

const BLOCKED_AUTOFETCH_HOSTS: Array<{
  label: string;
  match: (hostname: string) => boolean;
}> = [
  {
    label: "LinkedIn",
    match: (hostname) =>
      hostname === "linkedin.com" || hostname.endsWith(".linkedin.com"),
  },
  {
    label: "Indeed",
    match: (hostname) =>
      hostname === "indeed.com" || hostname.includes("indeed."),
  },
];

const normalizeDraft = (
  draft?: ManualJobDraft | null,
  jd?: string,
): ManualJobDraftState => ({
  ...emptyDraft,
  source: draft?.source ?? "",
  sourceJobId: draft?.sourceJobId ?? "",
  title: draft?.title ?? "",
  employer: draft?.employer ?? "",
  jobUrl: draft?.jobUrl ?? "",
  applicationLink: draft?.applicationLink ?? "",
  location: draft?.location ?? "",
  salary: draft?.salary ?? "",
  deadline: draft?.deadline ?? "",
  jobDescription: jd ?? draft?.jobDescription ?? "",
  jobType: draft?.jobType ?? "",
  jobLevel: draft?.jobLevel ?? "",
  jobFunction: draft?.jobFunction ?? "",
  disciplines: draft?.disciplines ?? "",
  degreeRequired: draft?.degreeRequired ?? "",
  starting: draft?.starting ?? "",
});

const toPayload = (draft: ManualJobDraftState): ManualJobDraft => {
  const clean = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  return {
    title: clean(draft.title),
    source: clean(draft.source),
    sourceJobId: clean(draft.sourceJobId),
    employer: clean(draft.employer),
    jobUrl: clean(draft.jobUrl),
    applicationLink: clean(draft.applicationLink),
    location: clean(draft.location),
    salary: clean(draft.salary),
    deadline: clean(draft.deadline),
    jobDescription: clean(draft.jobDescription),
    jobType: clean(draft.jobType),
    jobLevel: clean(draft.jobLevel),
    jobFunction: clean(draft.jobFunction),
    disciplines: clean(draft.disciplines),
    degreeRequired: clean(draft.degreeRequired),
    starting: clean(draft.starting),
  };
};

interface ManualImportFlowProps {
  active: boolean;
  onImported: (result: ManualImportResult) => void | Promise<void>;
  onClose: () => void;
  showReviewIntro?: boolean;
  initialDraft?: ManualJobDraft | null;
  initialSource?: ManualImportTrackingSource | null;
  initialSourceHost?: string | null;
}

function getSourceHost(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).hostname || null;
  } catch {
    return null;
  }
}

function getBlockedAutofetchLabel(value: string): string | null {
  const host = getSourceHost(value)?.toLowerCase();
  if (!host) return null;
  const blocked = BLOCKED_AUTOFETCH_HOSTS.find((entry) => entry.match(host));
  return blocked?.label ?? null;
}

const MAX_BULK_URLS = 25;
const BULK_URLS_PLACEHOLDER =
  "https://example.com/jobs/backend-engineer\nhttps://example.com/jobs/data-scientist";

function parseBulkUrls(value: string): {
  urls: string[];
  invalidLines: number[];
} {
  const urls: string[] = [];
  const seen = new Set<string>();
  const invalidLines: number[] = [];

  value.split(/\r?\n/).forEach((line, index) => {
    const url = line.trim();
    if (!url) return;

    try {
      const parsed = new URL(url);
      if (!/^https?:$/.test(parsed.protocol))
        throw new Error("Unsupported URL");
      if (!seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    } catch {
      invalidLines.push(index + 1);
    }
  });

  return { urls, invalidLines };
}

export const ManualImportFlow: React.FC<ManualImportFlowProps> = ({
  active,
  onImported,
  onClose,
  showReviewIntro = true,
  initialDraft = null,
  initialSource = null,
  initialSourceHost = null,
}) => {
  const { t } = useTranslation("manualImport");
  const [step, setStep] = useState<ManualImportStep>("paste");
  const [importMode, setImportMode] = useState<ManualImportMode>("single");
  const [rawDescription, setRawDescription] = useState("");
  const [bulkUrlText, setBulkUrlText] = useState("");
  const [bulkItems, setBulkItems] = useState<BulkImportItem[]>([]);
  const [fetchUrl, setFetchUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [draft, setDraft] = useState<ManualJobDraftState>(emptyDraft);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchNotice, setFetchNotice] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [importSource, setImportSource] =
    useState<ManualImportTrackingSource>("pasted_description");
  const [importSourceHost, setImportSourceHost] = useState<string | null>(null);
  const [fetchedSourceUrl, setFetchedSourceUrl] = useState<string | null>(null);
  const { autoTailorOnManualImport } = useSettings();
  const [tailorAfterImport, setTailorAfterImport] = useState<boolean>(
    autoTailorOnManualImport,
  );

  useEffect(() => {
    if (active) {
      if (!initialDraft) return;
      const normalized = normalizeDraft(initialDraft);
      setStep("review");
      setImportMode("single");
      setRawDescription(normalized.jobDescription);
      setFetchUrl(normalized.jobUrl);
      setIsFetching(false);
      setDraft(normalized);
      setWarning(null);
      setError(null);
      setFetchNotice(null);
      setIsImporting(false);
      setImportSource(
        initialSource ||
          (normalized.source as ManualImportTrackingSource) ||
          "pasted_description",
      );
      setImportSourceHost(
        initialSourceHost ??
          getSourceHost(normalized.jobUrl) ??
          getSourceHost(normalized.applicationLink),
      );
      setFetchedSourceUrl(normalized.jobUrl || null);
      setTailorAfterImport(autoTailorOnManualImport);
      return;
    }
    setIsReadingPdf(false);
    setStep("paste");
    setImportMode("single");
    setRawDescription("");
    setBulkUrlText("");
    setBulkItems([]);
    setFetchUrl("");
    setIsFetching(false);
    setDraft(emptyDraft);
    setWarning(null);
    setError(null);
    setFetchNotice(null);
    setIsImporting(false);
    setIsBulkImporting(false);
    setImportSource("pasted_description");
    setImportSourceHost(null);
    setFetchedSourceUrl(null);
    setTailorAfterImport(autoTailorOnManualImport);
  }, [
    active,
    initialDraft,
    initialSource,
    initialSourceHost,
    autoTailorOnManualImport,
  ]);

  const progressStep: ManualImportProgressStep =
    step === "review" || step === "bulk-review" ? "review" : "paste";
  const stepIndex = STEP_INDEX_BY_ID[progressStep];
  const stepLabel =
    importMode === "url-list" && progressStep === "paste"
      ? t("steps.addUrls")
      : t(STEP_LABEL_KEY_BY_ID[progressStep]);

  const canAnalyze =
    rawDescription.trim().length > 0 &&
    step !== "loading" &&
    !isFetching &&
    !isReadingPdf;
  const canFetch =
    fetchUrl.trim().length > 0 &&
    !isFetching &&
    !isReadingPdf &&
    step === "paste";
  const parsedBulkUrls = useMemo(
    () => parseBulkUrls(bulkUrlText),
    [bulkUrlText],
  );
  const canAnalyzeBulk =
    parsedBulkUrls.urls.length > 0 &&
    parsedBulkUrls.invalidLines.length === 0 &&
    parsedBulkUrls.urls.length <= MAX_BULK_URLS &&
    step === "paste";
  const canImport = useMemo(() => {
    if (step !== "review") return false;
    return (
      draft.title.trim().length > 0 &&
      draft.employer.trim().length > 0 &&
      draft.jobUrl.trim().length > 0 &&
      draft.jobDescription.trim().length > 0
    );
  }, [draft, step]);

  const handleFetch = async () => {
    const trimmedUrl = fetchUrl.trim();
    if (!trimmedUrl) return;
    const blockedLabel = getBlockedAutofetchLabel(trimmedUrl);
    if (blockedLabel) {
      setError(t("errors.autofetchBlocked", { site: blockedLabel }));
      setWarning(null);
      setFetchNotice(null);
      return;
    }

    try {
      setError(null);
      setWarning(null);
      setFetchNotice(null);
      setIsFetching(true);

      const fetchResponse = await api.fetchJobFromUrl({ url: trimmedUrl });
      const fetchedContent = fetchResponse.content;
      const fetchedUrl = fetchResponse.url;

      setRawDescription(fetchedContent);
      setFetchedSourceUrl(fetchedUrl);
      setImportSource("fetched_url");
      setImportSourceHost(getSourceHost(fetchedUrl));
      setFetchUrl(fetchedUrl);
      setFetchNotice(t("paste.fetchNotice"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errors.fetchFailed");
      setError(message);
      setStep("paste");
    } finally {
      setIsFetching(false);
    }
  };

  const handleAnalyze = async () => {
    if (!rawDescription.trim()) {
      setError(t("errors.pasteDescription"));
      return;
    }

    try {
      setError(null);
      setWarning(null);
      setStep("loading");
      const response = await api.inferManualJob({
        jobDescription: rawDescription,
      });
      const normalized = normalizeDraft(response.job, rawDescription.trim());
      normalized.jobUrl =
        fetchedSourceUrl || fetchUrl.trim() || normalized.jobUrl;
      setDraft(normalized);
      setWarning(response.warning ?? null);
      setImportSource(fetchedSourceUrl ? "fetched_url" : "pasted_description");
      setImportSourceHost(
        getSourceHost(fetchedSourceUrl ?? "") ??
          getSourceHost(normalized.jobUrl) ??
          getSourceHost(normalized.applicationLink),
      );
      setStep("review");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("errors.analyzeFailed");
      setError(message);
      setStep("paste");
    }
  };

  const handleAnalyzeBulk = async () => {
    const { urls, invalidLines } = parseBulkUrls(bulkUrlText);
    if (invalidLines.length > 0) {
      setError(
        t("errors.invalidLines", {
          count: invalidLines.length,
          lines: invalidLines.join(", "),
        }),
      );
      return;
    }
    if (urls.length === 0) {
      setError(t("errors.noUrls"));
      return;
    }
    if (urls.length > MAX_BULK_URLS) {
      setError(t("errors.tooManyUrls", { max: MAX_BULK_URLS }));
      return;
    }

    setError(null);
    setBulkItems([]);
    setStep("bulk-loading");
    const results: BulkImportItem[] = [];

    for (const [index, url] of urls.entries()) {
      try {
        const blockedLabel = getBlockedAutofetchLabel(url);
        if (blockedLabel) {
          throw new Error(
            t("errors.autofetchBlockedShort", { site: blockedLabel }),
          );
        }
        const fetched = await api.fetchJobFromUrl({ url });
        const response = await api.inferManualJob({
          jobDescription: fetched.content,
        });
        const normalized = normalizeDraft(response.job, fetched.content.trim());
        normalized.jobUrl = fetched.url || url;
        results.push({
          id: `${index}-${url}`,
          url,
          status: "ready",
          draft: normalized,
          warning: response.warning ?? null,
        });
      } catch (err) {
        results.push({
          id: `${index}-${url}`,
          url,
          status: "failed",
          error:
            err instanceof Error ? err.message : t("errors.analyzeUrlFailed"),
        });
      }
      setBulkItems([...results]);
    }

    setStep("bulk-review");
  };

  const handleImport = async () => {
    if (!canImport) return;

    try {
      setIsImporting(true);
      const payload = toPayload(draft);
      const skipTailoring = !tailorAfterImport;
      const created = await api.importManualJob({
        job: payload,
        skipTailoring,
      });
      toast.success(t("toasts.imported"), {
        description: skipTailoring
          ? t("toasts.importedWithoutTailoring")
          : t("toasts.importedTailored"),
      });
      await onImported({
        jobId: created.id,
        source: importSource,
        sourceHost:
          importSourceHost ??
          getSourceHost(payload.jobUrl ?? "") ??
          getSourceHost(payload.applicationLink ?? ""),
      });
      onClose();
    } catch (err) {
      showErrorToast(err, t("errors.importJobFailed"));
    } finally {
      setIsImporting(false);
    }
  };

  const handleBulkImport = async () => {
    const readyItems = bulkItems.filter(
      (item): item is BulkImportItem & { draft: ManualJobDraftState } =>
        item.status === "ready" && Boolean(item.draft),
    );
    if (readyItems.length === 0) return;

    setIsBulkImporting(true);
    const imported: Array<{ jobId: string; url: string }> = [];
    let failedCount = 0;

    for (const item of readyItems) {
      try {
        const created = await api.importManualJob({
          job: toPayload(item.draft),
          skipTailoring: !tailorAfterImport,
        });
        imported.push({ jobId: created.id, url: item.url });
        setBulkItems((current) =>
          current.map((candidate) =>
            candidate.id === item.id
              ? { ...candidate, status: "imported" }
              : candidate,
          ),
        );
      } catch (err) {
        failedCount += 1;
        setBulkItems((current) =>
          current.map((candidate) =>
            candidate.id === item.id
              ? {
                  ...candidate,
                  status: "failed",
                  error:
                    err instanceof Error
                      ? err.message
                      : t("errors.importFailed"),
                }
              : candidate,
          ),
        );
      }
    }

    setIsBulkImporting(false);
    if (failedCount > 0) {
      toast.error(t("errors.bulkFailed", { count: failedCount }));
    }
    if (imported.length > 0) {
      toast.success(t("toasts.bulkImported", { count: imported.length }));
      const last = imported.at(-1);
      if (last) {
        await onImported({
          jobId: last.jobId,
          source: "fetched_url",
          sourceHost: getSourceHost(last.url),
        });
      }
      if (failedCount === 0) onClose();
    }
  };

  const setMode = (mode: ManualImportMode) => {
    setImportMode(mode);
    setError(null);
    setWarning(null);
    setFetchNotice(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t("steps.progress", { current: stepIndex + 1, total: 2 })}
            </span>
            <span>{stepLabel}</span>
          </div>
          <div className="h-1 rounded-full bg-muted/40">
            <div
              className="h-1 rounded-full bg-primary/60 transition-all"
              style={{ width: `${((stepIndex + 1) / 2) * 100}%` }}
            />
          </div>
        </div>
        <Separator />
      </div>

      <div className="mt-4 flex-1 overflow-y-auto pr-1">
        {step === "paste" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/70 bg-muted/30 p-1">
              {(
                [
                  ["single", "paste.modes.single", FileText],
                  ["url-list", "paste.modes.urlList", List],
                ] as const
              ).map(([mode, labelKey, Icon]) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={importMode === mode}
                  className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    importMode === mode
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  disabled={isReadingPdf}
                  onClick={() => setMode(mode)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(labelKey)}
                </button>
              ))}
            </div>

            {importMode === "url-list" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="bulk-job-urls"
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {t("paste.jobUrls")}
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      {t("paste.upTo", { max: MAX_BULK_URLS })}
                    </span>
                  </div>
                  <Textarea
                    id="bulk-job-urls"
                    value={bulkUrlText}
                    onChange={(event) => {
                      setBulkUrlText(event.target.value);
                      setError(null);
                    }}
                    placeholder={BULK_URLS_PLACEHOLDER}
                    className="min-h-[220px] font-mono text-sm leading-relaxed"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("paste.urlListHint")}
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => void handleAnalyzeBulk()}
                  disabled={!canAnalyzeBulk}
                  className="h-10 w-full gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {t("paste.analyzeUrlList")}
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="fetch-url"
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {t("paste.jobUrl")}
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      {t("paste.optionalHelper")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="fetch-url"
                      disabled={isReadingPdf}
                      value={fetchUrl}
                      onChange={(event) => setFetchUrl(event.target.value)}
                      placeholder="https://example.com/job-posting" // i18n-ignore
                      className="flex-1"
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && canFetch) {
                          event.preventDefault();
                          void handleFetch();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!canFetch}
                      className="gap-2 shrink-0"
                      onClick={() => void handleFetch()}
                    >
                      {isFetching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Link className="h-4 w-4" />
                      )}
                      {isFetching ? t("paste.fetching") : t("paste.fetch")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("paste.fetchHint")}
                  </p>
                </div>

                <div className="flex items-center justify-center text-muted-foreground">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide">
                    <span className="h-px w-10 bg-border" />
                    <ArrowDown className="h-3.5 w-3.5" />
                    <span className="h-px w-10 bg-border" />
                  </div>
                </div>

                {active && (
                  <PdfJobDescriptionInput
                    disabled={isFetching}
                    onBusy={setIsReadingPdf}
                    onText={(text) => {
                      setRawDescription(text);
                      setFetchUrl("");
                      setFetchedSourceUrl(null);
                      setImportSource("pasted_description");
                      setImportSourceHost(null);
                      setError(null);
                      setFetchNotice(null);
                    }}
                  />
                )}

                <div className="space-y-2">
                  <label
                    htmlFor="raw-description"
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {t("paste.jobDescription")}
                  </label>
                  <Textarea
                    id="raw-description"
                    disabled={isReadingPdf}
                    value={rawDescription}
                    onChange={(event) => {
                      setRawDescription(event.target.value);
                      setFetchNotice(null);
                      if (!event.target.value.trim()) {
                        setFetchedSourceUrl(null);
                        setImportSource("pasted_description");
                        setImportSourceHost(null);
                      }
                    }}
                    placeholder={t("paste.descriptionPlaceholder")}
                    className="min-h-[200px] font-mono text-sm leading-relaxed"
                  />
                </div>

                {fetchNotice && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    {fetchNotice}
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => void handleAnalyze()}
                  disabled={!canAnalyze}
                  className="w-full h-10 gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {t("paste.analyzeJd")}
                </Button>
              </>
            )}
          </div>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <div className="text-sm font-semibold">{t("loading.title")}</div>
            <p className="text-xs text-muted-foreground max-w-xs">
              {t("loading.description")}
            </p>
          </div>
        )}

        {step === "bulk-loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <div className="text-sm font-semibold">
              {t("bulkLoading.title")}
            </div>
            <p className="max-w-xs text-xs text-muted-foreground">
              {t("bulkLoading.description")}
            </p>
            {bulkItems.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("bulkLoading.progress", {
                  done: bulkItems.length,
                  total: parsedBulkUrls.urls.length,
                })}
              </p>
            )}
          </div>
        )}

        {step === "review" && (
          <div className="space-y-5 pb-4">
            {warning && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {warning}
              </div>
            )}

            {showReviewIntro && (
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold tracking-tight">
                  {t("review.title")}
                </h3>
                <p className="max-w-lg text-sm leading-6 text-muted-foreground">
                  {t("review.description")}
                </p>
              </div>
            )}

            <ReviewSection
              icon={CheckCircle2}
              title={t("review.required.title")}
              description={t("review.required.description")}
            >
              <div className="divide-y divide-border/70">
                {REQUIRED_REVIEW_FIELDS.map((field) => (
                  <ReviewField
                    key={field.id}
                    field={field}
                    value={draft[field.key]}
                    onChange={(value) =>
                      setDraft((prev) => ({ ...prev, [field.key]: value }))
                    }
                  />
                ))}
              </div>
            </ReviewSection>

            <ReviewSection
              icon={CircleAlert}
              title={t("review.other.title")}
              description={t("review.other.description")}
            >
              <div className="grid gap-x-4 sm:grid-cols-2">
                {OTHER_REVIEW_FIELDS.map((field) => (
                  <ReviewField
                    key={field.id}
                    field={field}
                    value={draft[field.key]}
                    onChange={(value) =>
                      setDraft((prev) => ({ ...prev, [field.key]: value }))
                    }
                    compact
                  />
                ))}
              </div>
            </ReviewSection>

            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-card/40 px-3 py-3">
              <Checkbox
                id="tailor-after-import"
                checked={tailorAfterImport}
                onCheckedChange={(checked) => {
                  setTailorAfterImport(checked === true);
                }}
                disabled={isImporting}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="tailor-after-import"
                  className="cursor-pointer text-sm font-medium leading-none"
                >
                  {t("review.tailorLabel")}
                </label>
                <p className="text-xs text-muted-foreground">
                  {t("review.tailorHint")}
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 -mx-1 flex gap-3 border-t border-border/70 bg-background/95 px-1 py-4 backdrop-blur">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("paste")}
                className="h-11 flex-1 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("review.editJd")}
              </Button>
              <Button
                onClick={() => void handleImport()}
                disabled={!canImport || isImporting}
                className="h-11 flex-1 gap-2"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isImporting
                  ? t("review.importing")
                  : tailorAfterImport
                    ? t("review.importAndTailor")
                    : t("review.importWithoutTailoring")}
              </Button>
            </div>
          </div>
        )}

        {step === "bulk-review" && (
          <div className="space-y-5 pb-4">
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight">
                {t("bulkReview.title")}
              </h3>
              <p className="max-w-lg text-sm leading-6 text-muted-foreground">
                {t("bulkReview.description")}
              </p>
            </div>

            <div className="space-y-2">
              {bulkItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/70 bg-card/40 px-3 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {item.draft?.title || item.url}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {item.draft?.employer || item.url}
                      </div>
                      {item.warning && (
                        <div className="mt-2 text-xs text-amber-200">
                          {item.warning}
                        </div>
                      )}
                      {item.error && (
                        <div className="mt-2 text-xs text-destructive">
                          {item.error}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                      {item.status === "ready"
                        ? t("bulkReview.status.ready")
                        : item.status === "imported"
                          ? t("bulkReview.status.imported")
                          : t("bulkReview.status.failed")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-card/40 px-3 py-3">
              <Checkbox
                id="bulk-tailor-after-import"
                checked={tailorAfterImport}
                onCheckedChange={(checked) =>
                  setTailorAfterImport(checked === true)
                }
                disabled={isBulkImporting}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="bulk-tailor-after-import"
                  className="cursor-pointer text-sm font-medium leading-none"
                >
                  {t("review.tailorLabel")}
                </label>
                <p className="text-xs text-muted-foreground">
                  {t("bulkReview.tailorHint")}
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 -mx-1 flex gap-3 border-t border-border/70 bg-background/95 px-1 py-4 backdrop-blur">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("paste")}
                className="h-11 flex-1 gap-2"
                disabled={isBulkImporting}
              >
                <ArrowLeft className="h-4 w-4" />
                {t("bulkReview.editUrls")}
              </Button>
              <Button
                onClick={() => void handleBulkImport()}
                disabled={
                  isBulkImporting ||
                  !bulkItems.some(
                    (item) => item.status === "ready" && item.draft,
                  )
                }
                className="h-11 flex-1 gap-2"
              >
                {isBulkImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isBulkImporting
                  ? t("review.importing")
                  : t("bulkReview.importReady")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ReviewSection: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ icon: Icon, title, description, children }) => (
  <section className="rounded-xl border border-border/80 bg-card/45 p-3 shadow-sm">
    <div className="mb-3 flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
    {children}
  </section>
);

const ReviewField: React.FC<{
  field: ReviewFieldConfig;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}> = ({ field, value, onChange, compact = false }) => {
  const { t } = useTranslation("manualImport");
  const hasValue = value.trim().length > 0;
  const needsReview = Boolean(field.required) && !hasValue;
  const Icon = field.icon;

  return (
    <div
      className={
        compact ? "border-border/60 border-b py-3" : "py-3 first:pt-0 last:pb-0"
      }
    >
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/55 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor={field.id}
              className="text-xs font-medium text-muted-foreground"
            >
              {t(field.labelKey)}
              {field.required ? " *" : ""}
            </label>
            <ReviewStatusBadge hasValue={hasValue} needsReview={needsReview} />
          </div>
          {field.multiline ? (
            <Textarea
              id={field.id}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={t(field.placeholderKey)}
              className="min-h-[150px] resize-y border-border/70 bg-background/60 font-mono text-sm leading-relaxed"
            />
          ) : (
            <Input
              id={field.id}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={t(field.placeholderKey)}
              className="h-9 border-border/70 bg-background/60 text-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewStatusBadge: React.FC<{
  hasValue: boolean;
  needsReview: boolean;
}> = ({ hasValue, needsReview }) => {
  const { t } = useTranslation("manualImport");
  if (needsReview) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-200">
        <CircleAlert className="h-3 w-3" />
        {t("review.status.review")}
      </span>
    );
  }

  if (hasValue) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-200">
        <CheckCircle2 className="h-3 w-3" />
        {t("review.status.looksGood")}
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground">
      {t("review.status.add")}
    </span>
  );
};
