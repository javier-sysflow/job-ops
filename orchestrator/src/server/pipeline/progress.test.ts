import enPipeline from "@client/i18n/locales/en/pipeline";
import { runWithRequestContext } from "@infra/request-context";
import { describe, expect, it } from "vitest";
import {
  getProgress,
  progressHelpers,
  resetProgress,
  updateProgress,
} from "./progress";

const inTenant = <T>(tenantId: string, run: () => T) =>
  runWithRequestContext({ requestId: `test-${tenantId}`, tenantId }, run);

type ResourceTree = { [key: string]: string | ResourceTree };

/** English UI text for a progress translation key, interpolated like i18next. */
function englishText(
  key: string,
  params: Record<string, string | number> | undefined,
): string | undefined {
  const [namespace, path] = key.split(":");
  if (namespace !== "pipeline" || !path) return undefined;
  let node: string | ResourceTree | undefined =
    enPipeline as unknown as ResourceTree;
  for (const part of path.split(".")) {
    node = typeof node === "object" ? node[part] : undefined;
  }
  if (typeof node !== "string") return undefined;
  return node.replace(/\{\{(\w+)\}\}/g, (_match, name: string) =>
    String(params?.[name] ?? `{{${name}}}`),
  );
}

function expectTranslatableText() {
  const progress = getProgress();
  expect(progress.messageKey).toBeDefined();
  expect(englishText(progress.messageKey ?? "", progress.messageParams)).toBe(
    progress.message,
  );
  if (progress.detailKey) {
    expect(englishText(progress.detailKey, progress.detailParams)).toBe(
      progress.detail,
    );
  }
  return progress;
}

describe("pipeline progress translation keys", () => {
  const job = { id: "job-1", title: "Backend Engineer", employer: "Acme" };
  const challenge = (extractorId: string) => ({
    extractorId,
    extractorName: extractorId,
    url: `https://example.com/${extractorId}`,
    sources: [],
  });

  it("sends keys whose English text matches every server message", () => {
    inTenant("progress-i18n", () => {
      resetProgress();
      expectTranslatableText();

      progressHelpers.startCrawling(2);
      expect(expectTranslatableText().detailKey).toBeDefined();

      progressHelpers.startSource("indeed", 0, 2, { detail: "From source" });
      expect(expectTranslatableText().detailKey).toBeUndefined();

      progressHelpers.crawlingUpdate({
        source: "indeed",
        listPagesProcessed: 1,
        jobPagesProcessed: 2,
        jobPagesEnqueued: 4,
      });
      expect(expectTranslatableText().detailKey).toBeDefined();

      progressHelpers.crawlingUpdate({
        source: "indeed",
        termsProcessed: 1,
        termsTotal: 3,
        listPagesTotal: 5,
        jobCardsFound: 7,
        phase: "list",
        currentUrl: "https://example.com/list",
      });
      expect(expectTranslatableText().detailKey).toBeDefined();

      progressHelpers.crawlingUpdate({
        source: "indeed",
        jobPagesSkipped: 2,
        phase: "job",
        currentUrl: "https://example.com/job",
      });
      expectTranslatableText();

      progressHelpers.crawlingComplete(5);
      expectTranslatableText();
      progressHelpers.importingJob(1, 5, job);
      expectTranslatableText();
      progressHelpers.importComplete(3, 2);
      expectTranslatableText();
      progressHelpers.scoringJob(1, 3, job, 0);
      expectTranslatableText();
      progressHelpers.scoringComplete(3);
      expectTranslatableText();
      progressHelpers.processingJob(1, 2, job);
      expectTranslatableText();
      progressHelpers.generatingSummary(job);
      expectTranslatableText();
      progressHelpers.generatingPdf(job);
      expectTranslatableText();
      progressHelpers.jobComplete(1, 2);
      expectTranslatableText();
      progressHelpers.complete(5, 2);
      expectTranslatableText();

      progressHelpers.challengeRequired([challenge("one")]);
      expectTranslatableText();
      progressHelpers.challengeRequired([challenge("one"), challenge("two")]);
      expectTranslatableText();
      progressHelpers.challengeResolved([challenge("one")]);
      expectTranslatableText();
      progressHelpers.challengeResolved([challenge("one"), challenge("two")]);
      expectTranslatableText();
      progressHelpers.challengeResolved([]);
      expectTranslatableText();

      progressHelpers.cancelled("Cancelled by user");
      expect(expectTranslatableText().detailKey).toBeUndefined();
      progressHelpers.failed("Boom");
      expectTranslatableText();
      progressHelpers.configurationRequired("Missing key");
      expectTranslatableText();
    });
  });

  it("drops stale keys when text is updated without one", () => {
    inTenant("progress-i18n-stale", () => {
      resetProgress();
      progressHelpers.scoringJob(1, 3, job, 0);
      updateProgress({ message: "Custom message", detail: "Custom detail" });
      const progress = getProgress();
      expect(progress.messageKey).toBeUndefined();
      expect(progress.messageParams).toBeUndefined();
      expect(progress.detailKey).toBeUndefined();
      expect(progress.detailParams).toBeUndefined();
    });
  });
});

describe("pipeline fanout progress", () => {
  it("tracks task and term transitions", () => {
    inTenant("fanout-a", () => {
      resetProgress();
      progressHelpers.initializeFanout({
        roles: ["Backend", "Platform"],
        tasks: [
          { id: "jobspy", unitsPerRole: 9 },
          { id: "gradcracker", unitsPerRole: 3 },
        ],
        locations: ["Manchester", "London", "Leeds"],
        sources: ["indeed", "linkedin", "glassdoor", "gradcracker"],
        locationCount: 3,
        sourceCount: 4,
        capacity: 3,
      });
      progressHelpers.startFanoutTask("jobspy");
      progressHelpers.updateFanoutTaskTerms("jobspy", "Backend", 0, 6);
      progressHelpers.updateFanoutTaskTerms("jobspy", "Backend", 0, 6);
      progressHelpers.updateFanoutTaskTerms("jobspy", "Backend", 1, 6);
      progressHelpers.updateFanoutTaskTerms("jobspy", "Platform", 1, 6);
      progressHelpers.settleFanoutTask("gradcracker", "check");
      progressHelpers.updateFanoutResults(12, 9);

      expect(getProgress().fanout).toEqual({
        termCount: 2,
        locationCount: 3,
        sourceCount: 4,
        locations: ["Manchester", "London", "Leeds"],
        sources: ["indeed", "linkedin", "glassdoor", "gradcracker"],
        total: 24,
        capacity: 3,
        results: 12,
        unique: 9,
        roles: [
          { role: "Backend", complete: 3, running: 0, queued: 6, check: 3 },
          { role: "Platform", complete: 0, running: 3, queued: 6, check: 3 },
        ],
      });
    });
  });

  it("keeps completed searches complete through a later challenge and retry", () => {
    inTenant("fanout-challenge", () => {
      resetProgress();
      progressHelpers.initializeFanout({
        roles: ["Backend", "Platform", "Data"],
        tasks: [{ id: "hiringcafe", unitsPerRole: 1 }],
        locations: ["Amsterdam"],
        sources: ["hiringcafe"],
        locationCount: 1,
        sourceCount: 1,
        capacity: 1,
      });

      progressHelpers.startFanoutTask("hiringcafe");
      progressHelpers.updateFanoutTaskTerms("hiringcafe", "Backend", 0, 3);
      progressHelpers.updateFanoutTaskTerms("hiringcafe", "Backend", 1, 3);
      progressHelpers.updateFanoutTaskTerms("hiringcafe", "Platform", 1, 3);
      progressHelpers.settleFanoutTask("hiringcafe", "check");

      expect(getProgress().fanout?.roles).toEqual([
        { role: "Backend", complete: 1, running: 0, queued: 0, check: 0 },
        { role: "Platform", complete: 0, running: 0, queued: 0, check: 1 },
        { role: "Data", complete: 0, running: 0, queued: 1, check: 0 },
      ]);

      progressHelpers.startFanoutTask("hiringcafe");
      progressHelpers.updateFanoutTaskTerms("hiringcafe", "Platform", 1, 3);
      expect(getProgress().fanout?.roles).toEqual([
        { role: "Backend", complete: 1, running: 0, queued: 0, check: 0 },
        { role: "Platform", complete: 0, running: 1, queued: 0, check: 0 },
        { role: "Data", complete: 0, running: 0, queued: 1, check: 0 },
      ]);

      progressHelpers.updateFanoutTaskTerms("hiringcafe", "Platform", 2, 3);
      progressHelpers.updateFanoutTaskTerms("hiringcafe", "Data", 2, 3);
      progressHelpers.updateFanoutTaskTerms("hiringcafe", "Data", 3, 3);
      progressHelpers.settleFanoutTask("hiringcafe", "complete");
      expect(
        getProgress().fanout?.roles.every((role) => role.complete === 1),
      ).toBe(true);
    });
  });

  it("does not reopen completed searches for a detail-page challenge", () => {
    inTenant("fanout-detail-challenge", () => {
      resetProgress();
      progressHelpers.initializeFanout({
        roles: ["Backend"],
        tasks: [{ id: "hiringcafe", unitsPerRole: 1 }],
        locations: ["Amsterdam"],
        sources: ["hiringcafe"],
        locationCount: 1,
        sourceCount: 1,
        capacity: 1,
      });

      progressHelpers.startFanoutTask("hiringcafe");
      progressHelpers.updateFanoutTaskTerms("hiringcafe", "Backend", 0, 1);
      progressHelpers.updateFanoutTaskTerms("hiringcafe", "Backend", 1, 1);
      progressHelpers.settleFanoutTask("hiringcafe", "check");
      progressHelpers.startFanoutTask("hiringcafe");

      expect(getProgress().fanout?.roles).toEqual([
        { role: "Backend", complete: 1, running: 0, queued: 0, check: 0 },
      ]);
    });
  });

  it("does not leak fanout state across tenants", () => {
    inTenant("fanout-a", () => {
      resetProgress();
      progressHelpers.initializeFanout({
        roles: ["Backend"],
        tasks: [{ id: "jobspy", unitsPerRole: 3 }],
        locations: ["Manchester"],
        sources: ["indeed", "linkedin", "glassdoor"],
        locationCount: 1,
        sourceCount: 3,
        capacity: 3,
      });
    });

    inTenant("fanout-b", () => {
      resetProgress();
      expect(getProgress().fanout).toBeUndefined();
    });

    inTenant("fanout-a", () => {
      expect(getProgress().fanout?.roles[0]?.role).toBe("Backend");
    });
  });
});
