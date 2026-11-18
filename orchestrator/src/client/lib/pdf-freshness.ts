import i18n from "@client/i18n";
import type { Job, JobListItem } from "@shared/types";

type PdfFreshnessCarrier = Pick<
  Job | JobListItem,
  "pdfFreshness" | "pdfRegenerating"
>;

export const getStalePdfMessage = (): string =>
  i18n.t("jobDetail:pdf.staleMessage");

export const getPdfRegeneratingMessage = (): string =>
  i18n.t("jobDetail:pdf.regeneratingMessage");

export function getPdfFreshness(
  job: PdfFreshnessCarrier | null | undefined,
): PdfFreshnessCarrier["pdfFreshness"] {
  if (job?.pdfRegenerating) return "regenerating";
  return job?.pdfFreshness ?? "missing";
}

export function isPdfStale(job: PdfFreshnessCarrier | null | undefined) {
  return getPdfFreshness(job) === "stale";
}

export function isPdfRegenerating(job: PdfFreshnessCarrier | null | undefined) {
  return getPdfFreshness(job) === "regenerating";
}

export function getPdfActionLabels(
  job: PdfFreshnessCarrier | null | undefined,
) {
  return isPdfStale(job)
    ? {
        view: i18n.t("jobDetail:pdf.viewOld"),
        download: i18n.t("jobDetail:pdf.downloadOld"),
      }
    : {
        view: i18n.t("jobDetail:pdf.view"),
        download: i18n.t("jobDetail:pdf.download"),
      };
}
