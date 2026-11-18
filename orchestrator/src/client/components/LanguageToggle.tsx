import type React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { changeUiLanguage } from "../i18n";

/**
 * One-click English/Japanese switch. Shows the language you would switch
 * to, written in that language, so it is recognisable either way.
 */
export const LanguageToggle: React.FC<{ className?: string }> = ({
  className,
}) => {
  const { t, i18n } = useTranslation();
  const isJapanese = i18n.language === "ja";
  const targetLabel = isJapanese
    ? t("language.english")
    : t("language.japanese");

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className ?? "h-9 shrink-0 px-2 text-xs font-medium"}
      aria-label={t("language.switchTo", { language: targetLabel })}
      title={t("language.switchTo", { language: targetLabel })}
      onClick={() => changeUiLanguage(isJapanese ? "en" : "ja")}
    >
      {targetLabel}
    </Button>
  );
};
