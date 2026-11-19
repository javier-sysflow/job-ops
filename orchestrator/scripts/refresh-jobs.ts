/**
 * Fork: re-scores and/or re-tailors the jobs already in a user's list, after
 * a change to scoring or tailoring (a re-run only imports new jobs).
 *
 *   npm run jobs:refresh -- <username> [--rescore] [--retailor] [--dry-run]
 *
 * In the container: cd /app/orchestrator && npm run jobs:refresh -- <username> --rescore --retailor
 *
 * --rescore   re-scores every "discovered" and "ready" job (the scoring model).
 * --retailor  rewrites the tailored summary, headline and skills of every
 *             "ready" job and regenerates its PDF (the writing model).
 * --dry-run   lists what would be refreshed and stops.
 *
 * Applied and later jobs are left alone: their PDF may already be sent.
 * Refuses to start while the user has a run that started in the last 30
 * minutes and is still open: the server's pipeline lock can't see this script.
 */
import "../src/server/config/env";
import { and, desc, eq, inArray } from "drizzle-orm";
import { closeDb, db, schema } from "../src/server/db/index";
import { runWithRequestContext } from "../src/server/infra/request-context";
import { processJob } from "../src/server/pipeline/orchestrator";
import {
  buildJobActionExecutionOptions,
  executeJobActionForJob,
} from "../src/server/services/jobs/actions";

const RECENT_RUN_MS = 30 * 60 * 1000;

type Flags = {
  username: string;
  rescore: boolean;
  retailor: boolean;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Flags {
  const words: string[] = [];
  const flags = { rescore: false, retailor: false, dryRun: false };
  for (const arg of argv) {
    if (arg === "--rescore") flags.rescore = true;
    else if (arg === "--retailor") flags.retailor = true;
    else if (arg === "--dry-run") flags.dryRun = true;
    else words.push(arg);
  }
  return { username: words.join(" ").trim(), ...flags };
}

async function main(): Promise<boolean> {
  const { username, rescore, retailor, dryRun } = parseArgs(
    process.argv.slice(2),
  );
  if (!username || (!rescore && !retailor)) {
    throw new Error(
      "Usage: npm run jobs:refresh -- <username> [--rescore] [--retailor] [--dry-run]",
    );
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username));
  if (!user) throw new Error(`No user named "${username}"`);
  const [membership] = await db
    .select()
    .from(schema.tenantMemberships)
    .where(eq(schema.tenantMemberships.userId, user.id));
  if (!membership) throw new Error(`User "${username}" has no workspace`);

  const [lastRun] = await db
    .select()
    .from(schema.pipelineRuns)
    .where(
      and(
        eq(schema.pipelineRuns.tenantId, membership.tenantId),
        eq(schema.pipelineRuns.userId, user.id),
      ),
    )
    .orderBy(desc(schema.pipelineRuns.startedAt))
    .limit(1);
  if (
    !dryRun &&
    lastRun?.status === "running" &&
    Date.now() - Date.parse(lastRun.startedAt) < RECENT_RUN_MS
  ) {
    throw new Error(
      `A run for "${username}" started at ${lastRun.startedAt} and is still running`,
    );
  }

  const jobs = await db
    .select({
      id: schema.jobs.id,
      status: schema.jobs.status,
      title: schema.jobs.title,
      employer: schema.jobs.employer,
      score: schema.jobs.suitabilityScore,
    })
    .from(schema.jobs)
    .where(
      and(
        eq(schema.jobs.tenantId, membership.tenantId),
        inArray(schema.jobs.status, ["discovered", "ready"]),
      ),
    );
  const toRescore = rescore ? jobs : [];
  const toRetailor = retailor ? jobs.filter((job) => job.status === "ready") : [];
  console.log(
    `"${username}": ${toRescore.length} job(s) to re-score, ${toRetailor.length} to re-tailor`,
  );
  if (dryRun) {
    for (const job of jobs) {
      console.log(
        `  [${job.status}] ${job.score ?? "-"}  ${job.title} / ${job.employer}`,
      );
    }
    return true;
  }

  return runWithRequestContext(
    {
      requestId: `refresh-${Date.now()}`,
      userId: user.id,
      tenantId: membership.tenantId,
      username: user.username,
      isSystemAdmin: user.isSystemAdmin,
    },
    async () => {
      let failures = 0;
      const rescoreOptions = buildJobActionExecutionOptions("rescore");
      for (const [index, job] of toRescore.entries()) {
        const result = await executeJobActionForJob(
          "rescore",
          job.id,
          rescoreOptions,
        );
        if (result.ok) {
          console.log(
            `rescore ${index + 1}/${toRescore.length}: ${job.score ?? "-"} -> ${result.job.suitabilityScore ?? "-"}  ${job.title}`,
          );
        } else {
          failures += 1;
          console.error(`rescore failed: ${job.title}`, result);
        }
      }
      for (const [index, job] of toRetailor.entries()) {
        const result = await processJob(job.id, {
          force: true,
          analyticsOrigin: "generate_pdf",
        });
        if (result.success) {
          console.log(
            `retailor ${index + 1}/${toRetailor.length}: ${job.title}`,
          );
        } else {
          failures += 1;
          console.error(`retailor failed: ${job.title}: ${result.error}`);
        }
      }
      console.log(`Done with ${failures} failure(s)`);
      return failures === 0;
    },
  );
}

main()
  .then((success) => {
    closeDb();
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    closeDb();
    process.exit(1);
  });
