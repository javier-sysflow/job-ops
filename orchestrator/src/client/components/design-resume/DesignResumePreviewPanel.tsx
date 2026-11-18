import { typstThemeLabel } from "@client/i18n/labels";
import type {
  DesignResumeDocument,
  PdfRenderer,
  TypstTheme,
} from "@shared/types";
import { PDF_RENDERER_VALUES, TYPST_THEME_VALUES } from "@shared/types";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DesignResumePdfPreview } from "./DesignResumePdfPreview";
import {
  getResumeLayout,
  RESUME_LAYOUTS,
  type ResumeLayout,
} from "./resumeLayout";

type DesignResumePreviewPanelProps = {
  draft: DesignResumeDocument;
  pdfRenderer: PdfRenderer;
  typstTheme: TypstTheme;
  isUpdatingRenderer: boolean;
  isDirty: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
  onPdfRendererChange: (renderer: PdfRenderer) => void;
  onTypstThemeChange: (theme: TypstTheme) => void;
  onResumeLayoutChange: (layout: ResumeLayout) => void;
  className?: string;
};

export function DesignResumePreviewPanel({
  draft,
  pdfRenderer,
  typstTheme,
  isUpdatingRenderer,
  isDirty,
  saveState,
  onPdfRendererChange,
  onTypstThemeChange,
  onResumeLayoutChange,
  className,
}: DesignResumePreviewPanelProps) {
  const { t } = useTranslation("resumeStudio");
  const resumeLayout = getResumeLayout(pdfRenderer, typstTheme);
  return (
    <section
      className={cn("flex min-h-0 min-w-0 flex-col overflow-hidden", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 py-4">
        <fieldset
          aria-label={t("preview.layout.label")}
          className="inline-flex w-full rounded-lg border border-border bg-muted/50 p-1 sm:w-auto"
        >
          {RESUME_LAYOUTS.map((layout) => {
            const active = layout === resumeLayout;
            return (
              <button
                key={layout}
                type="button"
                aria-pressed={active}
                disabled={isUpdatingRenderer}
                onClick={() => onResumeLayoutChange(layout)}
                className={cn(
                  "flex-1 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`preview.layout.${layout}`)}
              </button>
            );
          })}
        </fieldset>
        <div className="flex w-full flex-wrap items-start justify-end gap-4 sm:w-auto">
          <Select
            value={pdfRenderer}
            onValueChange={(value) => onPdfRendererChange(value as PdfRenderer)}
            disabled={isUpdatingRenderer}
          >
            <SelectTrigger
              id="design-resume-template"
              className="w-full sm:w-72"
            >
              <SelectValue placeholder={t("preview.chooseTemplate")} />
            </SelectTrigger>
            <SelectContent>
              {PDF_RENDERER_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`preview.renderers.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pdfRenderer === "typst" ? (
            <Select
              value={typstTheme}
              onValueChange={(value) => onTypstThemeChange(value as TypstTheme)}
              disabled={isUpdatingRenderer}
            >
              <SelectTrigger
                id="design-resume-typst-theme"
                className="w-full sm:w-64"
              >
                <SelectValue placeholder={t("preview.chooseTypstTheme")} />
              </SelectTrigger>
              <SelectContent>
                {TYPST_THEME_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {typstThemeLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <DesignResumePdfPreview
          draft={draft}
          pdfRenderer={pdfRenderer}
          typstTheme={typstTheme}
          isUpdatingRenderer={isUpdatingRenderer}
          isDirty={isDirty}
          saveState={saveState}
        />
      </div>
    </section>
  );
}
