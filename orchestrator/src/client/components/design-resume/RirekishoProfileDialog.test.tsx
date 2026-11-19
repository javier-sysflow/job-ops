import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RirekishoProfileDialog } from "./RirekishoProfileDialog";

const mutateAsync = vi.fn();

vi.mock("@/client/hooks/queries/useSettingsMutation", () => ({
  useUpdateSettingsMutation: () => ({ mutateAsync, isPending: false }),
}));

vi.mock("@/client/lib/private-pdf", () => ({
  downloadDesignRirekishoPdf: vi.fn(async () => undefined),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

const IMPORTED_RIREKISHO = {
  basics: {
    name: "山田 花子",
    location: "〒160-0023 東京都新宿区西新宿1-1-1",
    customFields: [
      { id: "1", icon: "", text: "ふりがな：やまだ はなこ", link: "" },
      { id: "2", icon: "", text: "生年月日：1998年10月22日", link: "" },
    ],
  },
  summary: { title: "志望の動機", content: "<p>再エネに携わりたいです。</p>" },
  metadata: { notes: "本人希望記入欄：貴社の規定に従います。" },
};

describe("RirekishoProfileDialog", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue({});
  });

  it("opens with what the imported 履歴書 left in the résumé", () => {
    render(
      <RirekishoProfileDialog
        open
        onOpenChange={() => undefined}
        resumeJson={IMPORTED_RIREKISHO}
        storedProfile={null}
      />,
      { wrapper },
    );

    expect(screen.getByLabelText(/ふりがな \(reading/)).toHaveValue(
      "やまだ はなこ",
    );
    expect(screen.getByLabelText(/生年月日/)).toHaveValue("1998-10-22");
    expect(screen.getByLabelText(/郵便番号 \(postal/)).toHaveValue("160-0023");
    expect(screen.getByLabelText(/現住所 \(current/)).toHaveValue(
      "東京都新宿区西新宿1-1-1",
    );
    expect(screen.getByLabelText(/志望動機 \(base\)/)).toHaveValue(
      "再エネに携わりたいです。",
    );
    expect(screen.getByLabelText("本人希望記入欄")).toHaveValue(
      "貴社の規定に従います。",
    );
    expect(screen.getByRole("button", { name: /^Save$/ })).toBeDisabled();
  });

  it("saves every field, trimmed, as the profile", async () => {
    render(
      <RirekishoProfileDialog
        open
        onOpenChange={() => undefined}
        resumeJson={IMPORTED_RIREKISHO}
        storedProfile={{ gender: "" }}
      />,
      { wrapper },
    );

    fireEvent.change(screen.getByLabelText(/ふりがな \(reading/), {
      target: { value: "  ヤマダ ハナコ " },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    const { rirekishoProfile } = mutateAsync.mock.calls[0][0];
    expect(rirekishoProfile.furigana).toBe("ヤマダ ハナコ");
    expect(rirekishoProfile.birthDate).toBe("1998-10-22");
    expect(rirekishoProfile.gender).toBe("");
    expect(Object.keys(rirekishoProfile)).toHaveLength(13);
  });
});
