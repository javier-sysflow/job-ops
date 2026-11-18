import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useRescoreJobMutation } from "@/client/hooks/queries/useJobMutations";
import i18n from "@/client/i18n";
import { showErrorToast } from "@/client/lib/error-toast";
import { trackProductEvent } from "@/lib/analytics";

export function useRescoreJob(onJobUpdated: () => void | Promise<void>) {
  const [isRescoring, setIsRescoring] = useState(false);
  const rescoreMutation = useRescoreJobMutation();

  const rescoreJob = useCallback(
    async (jobId?: string | null) => {
      if (!jobId) return;

      try {
        setIsRescoring(true);
        await rescoreMutation.mutateAsync(jobId);
        trackProductEvent("jobs_job_action_completed", {
          action: "rescore",
          result: "success",
        });
        toast.success(i18n.t("shell:hooks.rescore.success"));
        await onJobUpdated();
      } catch (error) {
        trackProductEvent("jobs_job_action_completed", {
          action: "rescore",
          result: "error",
        });
        showErrorToast(error, i18n.t("shell:hooks.rescore.failed"));
      } finally {
        setIsRescoring(false);
      }
    },
    [onJobUpdated, rescoreMutation],
  );

  return { isRescoring, rescoreJob };
}
