/**
 * Fork: a job's 履歴書: its own 志望動機 (read, edit, rewrite with AI) and the
 * filled-in 履歴書 PDF.
 */
import { notFound } from "@infra/errors";
import { fail, ok } from "@infra/http";
import { logger } from "@infra/logger";
import * as jobRirekishoRepo from "@server/repositories/job-rirekisho";
import * as jobsRepo from "@server/repositories/jobs";
import { docxContentDisposition } from "@server/services/resume-docx";
import {
  generateJobMotivation,
  generateJobRirekishoPdf,
  isRirekishoEnabled,
} from "@server/services/rirekisho";
import { type Request, type Response, Router } from "express";
import { z } from "zod";
import { toJobsRouteError } from "./shared";

export const jobsRirekishoRouter = Router();

const motivationSchema = z.object({
  motivation: z.string().max(3000),
});

function failRoute(req: Request, res: Response, route: string, error: unknown) {
  const err = toJobsRouteError(error);
  logger[err.status === 404 ? "warn" : "error"]("Job 履歴書 route failed", {
    route,
    jobId: req.params.id,
    status: err.status,
    code: err.code,
    errorMessage: error instanceof Error ? error.message : undefined,
  });
  fail(res, err);
}

async function assertJobExists(jobId: string): Promise<void> {
  if (!(await jobsRepo.getJobById(jobId))) throw notFound("Job not found");
}

async function readState(jobId: string) {
  const [enabled, record] = await Promise.all([
    isRirekishoEnabled(),
    jobRirekishoRepo.getJobRirekisho(jobId),
  ]);
  return {
    enabled,
    motivation: record?.motivation ?? "",
    motivationSource: record?.motivationSource ?? null,
    updatedAt: record?.updatedAt ?? null,
  };
}

jobsRirekishoRouter.get("/:id/rirekisho", async (req, res) => {
  try {
    await assertJobExists(req.params.id);
    ok(res, await readState(req.params.id));
  } catch (error) {
    failRoute(req, res, "GET /:id/rirekisho", error);
  }
});

jobsRirekishoRouter.put("/:id/rirekisho", async (req, res) => {
  try {
    await assertJobExists(req.params.id);
    const { motivation } = motivationSchema.parse(req.body);
    await jobRirekishoRepo.saveJobMotivation(
      req.params.id,
      motivation.trim(),
      "user",
    );
    ok(res, await readState(req.params.id));
  } catch (error) {
    failRoute(req, res, "PUT /:id/rirekisho", error);
  }
});

jobsRirekishoRouter.post("/:id/rirekisho/generate", async (req, res) => {
  try {
    await assertJobExists(req.params.id);
    const motivation = await generateJobMotivation(req.params.id);
    await jobRirekishoRepo.saveJobMotivation(req.params.id, motivation, "ai");
    ok(res, await readState(req.params.id));
  } catch (error) {
    failRoute(req, res, "POST /:id/rirekisho/generate", error);
  }
});

jobsRirekishoRouter.get("/:id/rirekisho/pdf", async (req, res) => {
  try {
    const file = await generateJobRirekishoPdf(req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", docxContentDisposition(file.fileName));
    res.setHeader("Cache-Control", "no-store");
    res.send(file.content);
  } catch (error) {
    failRoute(req, res, "GET /:id/rirekisho/pdf", error);
  }
});
