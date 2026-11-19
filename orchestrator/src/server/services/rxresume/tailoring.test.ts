import { describe, expect, it } from "vitest";
import { skillItemSchema } from "./schema/v5";
import { applyTailoredSkills, extractProjectsFromResume } from "./tailoring";

describe("applyTailoredSkills", () => {
  it("adds tailored skills when the base résumé has none (e.g. a 履歴書 import)", () => {
    const resume: Record<string, unknown> = {
      sections: { skills: { title: "", hidden: false, items: [] } },
    };

    applyTailoredSkills(
      resume,
      JSON.stringify([
        { name: "法人営業", keywords: ["提案営業", "DPPA"] },
        { name: "  ", keywords: ["dropped: no name"] },
        { name: "語学", keywords: ["英語（IELTS 6.5）", 42] },
      ]),
    );

    const items = (resume.sections as { skills: { items: unknown[] } }).skills
      .items as Array<Record<string, unknown>>;
    expect(items.map((item) => item.name)).toEqual(["法人営業", "語学"]);
    expect(items[1].keywords).toEqual(["英語（IELTS 6.5）"]);
    for (const item of items) {
      expect(skillItemSchema.safeParse(item).success).toBe(true);
      expect(item.hidden).toBe(false);
    }
  });

  it("still reuses the shape of existing skill items", () => {
    const resume: Record<string, unknown> = {
      sections: {
        skills: {
          items: [
            {
              id: "s1",
              hidden: false,
              icon: "code",
              name: "Sales",
              proficiency: "Expert",
              level: 4,
              keywords: ["B2B"],
            },
          ],
        },
      },
    };

    applyTailoredSkills(resume, [{ name: "Sales", keywords: ["Solar"] }]);

    const items = (resume.sections as { skills: { items: unknown[] } }).skills
      .items as Array<Record<string, unknown>>;
    expect(items).toEqual([
      {
        id: "s1",
        hidden: false,
        icon: "code",
        name: "Sales",
        proficiency: "Expert",
        level: 4,
        keywords: ["Solar"],
      },
    ]);
  });

  it("leaves a résumé without a skills section alone", () => {
    const resume: Record<string, unknown> = { sections: {} };
    applyTailoredSkills(resume, [{ name: "Sales", keywords: [] }]);
    expect(resume).toEqual({ sections: {} });
  });
});

describe("rxresume tailoring", () => {
  it("strips html from project catalog descriptions", () => {
    const { catalog, selectionItems } = extractProjectsFromResume({
      sections: {
        projects: {
          items: [
            {
              id: "p1",
              name: "Analytics",
              description:
                "<ul><li><p><strong>Built analytics</strong> using FastAPI.</p></li></ul>",
              hidden: false,
              period: "2024",
            },
          ],
        },
      },
    });

    expect(catalog[0].description).toBe("Built analytics using FastAPI.");
    expect(selectionItems[0].summaryText).toBe(
      "Built analytics using FastAPI.",
    );
  });
});
