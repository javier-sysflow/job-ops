/**
 * Fork: a job's own 志望動機 for its 履歴書. One row per job, in the user's
 * private workspace.
 */
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema } from "../db/index";
import {
  getPrivateDataScope,
  privateDataScopeFilter,
} from "../tenancy/private-scope";

const { jobRirekisho } = schema;

export type MotivationSource = "ai" | "user";

export interface JobRirekisho {
  jobId: string;
  motivation: string;
  motivationSource: MotivationSource;
  updatedAt: string;
}

function scopeFilter() {
  return privateDataScopeFilter(jobRirekisho);
}

export async function getJobRirekisho(
  jobId: string,
): Promise<JobRirekisho | null> {
  const [row] = await db
    .select()
    .from(jobRirekisho)
    .where(and(scopeFilter(), eq(jobRirekisho.jobId, jobId)));
  if (!row) return null;
  return {
    jobId: row.jobId,
    motivation: row.motivation,
    motivationSource: row.motivationSource,
    updatedAt: row.updatedAt,
  };
}

export async function saveJobMotivation(
  jobId: string,
  motivation: string,
  source: MotivationSource,
): Promise<JobRirekisho> {
  const scope = getPrivateDataScope();
  const now = new Date().toISOString();
  const existing = await getJobRirekisho(jobId);
  if (existing) {
    await db
      .update(jobRirekisho)
      .set({ motivation, motivationSource: source, updatedAt: now })
      .where(and(scopeFilter(), eq(jobRirekisho.jobId, jobId)));
  } else {
    await db.insert(jobRirekisho).values({
      id: randomUUID(),
      tenantId: scope.tenantId,
      userId: scope.userId,
      jobId,
      motivation,
      motivationSource: source,
      createdAt: now,
      updatedAt: now,
    });
  }
  return { jobId, motivation, motivationSource: source, updatedAt: now };
}
