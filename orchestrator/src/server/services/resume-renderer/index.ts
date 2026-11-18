import type { PdfPaperSize, PdfRenderer, TypstTheme } from "@shared/types";
import { buildResumeRenderDocument } from "./document";
import { renderLatexPdf } from "./latex";
import type { NormalizeResumeJsonOptions } from "./types";
import { renderTypstPdf } from "./typst";

/**
 * Today's date as YYYY-MM-DD in the given IANA time zone (falls back to the
 * server's zone), so generated documents are dated in the user's local time.
 */
export function formatRenderDate(
  timeZone?: string | null,
  now: Date = new Date(),
): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  try {
    return new Intl.DateTimeFormat("en-CA", {
      ...options,
      timeZone: timeZone || undefined,
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", options).format(now);
  }
}

export { buildResumeRenderDocument } from "./document";
export {
  getLatexTemplatePath,
  getTectonicBinary,
  readLatexTemplate,
} from "./latex";
export type * from "./types";
export {
  getTypstBinary,
  getTypstTemplatePath,
  readTypstTemplate,
} from "./typst";

type LocalPdfRenderer = Exclude<PdfRenderer, "rxresume">;

export async function renderResumePdf(args: {
  resumeJson: Record<string, unknown>;
  outputPath: string;
  jobId: string;
  language?: NormalizeResumeJsonOptions["language"];
  renderer?: LocalPdfRenderer;
  typstTheme?: TypstTheme;
  paperSize?: PdfPaperSize;
  timeZone?: string | null;
}): Promise<void> {
  const document = {
    ...buildResumeRenderDocument(args.resumeJson, {
      language: args.language,
    }),
    renderDate: formatRenderDate(args.timeZone),
  };
  if (args.renderer === "typst") {
    await renderTypstPdf({
      document,
      outputPath: args.outputPath,
      jobId: args.jobId,
      typstTheme: args.typstTheme,
      paperSize: args.paperSize,
    });
    return;
  }

  await renderLatexPdf({
    document,
    outputPath: args.outputPath,
    jobId: args.jobId,
    paperSize: args.paperSize,
  });
}
