/**
 * Word (.docx) downloads of the Resume Studio resume and of a job's tailored
 * resume. They use the same resume data, output language, paper size and
 * layout choice (職務経歴書 or English résumé) as the PDFs.
 */
import { notFound } from "@infra/errors";
import { logger } from "@infra/logger";
import { safeFilenamePart, safePdfFileName } from "@shared/filename-sanitizer";
import type { Job } from "@shared/types";
import * as jobsRepo from "../repositories/jobs";
import { getCurrentDesignResume } from "./design-resume";
import {
  loadBaseResumeSource,
  resolveLocalResumeLanguage,
  resolvePdfPaperSize,
  resolvePdfRenderer,
  resolveTypstTheme,
  resolveUserTimeZone,
} from "./pdf";
import { buildResumeRenderDocument, formatRenderDate } from "./resume-renderer";
import {
  type DocxResumeLayout,
  renderResumeDocx,
} from "./resume-renderer/docx";
import { prepareTailoredResumeForPdf } from "./rxresume";
import { parseV5ResumeData } from "./rxresume/schema/v5";

export { DOCX_MIME_TYPE } from "./resume-renderer/docx";

export interface ResumeDocxFile {
  fileName: string;
  content: Buffer;
}

const JAPANESE_TYPST_THEME = "shokumu-keirekisho";

/** The 職務経歴書 layout when it is the active PDF layout, else the résumé. */
async function resolveDocxLayout(): Promise<DocxResumeLayout> {
  const renderer = await resolvePdfRenderer();
  if (renderer !== "typst") return "resume";
  return (await resolveTypstTheme()) === JAPANESE_TYPST_THEME
    ? "shokumu"
    : "resume";
}

async function renderDocx(
  resumeJson: Record<string, unknown>,
  jobDescription?: string | null,
): Promise<{
  content: Buffer;
  language: Awaited<ReturnType<typeof resolveLocalResumeLanguage>>;
}> {
  const [language, layout, paperSize, timeZone] = await Promise.all([
    resolveLocalResumeLanguage(resumeJson, jobDescription),
    resolveDocxLayout(),
    resolvePdfPaperSize(),
    resolveUserTimeZone(),
  ]);
  const document = {
    ...buildResumeRenderDocument(resumeJson, { language }),
    renderDate: formatRenderDate(timeZone),
  };
  const content = await renderResumeDocx({ document, layout, paperSize });
  return { content, language };
}

function toDocxFileName(pdfFileName: string): string {
  return pdfFileName.replace(/\.pdf$/i, ".docx");
}

export async function generateDesignResumeDocx(): Promise<ResumeDocxFile> {
  const designResume = await getCurrentDesignResume();
  if (!designResume?.resumeJson) {
    throw notFound("Resume Studio has not been imported yet.");
  }
  const resumeJson = parseV5ResumeData(
    designResume.resumeJson as Record<string, unknown>,
  ) as Record<string, unknown>;
  const { content, language } = await renderDocx(resumeJson);
  logger.info("Generated Design Resume DOCX", {
    documentId: designResume.id,
    bytes: content.length,
  });
  return {
    fileName: toDocxFileName(
      safePdfFileName(designResume.title, {
        fallbackBase: "Design_Resume",
        language,
      }),
    ),
    content,
  };
}

function parseTailoredSkills(job: Job) {
  if (!job.tailoredSkills) return [];
  try {
    const parsed = JSON.parse(job.tailoredSkills);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * The job's tailored resume (tailored summary, headline, skills and project
 * selection applied to the base resume), as the job's PDF would show it.
 */
export async function generateJobResumeDocx(
  jobId: string,
  options: { requestOrigin?: string | null } = {},
): Promise<ResumeDocxFile> {
  const job = await jobsRepo.getJobById(jobId);
  if (!job) throw notFound("Job not found");

  // Local resume data only: the Reactive Resume template merge matters for
  // its PDF export, not for the content a Word file carries.
  const baseResume = await loadBaseResumeSource({ renderer: "typst" });
  const prepared = await prepareTailoredResumeForPdf({
    resumeData: baseResume.data,
    tailoredContent: {
      summary: job.tailoredSummary || "",
      headline: job.tailoredHeadline || "",
      skills: parseTailoredSkills(job),
    },
    jobDescription: job.jobDescription || "",
    selectedProjectIds: job.selectedProjectIds,
    jobId: job.id,
    tracerLinks: {
      enabled: Boolean(job.tracerLinksEnabled),
      requestOrigin: options.requestOrigin ?? null,
      companyName: job.employer ?? null,
    },
  });
  const { content, language } = await renderDocx(
    prepared.data,
    job.jobDescription,
  );
  logger.info("Generated job resume DOCX", { jobId, bytes: content.length });
  return {
    fileName: `${safeFilenamePart(job.employer || "Unknown", { language })}-${safeFilenamePart(job.title || "Job", { language })}-resume.docx`,
    content,
  };
}

/**
 * `Content-Disposition` for a download, with an ASCII fallback name plus the
 * UTF-8 one (Japanese file names) for browsers that read `filename*`.
 */
export function docxContentDisposition(fileName: string): string {
  const asciiFallback =
    [...fileName]
      .map((char) => {
        const code = char.charCodeAt(0);
        const printable = code >= 0x20 && code <= 0x7e;
        return printable && char !== '"' && char !== "\\" ? char : "_";
      })
      .join("") || "resume.docx";
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
