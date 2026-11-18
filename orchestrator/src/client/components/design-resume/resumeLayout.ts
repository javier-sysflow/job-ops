import type { PdfRenderer, TypstTheme } from "@shared/types";

/**
 * The two layouts Resume Studio offers as a one-click choice, so nobody has
 * to dig through the renderer and theme dropdowns to find the Japanese one.
 */
export const RESUME_LAYOUTS = ["japanese", "english"] as const;
export type ResumeLayout = (typeof RESUME_LAYOUTS)[number];

export const JAPANESE_TYPST_THEME: TypstTheme = "shokumu-keirekisho";
const ENGLISH_TYPST_THEME: TypstTheme = "classic";

export function getResumeLayout(
  renderer: PdfRenderer,
  theme: TypstTheme,
): ResumeLayout {
  return renderer === "typst" && theme === JAPANESE_TYPST_THEME
    ? "japanese"
    : "english";
}

/** The settings that switch every generated PDF to the given layout. */
export function resumeLayoutSettings(layout: ResumeLayout): {
  pdfRenderer: PdfRenderer;
  typstTheme: TypstTheme;
} {
  return {
    pdfRenderer: "typst",
    typstTheme:
      layout === "japanese" ? JAPANESE_TYPST_THEME : ENGLISH_TYPST_THEME,
  };
}
