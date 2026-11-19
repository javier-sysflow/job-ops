import { describe, expect, it } from "vitest";
import {
  buildCandidateTargetLocation,
  describeTargetLocationForPrompt,
  withTargetWorkLocation,
} from "./candidate-target-location";

describe("buildCandidateTargetLocation", () => {
  it("uses the searched city and country as the work location", () => {
    const target = buildCandidateTargetLocation({
      country: "japan",
      searchCities: "東京",
      workplaceTypes: '["remote","hybrid"]',
    });
    expect(target).toEqual({
      country: "Japan",
      cities: ["東京"],
      workplaceTypes: ["remote", "hybrid"],
      workLocation: "東京, Japan",
    });
  });

  it("joins several cities", () => {
    expect(
      buildCandidateTargetLocation({
        country: "japan",
        searchCities: "Tokyo|Osaka",
        workplaceTypes: null,
      })?.workLocation,
    ).toBe("Tokyo / Osaka, Japan");
  });

  it("has no in-person work location for remote-only searches", () => {
    const target = buildCandidateTargetLocation({
      country: "japan",
      searchCities: "東京",
      workplaceTypes: '["remote"]',
    });
    expect(target?.workLocation).toBeNull();
    expect(describeTargetLocationForPrompt(target)).toContain(
      "wants remote work",
    );
  });

  it("returns null without a country or city", () => {
    expect(
      buildCandidateTargetLocation({
        country: "worldwide",
        searchCities: "",
        workplaceTypes: '["remote"]',
      }),
    ).toBeNull();
    expect(describeTargetLocationForPrompt(null)).toBe("");
  });

  it("tolerates malformed workplace types", () => {
    expect(
      buildCandidateTargetLocation({
        country: "japan",
        searchCities: null,
        workplaceTypes: "not json",
      }),
    ).toEqual({
      country: "Japan",
      cities: [],
      workplaceTypes: [],
      workLocation: "Japan",
    });
  });
});

describe("withTargetWorkLocation", () => {
  const profile = {
    basics: { headline: "法人営業", location: "Ho Chi Minh City, Vietnam" },
    skills: [],
  };

  it("swaps the résumé address for the target location", () => {
    const target = buildCandidateTargetLocation({
      country: "japan",
      searchCities: "東京",
      workplaceTypes: '["hybrid"]',
    });
    expect(withTargetWorkLocation(profile, target)).toEqual({
      basics: { headline: "法人営業", location: "東京, Japan" },
      skills: [],
    });
    expect(profile.basics.location).toBe("Ho Chi Minh City, Vietnam");
    expect(describeTargetLocationForPrompt(target)).toContain(
      "do not count moving or relocating there against the candidate",
    );
  });

  it("keeps the résumé address for remote-only searches", () => {
    const target = buildCandidateTargetLocation({
      country: "japan",
      searchCities: null,
      workplaceTypes: '["remote"]',
    });
    expect(withTargetWorkLocation(profile, target)).toBe(profile);
  });
});
