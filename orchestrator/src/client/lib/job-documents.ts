import { formatNumber } from "@client/i18n/format";
import {
  canOpenJobDocumentInline,
  canPreviewJobDocumentAsRawText,
  canUseJobDocumentForTextContext,
  getJobDocumentFileExtension,
  isJobDocumentDocx,
  isJobDocumentImage,
  isJobDocumentPdf,
  isJobDocumentSafeInlineImage,
  isJobDocumentTextLike,
  type JobDocumentTypeTarget,
} from "@shared/job-document-classification.js";

export {
  canOpenJobDocumentInline,
  canPreviewJobDocumentAsRawText,
  canUseJobDocumentForTextContext,
  getJobDocumentFileExtension,
  isJobDocumentDocx,
  isJobDocumentImage,
  isJobDocumentPdf,
  isJobDocumentSafeInlineImage,
  isJobDocumentTextLike,
};
export type { JobDocumentTypeTarget };

const formatBytes = (value: number) =>
  formatNumber(value, { maximumFractionDigits: 1 });

export function formatJobDocumentByteSize(byteSize: number): string {
  if (byteSize < 1024) return `${byteSize} B`;
  if (byteSize < 1024 * 1024) {
    return `${formatBytes(byteSize / 1024)} KB`;
  }
  return `${formatBytes(byteSize / (1024 * 1024))} MB`;
}

export function canPreviewJobDocumentAsObject(
  document: JobDocumentTypeTarget,
): boolean {
  return isJobDocumentPdf(document) || isJobDocumentSafeInlineImage(document);
}

export function canPreviewJobDocumentAsText(
  document: JobDocumentTypeTarget,
): boolean {
  return canPreviewJobDocumentAsRawText(document);
}
