/**
 * Fork: re-runs a user's last job search in their own workspace, as if they
 * pressed Run again. Sources, top N and minimum score come from their last
 * run; search terms and location come from their saved settings.
 *
 *   npm run pipeline:rerun -- <username>
 *
 * In the container: cd /app/orchestrator && npm run pipeline:rerun -- <username>
 *
 * The server does not know about a run started here, so the user's page shows
 * the new jobs when they reload, not live progress. Refuses to start while
 * the user has a run that started in the last 30 minutes and is still open.
 */
import "../src/server/config/env";
import type { PipelineConfig } from "@shared/types";
import { and, desc, eq } from "drizzle-orm";
import { closeDb, db, schema } from "../src/server/db/index";
import { initializeExtractorRegistry } from "../src/server/extractors/registry";
import { runWithRequestContext } from "../src/server/infra/request-context";
import { runPipeline } from "../src/server/pipeline/orchestrator";

const RECENT_RUN_MS = 30 * 60 * 1000;

const RERUN_CONFIG_KEYS = [
  "topN",
  "minSuitabilityScore",
  "sources",
  "enableCrawling",
  "enableScoring",
  "enableImporting",
  "enableAutoTailoring",
  "watchlistSelectedSourceIds",
] as const satisfies ReadonlyArray<keyof PipelineConfig>;

function pickRerunConfig(value: unknown): Partial<PipelineConfig> {
  if (!value || typeof value !== "object") return {};
  const source = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of RERUN_CONFIG_KEYS) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out as Partial<PipelineConfig>;
}

async function main() {
  const username = process.argv.slice(2).join(" ").trim();
  if (!username) {
    throw new Error("Usage: npm run pipeline:rerun -- <username>");
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
    lastRun?.status === "running" &&
    Date.now() - Date.parse(lastRun.startedAt) < RECENT_RUN_MS
  ) {
    throw new Error(
      `A run for "${username}" started at ${lastRun.startedAt} and is still running`,
    );
  }

  const config = pickRerunConfig(lastRun?.requestedConfig);
  console.log(
    `Re-running the last search for "${username}" with`,
    JSON.stringify(config),
  );

  await initializeExtractorRegistry();
  const result = await runWithRequestContext(
    {
      requestId: `rerun-${Date.now()}`,
      userId: user.id,
      tenantId: membership.tenantId,
      username: user.username,
      isSystemAdmin: user.isSystemAdmin,
    },
    () => runPipeline(config),
  );

  console.log(
    `Done: success=${result.success} discovered=${result.jobsDiscovered} processed=${result.jobsProcessed}`,
    result.error ? `error=${result.error}` : "",
  );
  return result.success;
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
