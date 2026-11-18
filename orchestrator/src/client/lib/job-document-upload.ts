import * as api from "@client/api";
import i18n from "@client/i18n";
import type { JobDocument } from "@shared/types";
import { fileToUploadPayload } from "./file-upload-payload";

export async function uploadJobDocumentFromFile(
  jobId: string,
  file: File,
): Promise<JobDocument> {
  const payload = await fileToUploadPayload(
    file,
    i18n.t("jobDetail:pdf.documentEncodeFailed"),
  );

  return api.uploadJobDocument(jobId, {
    fileName: payload.fileName,
    mediaType: payload.mediaType,
    dataBase64: payload.dataBase64,
  });
}
