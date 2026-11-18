import i18n from "@client/i18n";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  formatUserFacingError,
  getErrorMessage,
  localizeErrorMessage,
} from "./error-format";

function apiError(message: string, code?: string, status?: number) {
  return Object.assign(new Error(message), {
    name: "ApiClientError",
    code,
    status,
  });
}

describe("error-format in Japanese", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("ja");
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("shows the translated code message with the server text", () => {
    expect(formatUserFacingError(apiError("Job not found", "NOT_FOUND"))).toBe(
      "対象が見つかりませんでした。（Job not found）",
    );
  });

  it("falls back to the HTTP status when there is no code", () => {
    expect(
      formatUserFacingError(apiError("Upstream exploded", undefined, 502)),
    ).toBe(
      "外部サービスでエラーが発生しました。しばらくしてからもう一度お試しください。（Upstream exploded）",
    );
  });

  it("uses a specific translation for known server messages", () => {
    expect(
      formatUserFacingError(apiError("Invalid credentials", "UNAUTHORIZED")),
    ).toBe("ユーザー名またはパスワードが正しくありません。");
    expect(
      localizeErrorMessage(
        "Server error (502): Expected JSON but received HTML. Is the backend server running?",
      ),
    ).toBe(
      "サーバーエラー（502）: JSON ではなく HTML が返されました。バックエンドサーバーが起動しているか確認してください。",
    );
  });

  it("keeps the English text while api/core builds the error object", () => {
    expect(formatUserFacingError({ message: "Job not found" })).toBe(
      "Job not found",
    );
  });

  it("translates friendly validation messages", () => {
    const raw = JSON.stringify([
      {
        validation: "url",
        code: "invalid_string",
        message: "Invalid url",
        path: ["job", "applicationLink"],
      },
    ]);
    expect(formatUserFacingError(new Error(raw))).toBe(
      "有効な応募URLを入力してください。",
    );
  });

  it("leaves messages without a code untouched", () => {
    expect(getErrorMessage(new Error("Something odd"), "fallback")).toBe(
      "Something odd",
    );
    expect(getErrorMessage("not an error", "フォールバック")).toBe(
      "フォールバック",
    );
  });
});

describe("error-format in English", () => {
  it("returns server text unchanged", () => {
    expect(formatUserFacingError(apiError("Job not found", "NOT_FOUND"))).toBe(
      "Job not found",
    );
    expect(getErrorMessage(apiError("Invalid credentials"), "x")).toBe(
      "Invalid credentials",
    );
  });
});
