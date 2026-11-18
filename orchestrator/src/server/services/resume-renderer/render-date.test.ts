import { describe, expect, it } from "vitest";
import { formatRenderDate } from "./index";

describe("formatRenderDate", () => {
  const instant = new Date("2026-11-18T20:00:00Z");

  it("dates documents in the user's time zone", () => {
    expect(formatRenderDate("Asia/Tokyo", instant)).toBe("2026-11-19");
    expect(formatRenderDate("America/Los_Angeles", instant)).toBe("2026-11-18");
  });

  it("falls back to the server zone for missing or invalid time zones", () => {
    expect(formatRenderDate(null, instant)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formatRenderDate("Not/AZone", instant)).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });
});
