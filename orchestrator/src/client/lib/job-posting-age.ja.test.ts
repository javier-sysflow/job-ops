import i18n from "@client/i18n";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { formatPostingAgeLabel } from "./job-posting-age";

const NOW = new Date("2026-05-27T12:00:00.000Z");

describe("formatPostingAgeLabel in Japanese", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("ja");
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("uses Japanese relative ages", () => {
    expect(formatPostingAgeLabel("2026-05-27T09:00:00.000Z", NOW)).toEqual(
      expect.objectContaining({
        label: "3時間前",
        inlineLabel: "掲載：3時間前",
      }),
    );
    expect(formatPostingAgeLabel("2026-05-24", NOW)?.label).toBe("3日前");
    expect(formatPostingAgeLabel("2026-05-13", NOW)?.label).toBe("2週間前");
  });

  it("keeps source-provided labels and translates the wrapper text", () => {
    expect(formatPostingAgeLabel("1 hour ago", NOW)).toEqual(
      expect.objectContaining({
        label: "1 hour ago",
        tooltip: "求人サイトの表記：1 hour ago",
      }),
    );
  });
});
