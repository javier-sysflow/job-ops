/**
 * Fork: 履歴書 PDFs (厚生労働省 2021 様式) and each job's own 志望動機.
 *
 * The form comes from the same base résumé as the 職務経歴書 plus the
 * `rirekishoProfile` setting (see shared/rirekisho.ts). A job's 履歴書 swaps in
 * that job's 志望動機, written by the AI for the company or edited by the user.
 * It is offered when the 職務経歴書 layout is active.
 */
import { existsSync } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { notFound } from "@infra/errors";
import { logger } from "@infra/logger";
import { safeFilenamePart } from "@shared/filename-sanitizer";
import {
  buildRirekishoData,
  type CalendarDate,
  parseRirekishoProfile,
  resolveRirekishoProfile,
} from "@shared/rirekisho.js";
import { stripHtmlTags } from "@shared/utils/string";
import * as jobRirekishoRepo from "../../repositories/job-rirekisho";
import * as jobsRepo from "../../repositories/jobs";
import * as settingsRepo from "../../repositories/settings";
import { withHostedUsageReservation } from "../hosted-usage";
import type { JsonSchemaDefinition } from "../llm/types";
import { createConfiguredLlmService, resolveLlmModel } from "../modelSelection";
import {
  loadBaseResumeSource,
  resolveTypstTheme,
  resolveUserTimeZone,
} from "../pdf";
import { getProfile } from "../profile";
import {
  buildResumeRenderDocument,
  formatRenderDate,
} from "../resume-renderer";
import { materializeResumePicture } from "../resume-renderer/picture";
import { runTypst } from "../resume-renderer/typst";
import { filterProfileProjectsForAi } from "../resumeProjects";
import { sanitizeProfileForPrompt } from "../scorer";
import { getWritingStyle } from "../writing-style";

const JAPANESE_TYPST_THEME = "shokumu-keirekisho";
const TEMPLATE_RELATIVE_PATH = "resume-renderer/rirekisho/rirekisho.typ";

export interface RirekishoPdfFile {
  fileName: string;
  content: Buffer;
}

function resolveTemplatePath(): string {
  try {
    if (import.meta.url.startsWith("file:")) {
      const candidate = join(
        fileURLToPath(import.meta.url),
        "..",
        "..",
        TEMPLATE_RELATIVE_PATH,
      );
      if (existsSync(candidate)) return candidate;
    }
  } catch {
    // Fall through to cwd-based resolution.
  }
  const cwd = process.cwd();
  return cwd.endsWith("orchestrator")
    ? join(cwd, "src/server/services", TEMPLATE_RELATIVE_PATH)
    : join(cwd, "orchestrator/src/server/services", TEMPLATE_RELATIVE_PATH);
}

/** 履歴書 features show with the 職務経歴書 layout. */
export async function isRirekishoEnabled(): Promise<boolean> {
  return (await resolveTypstTheme()) === JAPANESE_TYPST_THEME;
}

async function loadRirekishoProfile() {
  return parseRirekishoProfile(await settingsRepo.getSetting("rirekishoProfile"));
}

async function resolveToday(): Promise<CalendarDate> {
  const [year, month, day] = formatRenderDate(await resolveUserTimeZone())
    .split("-")
    .map(Number);
  return { year, month, day };
}

async function loadBaseResumeJson(): Promise<Record<string, unknown>> {
  try {
    return (await loadBaseResumeSource({ renderer: "typst" })).data;
  } catch (error) {
    logger.warn("履歴書: no base résumé to build from", { error });
    throw notFound("Resume Studio has not been imported yet.");
  }
}

export async function renderRirekishoPdf(args: {
  resumeJson: Record<string, unknown>;
  motivation?: string | null;
  jobId: string;
}): Promise<Buffer> {
  const [profile, today] = await Promise.all([
    loadRirekishoProfile(),
    resolveToday(),
  ]);
  const data: Record<string, unknown> = {
    ...buildRirekishoData({
      resumeJson: args.resumeJson,
      profile,
      motivation: args.motivation,
      today,
    }),
    picture: null,
  };

  const tempDir = await mkdtemp(join(tmpdir(), "job-ops-rirekisho-"));
  try {
    const document = await materializeResumePicture(
      buildResumeRenderDocument(args.resumeJson, { language: "japanese" }),
      tempDir,
    ).catch((error) => {
      logger.warn("履歴書: photo could not be loaded, leaving the box empty", {
        jobId: args.jobId,
        error,
      });
      return null;
    });
    const picturePath = document?.picture?.renderPath;
    if (picturePath) data.picture = basename(picturePath);

    const typPath = join(tempDir, "rirekisho.typ");
    const outputPath = join(tempDir, "rirekisho.pdf");
    await copyFile(resolveTemplatePath(), typPath);
    await writeFile(join(tempDir, "data.json"), JSON.stringify(data), "utf8");
    await runTypst({ cwd: tempDir, typPath, outputPath, jobId: args.jobId });
    return await readFile(outputPath);
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function rirekishoFileName(...parts: string[]): string {
  return `${parts
    .map((part) => safeFilenamePart(part, { language: "japanese" }))
    .filter(Boolean)
    .join("-")}-履歴書.pdf`;
}

/** The base 履歴書 with the profile's own 志望動機. */
export async function generateDesignRirekishoPdf(): Promise<RirekishoPdfFile> {
  const resumeJson = await loadBaseResumeJson();
  const content = await renderRirekishoPdf({ resumeJson, jobId: "design-resume" });
  const name = (resumeJson.basics as { name?: string } | undefined)?.name ?? "";
  logger.info("Generated base 履歴書 PDF", { bytes: content.length });
  return { fileName: rirekishoFileName(name || "resume"), content };
}

/** A job's 履歴書, with that job's 志望動機 when there is one. */
export async function generateJobRirekishoPdf(
  jobId: string,
): Promise<RirekishoPdfFile> {
  const job = await jobsRepo.getJobById(jobId);
  if (!job) throw notFound("Job not found");
  const [resumeJson, record] = await Promise.all([
    loadBaseResumeJson(),
    jobRirekishoRepo.getJobRirekisho(jobId),
  ]);
  const content = await renderRirekishoPdf({
    resumeJson,
    motivation: record?.motivation ?? null,
    jobId,
  });
  logger.info("Generated job 履歴書 PDF", { jobId, bytes: content.length });
  return {
    fileName: rirekishoFileName(job.employer || "company", job.title || "job"),
    content,
  };
}

// ---------------------------------------------------------------------------
// A job's 志望動機
// ---------------------------------------------------------------------------

const MOTIVATION_SCHEMA: JsonSchemaDefinition = {
  name: "rirekisho_motivation",
  schema: {
    type: "object",
    properties: {
      motivation: {
        type: "string",
        description:
          "The 志望動機 in Japanese, です・ます調, 300–400 characters, plain text with paragraphs separated by \\n.",
      },
    },
    required: ["motivation"],
    additionalProperties: false,
  },
};

const DESCRIPTION_CHAR_LIMIT = 6000;

function cleanMotivation(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\*\*|__|^#+\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildMotivationPrompt(args: {
  job: {
    title: string;
    employer: string;
    location: string | null;
    description: string;
    brief: string | null;
  };
  profileJson: string;
  baseMotivation: string;
  constraints: string;
  doNotUse: string;
}): string {
  return `Write the 志望動機 (motivation statement) for a Japanese 履歴書 (rirekisho) for one job application.

Rules:
- Japanese only, polite です・ます調, 300 to 400 characters. Plain text: no headings, bullets or markdown. Two or three short paragraphs separated by a newline.
- Say why this company and this role, which of the candidate's real experience fits what the listing asks for, and how the candidate will contribute. Refer to the company as 貴社.
- Use only facts from the candidate profile and the job listing. Never invent numbers, achievements, company facts, products or values that are not written there. If the listing says little about the company, focus on the role and the work.
- No placeholders like 〇〇 or [会社名].
- The candidate's own motivation statement is given below when there is one: keep its voice and the points that still fit this job, but rewrite it for this company.${args.constraints ? `\n- Writing constraints from the candidate: ${args.constraints}` : ""}${args.doNotUse ? `\n- Do not use these words or phrases: ${args.doNotUse}` : ""}

JOB:
Title: ${args.job.title}
Company: ${args.job.employer}
Location: ${args.job.location ?? "Not specified"}
${args.job.brief ? `Summary of the listing: ${args.job.brief}\n` : ""}Listing:
${args.job.description || "No description available"}

CANDIDATE PROFILE (JSON):
${args.profileJson}

CANDIDATE'S OWN 志望動機:
${args.baseMotivation || "(none)"}`;
}

export async function generateJobMotivation(
  jobId: string,
  options: { skipHostedUsage?: boolean } = {},
): Promise<string> {
  if (!options.skipHostedUsage) {
    return withHostedUsageReservation({ action: "tailoring" }, async () => ({
      result: await generateJobMotivation(jobId, { skipHostedUsage: true }),
      usedUnits: 1,
    }));
  }

  const job = await jobsRepo.getJobById(jobId);
  if (!job) throw notFound("Job not found");

  const [model, profile, resumeJson, storedProfile, writingStyle] =
    await Promise.all([
      resolveLlmModel("tailoring"),
      getProfile(),
      loadBaseResumeJson(),
      loadRirekishoProfile(),
      getWritingStyle(),
    ]);
  const aiProfile = sanitizeProfileForPrompt(
    (await filterProfileProjectsForAi(profile)) as Record<string, unknown>,
  );
  const description = stripHtmlTags(job.jobDescription ?? "");
  const prompt = buildMotivationPrompt({
    job: {
      title: job.title,
      employer: job.employer,
      location: job.location ?? null,
      description: description.slice(0, DESCRIPTION_CHAR_LIMIT),
      brief: job.jobBrief ? JSON.stringify(job.jobBrief) : null,
    },
    profileJson: JSON.stringify(aiProfile),
    baseMotivation: resolveRirekishoProfile(storedProfile, resumeJson).motivation,
    constraints: writingStyle.constraints?.trim() ?? "",
    doNotUse: writingStyle.doNotUse?.trim() ?? "",
  });

  const llm = await createConfiguredLlmService("tailoring");
  const result = await llm.callJson<{ motivation: string }>({
    model,
    messages: [{ role: "user", content: prompt }],
    jsonSchema: MOTIVATION_SCHEMA,
    jobId,
  });
  if (!result.success) {
    throw new Error(`志望動機 generation failed: ${result.error}`);
  }
  const motivation = cleanMotivation(result.data.motivation ?? "");
  if (!motivation) throw new Error("志望動機 generation returned no text");
  return motivation;
}

/**
 * After a job is tailored: write its 志望動機 when the 職務経歴書 layout is
 * on, unless the user has edited it. Never fails the tailoring.
 */
export async function refreshJobMotivationAfterTailoring(
  jobId: string,
  options: { tailoringRan: boolean },
): Promise<void> {
  try {
    if (!(await isRirekishoEnabled())) return;
    const existing = await jobRirekishoRepo.getJobRirekisho(jobId);
    if (existing?.motivationSource === "user") return;
    if (existing?.motivation && !options.tailoringRan) return;
    const motivation = await generateJobMotivation(jobId, {
      skipHostedUsage: true,
    });
    await jobRirekishoRepo.saveJobMotivation(jobId, motivation, "ai");
  } catch (error) {
    logger.warn("Could not write the job's 志望動機", { jobId, error });
  }
}
