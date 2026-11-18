import type {
  DesignResumeDocument,
  PdfRenderer,
  TypstTheme,
} from "@shared/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DesignResumePreviewPanel } from "./DesignResumePreviewPanel";

vi.mock("./DesignResumePdfPreview", () => ({
  DesignResumePdfPreview: () => null,
}));

function renderPanel(
  pdfRenderer: PdfRenderer,
  typstTheme: TypstTheme,
  isUpdatingRenderer = false,
) {
  const onResumeLayoutChange = vi.fn();
  render(
    <DesignResumePreviewPanel
      draft={{} as DesignResumeDocument}
      pdfRenderer={pdfRenderer}
      typstTheme={typstTheme}
      isUpdatingRenderer={isUpdatingRenderer}
      isDirty={false}
      saveState="idle"
      onPdfRendererChange={vi.fn()}
      onTypstThemeChange={vi.fn()}
      onResumeLayoutChange={onResumeLayoutChange}
    />,
  );
  return { onResumeLayoutChange };
}

const japaneseButton = () =>
  screen.getByRole("button", { name: "職務経歴書 (Japanese)" });
const englishButton = () =>
  screen.getByRole("button", { name: "English resume" });

describe("DesignResumePreviewPanel layout switch", () => {
  it("marks 職務経歴書 as active when the Japanese theme is in use", () => {
    renderPanel("typst", "shokumu-keirekisho");
    expect(japaneseButton()).toHaveAttribute("aria-pressed", "true");
    expect(englishButton()).toHaveAttribute("aria-pressed", "false");
  });

  it("treats any other template as the English layout", () => {
    renderPanel("rxresume", "shokumu-keirekisho");
    expect(englishButton()).toHaveAttribute("aria-pressed", "true");
    expect(japaneseButton()).toHaveAttribute("aria-pressed", "false");
  });

  it("asks for the Japanese layout in one click", () => {
    const { onResumeLayoutChange } = renderPanel("typst", "classic");
    fireEvent.click(japaneseButton());
    expect(onResumeLayoutChange).toHaveBeenCalledWith("japanese");
  });

  it("disables the switch while settings are updating", () => {
    renderPanel("typst", "classic", true);
    expect(japaneseButton()).toBeDisabled();
    expect(englishButton()).toBeDisabled();
  });
});
