import { describe, expect, it } from "vitest";
import {
  EXTRACTOR_SOURCE_IDS,
  EXTRACTOR_SOURCE_METADATA,
  extractorSourceEnum,
  isExtractorSourceId,
  PIPELINE_EXTRACTOR_SOURCE_IDS,
  sourceLabel,
} from "./index";

describe("extractor source catalog", () => {
  it("validates known source ids", () => {
    for (const source of EXTRACTOR_SOURCE_IDS) {
      expect(extractorSourceEnum.parse(source)).toBe(source);
      expect(isExtractorSourceId(source)).toBe(true);
    }
  });

  it("rejects unknown source ids", () => {
    expect(isExtractorSourceId("unknown-source")).toBe(false);
    expect(() => extractorSourceEnum.parse("unknown-source")).toThrow();
  });

  it("provides metadata for every known source", () => {
    for (const source of EXTRACTOR_SOURCE_IDS) {
      expect(EXTRACTOR_SOURCE_METADATA[source]).toBeDefined();
      expect(EXTRACTOR_SOURCE_METADATA[source].label.length).toBeGreaterThan(0);
    }
  });

  it("keeps Hiring Cafe out of search runs but labels its existing jobs", () => {
    expect(PIPELINE_EXTRACTOR_SOURCE_IDS).not.toContain("hiringcafe");
    expect(isExtractorSourceId("hiringcafe")).toBe(true);
    expect(sourceLabel("hiringcafe")).toBe("Hiring Cafe");
  });

  it("keeps Golang Jobs out of search runs", () => {
    expect(PIPELINE_EXTRACTOR_SOURCE_IDS).not.toContain("golangjobs");
    expect(sourceLabel("golangjobs")).toBe("Golang Jobs");
  });

  it("includes naukri as a pipeline source", () => {
    expect(isExtractorSourceId("naukri")).toBe(true);
    expect(EXTRACTOR_SOURCE_METADATA.naukri).toMatchObject({
      label: "Naukri",
      category: "pipeline",
    });
  });
});
