import { describe, expect, it } from "vitest";
import { parseContentDispositionFileName } from "./core";

describe("parseContentDispositionFileName", () => {
  it("prefers the UTF-8 filename* so Japanese names survive", () => {
    expect(
      parseContentDispositionFileName(
        `attachment; filename="___.docx"; filename*=UTF-8''${encodeURIComponent("職務経歴書_山田.docx")}`,
      ),
    ).toBe("職務経歴書_山田.docx");
  });

  it("falls back to the plain filename", () => {
    expect(
      parseContentDispositionFileName('attachment; filename="resume.docx"'),
    ).toBe("resume.docx");
  });

  it("returns null without a usable header", () => {
    expect(parseContentDispositionFileName(null)).toBeNull();
    expect(parseContentDispositionFileName("attachment")).toBeNull();
  });
});
