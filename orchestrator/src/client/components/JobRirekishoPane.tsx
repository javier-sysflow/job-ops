/**
 * Fork: a job's 履歴書: its own 志望動機 (edit, rewrite with AI, copy for web
 * application forms) and the filled-in 履歴書 PDF. Shown only with the
 * 職務経歴書 layout on.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as api from "@/client/api";
import { showErrorToast } from "@/client/lib/error-toast";
import { downloadJobRirekishoPdf } from "@/client/lib/private-pdf";
import { queryKeys } from "@/client/lib/queryKeys";
import {
  Copy,
  Download,
  Loader2,
  Save,
  ScrollText,
  Sparkles,
} from "@/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Busy = "save" | "generate" | "download" | null;

export const JobRirekishoPane: React.FC<{
  jobId: string;
  className?: string;
}> = ({ jobId, className }) => {
  const { t } = useTranslation(["jobDetail", "common"]);
  const queryClient = useQueryClient();
  const queryKey = queryKeys.jobs.rirekisho(jobId);
  const { data } = useQuery({
    queryKey,
    queryFn: () => api.getJobRirekisho(jobId),
  });
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [confirmRewrite, setConfirmRewrite] = useState(false);

  if (!data?.enabled) return null;

  const saved = data.motivation;
  const value = draft ?? saved;
  const dirty = draft !== null && draft.trim() !== saved;

  const store = (next: api.JobRirekishoState) => {
    queryClient.setQueryData(queryKey, next);
    setDraft(null);
  };

  const save = async (): Promise<boolean> => {
    setBusy("save");
    try {
      store(await api.saveJobMotivation(jobId, value));
      toast.success(t("rirekisho.toasts.saved"));
      return true;
    } catch (error) {
      showErrorToast(error, t("rirekisho.toasts.saveFailed"));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const generate = async () => {
    setBusy("generate");
    try {
      store(await api.generateJobMotivation(jobId));
      toast.success(t("rirekisho.toasts.generated"));
    } catch (error) {
      showErrorToast(error, t("rirekisho.toasts.generateFailed"));
    } finally {
      setBusy(null);
    }
  };

  const requestGenerate = () => {
    if (dirty || data.motivationSource === "user") {
      setConfirmRewrite(true);
      return;
    }
    void generate();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("rirekisho.toasts.copied"));
    } catch (error) {
      showErrorToast(error, t("rirekisho.toasts.copyFailed"));
    }
  };

  const download = async () => {
    // The PDF is built from the saved text, so save an edit first.
    if (dirty && !(await save())) return;
    setBusy("download");
    try {
      await downloadJobRirekishoPdf(jobId);
    } catch (error) {
      showErrorToast(error, t("rirekisho.toasts.downloadFailed"));
    } finally {
      setBusy(null);
    }
  };

  const sourceLabel =
    data.motivationSource === "ai"
      ? t("rirekisho.aiBadge")
      : data.motivationSource === "user"
        ? t("rirekisho.userBadge")
        : null;

  return (
    <section
      className={cn(
        "space-y-3 rounded-lg border border-border/45 bg-muted/5 px-4 py-3",
        className,
      )}
      aria-labelledby={`rirekisho-${jobId}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            id={`rirekisho-${jobId}`}
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <ScrollText className="h-4 w-4 text-muted-foreground" />
            {t("rirekisho.title")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("rirekisho.description")}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => void download()}
          disabled={busy !== null}
        >
          {busy === "download" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {busy === "download"
            ? t("rirekisho.downloading")
            : t("rirekisho.download")}
        </Button>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={`rirekisho-motivation-${jobId}`}
            className="text-xs font-medium"
          >
            {t("rirekisho.motivationLabel")}
          </label>
          <span className="text-[11px] text-muted-foreground">
            {sourceLabel && !dirty ? `${sourceLabel} · ` : ""}
            {t("rirekisho.charCount", { count: value.trim().length })}
          </span>
        </div>
        <Textarea
          id={`rirekisho-motivation-${jobId}`}
          value={value}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("rirekisho.motivationPlaceholder")}
          rows={7}
          className="text-sm leading-relaxed"
          disabled={busy === "generate"}
        />
        {!saved && !dirty ? (
          <p className="text-[11px] text-muted-foreground">
            {t("rirekisho.empty")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void save()}
          disabled={!dirty || busy !== null}
        >
          {busy === "save" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {busy === "save" ? t("rirekisho.saving") : t("rirekisho.save")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={requestGenerate}
          disabled={busy !== null}
        >
          {busy === "generate" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {busy === "generate"
            ? t("rirekisho.generating")
            : saved
              ? t("rirekisho.regenerate")
              : t("rirekisho.generate")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => void copy()}
          disabled={!value.trim()}
        >
          <Copy className="mr-2 h-4 w-4" />
          {t("rirekisho.copy")}
        </Button>
      </div>

      <AlertDialog open={confirmRewrite} onOpenChange={setConfirmRewrite}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("rirekisho.rewriteConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("rirekisho.rewriteConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmRewrite(false);
                void generate();
              }}
            >
              {t("rirekisho.rewriteConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};
