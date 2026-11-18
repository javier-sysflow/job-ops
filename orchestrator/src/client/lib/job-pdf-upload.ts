import * as api from "@client/api";
import i18n from "@client/i18n";
import type { Job } from "@shared/types";
import { fileToUploadPayload } from "./file-upload-payload";

export async function uploadJobPdfFromFile(
  jobId: string,
  file: File,
): Promise<Job> {
  const payload = await fileToUploadPayload(
    file,
    i18n.t("jobDetail:pdf.encodeFailed"),
  );

  return api.uploadJobPdf(jobId, {
    fileName: payload.fileName,
    mediaType: payload.mediaType ?? undefined,
    dataBase64: payload.dataBase64,
  });
}
