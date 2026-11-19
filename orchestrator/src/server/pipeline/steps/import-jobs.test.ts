import type { CreateJobInput } from "@shared/types";
import { describe, expect, it, vi } from "vitest";
import { importJobsStep } from "./import-jobs";

vi.mock("@infra/logger", () => ({
  logger: { info: vi.fn() },
}));

vi.mock("@server/repositories/jobs", () => ({
  createJobs: vi.fn(async () => ({ created: 1, skipped: 0 })),
  listJobIdentities: vi.fn(async () => []),
}));

vi.mock("../progress", () => ({
  progressHelpers: {
    importingJob: vi.fn(),
    importComplete: vi.fn(),
  },
}));

describe("importJobsStep", () => {
  it("publishes the job currently being imported", async () => {
    const jobsRepo = await import("@server/repositories/jobs");
    const { progressHelpers } = await import("../progress");
    const job: CreateJobInput = {
      source: "linkedin",
      title: "Frontend Engineer",
      employer: "Monzo",
      jobUrl: "https://example.com/jobs/1",
    };

    await importJobsStep({ discoveredJobs: [job] });

    const onProgress = vi.mocked(jobsRepo.createJobs).mock.calls[0]?.[1];
    expect(onProgress).toBeTypeOf("function");
    onProgress?.(job, 1, 1);

    expect(progressHelpers.importingJob).toHaveBeenCalledWith(1, 1, {
      id: job.jobUrl,
      title: job.title,
      employer: job.employer,
    });
  });

  it("skips jobs already in the list under another link", async () => {
    const jobsRepo = await import("@server/repositories/jobs");
    vi.mocked(jobsRepo.createJobs).mockClear();
    vi.mocked(jobsRepo.listJobIdentities).mockResolvedValueOnce([
      {
        jobUrl: "https://www.linkedin.com/jobs/view/3876325633",
        title: "Climate & Value Innovationコンサルタント",
        employer: "KPMG Japan",
      },
    ]);
    const sameLinkedInJob: CreateJobInput = {
      source: "linkedin",
      title: "Climate & Value Innovationコンサルタント",
      employer: "KPMG Japan",
      jobUrl:
        "https://jp.linkedin.com/jobs/view/bi-cvi-climate-value-innovation-3876325633",
    };
    const newJob: CreateJobInput = {
      source: "linkedin",
      title: "Energy consultant",
      employer: "PwC Japan",
      jobUrl: "https://www.linkedin.com/jobs/view/4450674047",
    };

    const result = await importJobsStep({
      discoveredJobs: [sameLinkedInJob, newJob],
    });

    expect(vi.mocked(jobsRepo.createJobs).mock.calls[0]?.[0]).toEqual([newJob]);
    expect(result).toEqual({ created: 1, skipped: 1, fuzzyMerged: 0 });
  });
});
