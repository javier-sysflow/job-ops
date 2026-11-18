import type { JevScreenOutcome } from "@server/services/jev/screen";
import { sql } from "drizzle-orm";
import { db, schema } from "../db/index";
import { getPrivateDataScope } from "../tenancy/private-scope";

const { jevScreens } = schema;

/** Stores the latest screening result for a job, replacing an earlier one. */
export async function saveJevScreen(input: {
  jobId: string;
  mode: "shadow" | "gate";
  outcome: JevScreenOutcome;
}): Promise<void> {
  const scope = getPrivateDataScope();
  const { outcome } = input;
  const values = {
    mode: input.mode,
    version: outcome.version,
    verdict: outcome.ok ? outcome.verdict : ("error" as const),
    model: outcome.ok ? outcome.model : null,
    result: JSON.stringify(outcome),
    inputTokens: outcome.ok ? outcome.inputTokens : null,
    latencyMs: outcome.latencyMs,
  };

  await db
    .insert(jevScreens)
    .values({
      jobId: input.jobId,
      tenantId: scope.tenantId,
      userId: scope.userId,
      ...values,
    })
    .onConflictDoUpdate({
      target: jevScreens.jobId,
      set: { ...values, screenedAt: sql`(datetime('now'))` },
    });
}
