import { logger } from "@infra/logger";
import * as jobsRepo from "@server/repositories/jobs";
import {
  deduplicateJobsByTitleAndEmployer,
  filterJobsAlreadyKnown,
} from "@shared/job-matching.js";
import type { CreateJobInput } from "@shared/types";
import { progressHelpers } from "../progress";

export async function importJobsStep(args: {
  discoveredJobs: CreateJobInput[];
}): Promise<{ created: number; skipped: number; fuzzyMerged: number }> {
  logger.info("Importing discovered jobs", {
    discovered: args.discoveredJobs.length,
  });

  const dedupedJobs = deduplicateJobsByTitleAndEmployer(args.discoveredJobs);
  const fuzzyMerged = args.discoveredJobs.length - dedupedJobs.length;

  if (fuzzyMerged > 0) {
    logger.info("Fuzzy-deduped discovered jobs before import", {
      original: args.discoveredJobs.length,
      dedupedCount: dedupedJobs.length,
      fuzzyMerged,
    });
  }

  // Fork: also drop jobs already in the list under another link or from
  // another site; exact-URL matches are still skipped by createJobs.
  const { fresh, duplicates } = filterJobsAlreadyKnown(
    dedupedJobs,
    await jobsRepo.listJobIdentities(),
  );
  if (duplicates.length > 0) {
    logger.info("Skipped discovered jobs already in the list", {
      knownDuplicates: duplicates.length,
    });
  }

  const { created, skipped: skippedByUrl } = await jobsRepo.createJobs(
    fresh,
    (job, index, total) =>
      progressHelpers.importingJob(index, total, {
        id: job.jobUrl,
        title: job.title,
        employer: job.employer,
      }),
  );
  const skipped = skippedByUrl + duplicates.length;
  logger.info("Import step complete", {
    discovered: args.discoveredJobs.length,
    fuzzyMerged,
    created,
    skipped,
  });

  progressHelpers.importComplete(created, skipped + fuzzyMerged);

  return { created, skipped, fuzzyMerged };
}
