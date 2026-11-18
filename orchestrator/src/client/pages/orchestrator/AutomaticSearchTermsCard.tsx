import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AutomaticChoiceCardGroup } from "./AutomaticChoiceCardGroup";
import {
  type AutomaticPresetId,
  type AutomaticPresetSelection,
  parseSearchTermsInput,
} from "./automatic-run";
import { TokenizedInput } from "./TokenizedInput";

interface AutomaticSearchTermsCardProps {
  selectedPreset: AutomaticPresetSelection;
  searchTerms: string[];
  searchTermDraft: string;
  onApplyPreset: (presetId: AutomaticPresetId) => void;
  onSelectCustomPreset: () => void;
  onSearchTermDraftChange: (value: string) => void;
  onSearchTermsChange: (value: string[]) => void;
}

export function AutomaticSearchTermsCard({
  selectedPreset,
  searchTerms,
  searchTermDraft,
  onApplyPreset,
  onSelectCustomPreset,
  onSearchTermDraftChange,
  onSearchTermsChange,
}: AutomaticSearchTermsCardProps) {
  const { t } = useTranslation(["pipeline", "common"]);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold text-muted-foreground">
            1
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle>{t("terms.title")}</CardTitle>
            <CardDescription>{t("terms.description")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="search-terms-input">{t("terms.label")}</Label>
          <TokenizedInput
            id="search-terms-input"
            values={searchTerms}
            draft={searchTermDraft}
            parseInput={parseSearchTermsInput}
            onDraftChange={onSearchTermDraftChange}
            onValuesChange={onSearchTermsChange}
            placeholder={t("terms.placeholder")}
            helperText={t("terms.helper")}
            removeLabelPrefix={t("common:actions.remove")}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label>{t("terms.depth")}</Label>
          <AutomaticChoiceCardGroup
            ariaLabel={t("terms.depth")}
            value={selectedPreset}
            columns={4}
            options={[
              {
                value: "fast",
                label: t("presets.fast.label"),
                description: t("presets.fast.description"),
              },
              {
                value: "balanced",
                label: t("presets.balanced.label"),
                description: t("presets.balanced.description"),
              },
              {
                value: "detailed",
                label: t("presets.detailed.label"),
                description: t("presets.detailed.description"),
              },
              {
                value: "custom",
                label: t("presets.custom.label"),
                description: t("presets.custom.description"),
              },
            ]}
            onValueChange={(preset) => {
              if (preset === "custom") onSelectCustomPreset();
              else onApplyPreset(preset as AutomaticPresetId);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
