import { describe, expect, it } from "vitest";
import { sanitizeProfileForPrompt } from "../scorer";
import { designResumeToProfile } from "./index";

const RIREKISHO_IMPORT = {
  basics: { name: "Test User", headline: "", location: "Ho Chi Minh City" },
  summary: { title: "志望の動機", hidden: false, content: "<p>再エネ営業</p>" },
  sections: {
    experience: {
      title: "職歴",
      hidden: false,
      items: [
        {
          id: "exp1",
          hidden: false,
          company: "株式会社マクニカ",
          position: "",
          location: "",
          period: "2021年4月 - 2024年12月",
          description: "<ul><li>入社</li></ul>",
          roles: [
            {
              id: "r1",
              position: "営業",
              period: "2022年12月 -",
              description: "",
            },
            { id: "r2", position: "", period: "", description: "" },
          ],
        },
      ],
    },
    languages: {
      title: "",
      hidden: false,
      items: [
        {
          id: "l1",
          hidden: false,
          language: "英語",
          fluency: "ビジネス",
          level: 4,
        },
        { id: "l2", hidden: true, language: "Hidden", fluency: "", level: 0 },
      ],
    },
    education: {
      title: "学歴",
      hidden: false,
      items: [
        {
          id: "e1",
          hidden: false,
          school: "University of Sussex",
          degree: "修士",
          area: "サステナビリティ",
          grade: "",
          location: "英国",
          period: "2026年9月 - 2028年9月",
          description: "",
        },
      ],
    },
    certifications: {
      title: "免許・資格",
      hidden: false,
      items: [
        {
          id: "c1",
          hidden: false,
          title: "IELTS（Academic）Overall 6.5",
          issuer: "",
          date: "2026年6月",
          description: "",
        },
      ],
    },
    awards: {
      title: "",
      hidden: true,
      items: [{ id: "a1", hidden: false, title: "Hidden section" }],
    },
  },
};

describe("designResumeToProfile", () => {
  it("gives the scorer languages, education, certifications and roles", async () => {
    const profile = await designResumeToProfile(
      RIREKISHO_IMPORT as unknown as Parameters<
        typeof designResumeToProfile
      >[0],
    );
    const prompt = sanitizeProfileForPrompt(
      profile as unknown as Record<string, unknown>,
    );

    expect(prompt.languages).toEqual([
      { language: "英語", fluency: "ビジネス", level: 4 },
    ]);
    expect(prompt.education).toEqual([
      {
        school: "University of Sussex",
        degree: "修士",
        area: "サステナビリティ",
        location: "英国",
        date: "2026年9月 - 2028年9月",
      },
    ]);
    expect(prompt.certifications).toEqual([
      { title: "IELTS（Academic）Overall 6.5", date: "2026年6月" },
    ]);
    expect(prompt.awards).toEqual([]);
    expect(
      (prompt.experience as Array<Record<string, unknown>>)[0].roles,
    ).toEqual([{ position: "営業", period: "2022年12月 -" }]);
  });
});
