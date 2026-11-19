/** Fork: 履歴書 (rirekisho) endpoints. */
import { fetchApi, fetchDownloadApi } from "./core";

export interface JobRirekishoState {
  /** True when the 職務経歴書 layout is on, which is when 履歴書 shows. */
  enabled: boolean;
  motivation: string;
  motivationSource: "ai" | "user" | null;
  updatedAt: string | null;
}

export async function getJobRirekisho(
  jobId: string,
): Promise<JobRirekishoState> {
  return fetchApi<JobRirekishoState>(
    `/jobs/${encodeURIComponent(jobId)}/rirekisho`,
  );
}

export async function saveJobMotivation(
  jobId: string,
  motivation: string,
): Promise<JobRirekishoState> {
  return fetchApi<JobRirekishoState>(
    `/jobs/${encodeURIComponent(jobId)}/rirekisho`,
    { method: "PUT", body: JSON.stringify({ motivation }) },
  );
}

export async function generateJobMotivation(
  jobId: string,
): Promise<JobRirekishoState> {
  return fetchApi<JobRirekishoState>(
    `/jobs/${encodeURIComponent(jobId)}/rirekisho/generate`,
    { method: "POST" },
  );
}

export async function getJobRirekishoPdf(
  jobId: string,
): Promise<{ blob: Blob; fileName: string | null }> {
  return fetchDownloadApi(`/jobs/${encodeURIComponent(jobId)}/rirekisho/pdf`, {
    cache: "no-store",
  });
}

export async function getDesignRirekishoPdf(): Promise<{
  blob: Blob;
  fileName: string | null;
}> {
  return fetchDownloadApi("/design-resume/rirekisho/pdf", {
    cache: "no-store",
  });
}
